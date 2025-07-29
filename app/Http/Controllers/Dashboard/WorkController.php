<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\News;
use App\Models\Work;
use App\Models\WorkImage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class WorkController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Work::with(['translations', 'showings'])->latest('premiere_date');

        if ($search = $request->input('search')) {
            $query->whereHas('translations', function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%");
            });
        }

        $worksPaginated = $query->paginate($request->input('perPage', 20))->withQueryString();

        $worksPaginated->getCollection()->transform(function (Work $work) {
            $translations = $work->translations->mapWithKeys(function ($t) {
                $descriptionData = json_decode($t->description, true) ?: ['main' => $t->description, 'credits' => []];
                return [
                    $t->locale => [
                        'title'       => $t->title,
                        'description' => $descriptionData['main'] ?? '',
                        'credits'     => $descriptionData['credits'] ?? [],
                    ]
                ];
            });

            return [
                'id'            => $work->id,
                'slug'          => $work->slug,
                'title'         => $work->title,
                'premiere_date' => $work->premiere_date->format('Y-m-d'),
                'is_active'     => $work->is_active,
                'thumbnail_url' => $work->thumbnail_url,
                'images'        => $work->images()->orderBy('order_column')->get()->map(fn ($img) => [
                    'id'           => $img->id,
                    'url'          => $img->url,
                    'author'       => $img->author,
                    'is_thumbnail' => $img->is_thumbnail,
                ])->all(),
                'showings'      => $work->showings->map(fn ($s) => [
                    'id'               => $s->id,
                    'performance_date' => $s->performance_date->format('Y-m-d H:i'),
                    'location'         => $s->location,
                    'news_id'          => $s->news_id,
                    'external_link'    => $s->external_link,
                ]),
                'translations'  => $translations,
                'created_at'    => $work->created_at->format('d. m. Y H:i'),
                'updated_at'    => $work->updated_at->format('d. m. Y H:i'),
            ];
        });

        $newsList = News::query()
            ->join('news_translations', 'news.id', '=', 'news_translations.news_id')
            ->where('news_translations.locale', app()->getLocale())
            ->select('news.id', 'news_translations.title')
            ->orderBy('news.date', 'desc')
            ->get();

        return Inertia::render('dashboard/works/Index', [
            'works'    => $worksPaginated,
            'filters'  => $request->only(['search']),
            'newsList' => $newsList,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'translations'                  => 'required|array:en,hr',
            'translations.hr.title'         => 'required|string|max:255|unique:work_translations,title',
            'translations.hr.description'   => 'required|string',
            'translations.hr.credits'       => 'nullable|array',
            'translations.en.title'         => 'nullable|string|max:255',
            'translations.en.description'   => 'nullable|string',
            'translations.en.credits'       => 'nullable|array',
            'premiere_date'                 => 'required|date',
            'showings'                      => 'nullable|array',
            'images'                        => 'nullable|array',
            'images.*'                      => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:65536',
            'image_data'                    => 'nullable|array',
            'image_data.*.author'           => 'nullable|string|max:255',
            'image_data.*.is_thumbnail'     => 'required|boolean',
        ], ['images.*.max' => 'Slika ne smije biti veća od 64MB.']);

        DB::beginTransaction();
        try {
            $work = Work::create([
                'slug' => Str::slug($validated['translations']['hr']['title']),
                'premiere_date' => $validated['premiere_date'],
            ]);

            foreach ($validated['translations'] as $locale => $data) {
                if (!empty($data['title'])) {
                    $descriptionPayload = json_encode(['main' => $data['description'], 'credits' => $data['credits'] ?? []]);
                    $work->translations()->create(['locale' => $locale, 'title' => $data['title'], 'description' => $descriptionPayload]);
                }
            }
            if (isset($validated['showings'])) {
                $work->showings()->createMany($validated['showings']);
            }
            if ($request->hasFile('images')) {
                $this->processAndAttachImages($request, $work);
            }
            DB::commit();
            return redirect()->route('works.index')->with('success', 'Rad uspješno stvoren!');
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error("Work Store Error: " . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return back()->with('error', 'Greška pri spremanju rada: ' . $e->getMessage());
        }
    }

    public function update(Request $request, Work $work): RedirectResponse
    {
        // ★★★ FIX: Added detailed validation for all incoming data structures ★★★
        $validated = $request->validate([
            'translations'                  => 'required|array:en,hr',
            'translations.hr.title'         => ['required', 'string', 'max:255', Rule::unique('work_translations', 'title')->where('locale', 'hr')->ignore($work->id, 'work_id')],
            'translations.hr.description'   => 'required|string',
            'translations.hr.credits'       => 'nullable|array',
            'translations.en.title'         => ['nullable', 'string', 'max:255', Rule::unique('work_translations', 'title')->where('locale', 'en')->ignore($work->id, 'work_id')],
            'translations.en.description'   => 'nullable|string',
            'translations.en.credits'       => 'nullable|array',
            'premiere_date'                 => 'required|date',
            'is_active'                     => 'required|boolean',
            'showings'                      => 'nullable|array',
            'ordered_images'                => 'required|array',
            'ordered_images.*.author'       => 'nullable|string|max:255',
            'ordered_images.*.is_thumbnail' => 'required|boolean',
            'ordered_images.*.is_new'       => 'required|boolean',
            'new_images'                    => 'nullable|array',
            'new_images.*'                  => 'image|mimes:jpeg,png,jpg,gif,webp|max:65536',
        ], ['new_images.*.max' => 'Slika ne smije biti veća od 64MB.']);

        DB::beginTransaction();
        try {
            $work->update([
                'slug' => Str::slug($validated['translations']['hr']['title']),
                'premiere_date' => $validated['premiere_date'],
                'is_active' => $validated['is_active'],
            ]);

            foreach ($validated['translations'] as $locale => $data) {
                $descriptionPayload = json_encode(['main' => $data['description'] ?? '', 'credits' => $data['credits'] ?? []]);
                if (!empty($data['title'])) {
                    $work->translations()->updateOrCreate(['locale' => $locale], ['title' => $data['title'], 'description' => $descriptionPayload]);
                } else {
                    $work->translations()->where('locale', $locale)->delete();
                }
            }

            $this->syncShowings($work, $validated['showings'] ?? []);

            // ★★★ FIX: Pass the necessary data to the processing function ★★★
            $this->processOrderedImageUpdates($request, $work, $validated['ordered_images']);

            DB::commit();
            return redirect()->route('works.index')->with('success', 'Rad uspješno ažuriran!');
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error("Work Update Error for Work ID {$work->id}: " . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return back()->with('error', 'Greška pri ažuriranju rada: ' . $e->getMessage());
        }
    }

    public function destroy(Work $work): RedirectResponse
    {
        DB::transaction(function() use ($work) {
            $work->showings()->delete();
            $work->translations()->delete();
            foreach ($work->images as $image) {
                Storage::disk('public')->delete($image->path);
                $image->delete();
            }
            $work->delete();
        });

        return redirect()->route('works.index')->with('success', 'Rad trajno obrisan.');
    }

    private function syncShowings(Work $work, array $showingsData): void
    {
        $incomingIds = array_filter(array_column($showingsData, 'id'));
        $work->showings()->whereNotIn('id', $incomingIds)->delete();
        foreach ($showingsData as $showingDatum) {
            $work->showings()->updateOrCreate(['id' => $showingDatum['id'] ?? null], $showingDatum);
        }
    }

    private function processAndAttachImages(Request $request, Work $work): void
    {
        if (!$request->hasFile('images')) return;

        $uploadedImages = $request->file('images');
        $imageData = $request->input('image_data', []);

        foreach ($uploadedImages as $index => $file) {
            if (!$file->isValid()) continue;

            $path = $file->store('work-images', 'public');
            if ($path === false) {
                throw new \Exception("Could not save file for new work.");
            }

            WorkImage::create([
                'work_id'      => $work->id,
                'path'         => $path,
                'author'       => $imageData[$index]['author'] ?? null,
                'is_thumbnail' => $imageData[$index]['is_thumbnail'] ?? false,
                'order_column' => $index,
            ]);
        }
    }

    private function processOrderedImageUpdates(Request $request, Work $work, array $orderedImages): void
    {
        $existingImageIds = $work->images()->pluck('id')->all();
        $incomingImageIds = [];

        // ★★★ FIX: This is the core logic ★★★
        // We get the new files sent under the `new_images` key.
        $newImageFiles = $request->file('new_images', []);
        $newImageCounter = 0;

        foreach ($orderedImages as $index => $imageData) {
            // Case 1: This is a new image uploaded by the user.
            if ($imageData['is_new']) {
                // We find the corresponding file from the `$newImageFiles` array.
                $file = $newImageFiles[$newImageCounter] ?? null;

                if ($file && $file->isValid()) {
                    $path = $file->store('work-images', 'public');
                    if ($path === false) throw new \Exception("Could not save new file to disk.");

                    WorkImage::create([
                        'work_id'      => $work->id,
                        'path'         => $path,
                        'author'       => $imageData['author'],
                        'is_thumbnail' => $imageData['is_thumbnail'],
                        'order_column' => $index,
                    ]);
                    $newImageCounter++; // We increment the counter to get the next file on the next iteration.
                }
            }
            // Case 2: This is an existing image that needs its order or metadata updated.
            else {
                $id = $imageData['id'];
                $incomingImageIds[] = $id; // Add its ID to the list of images to keep.

                $work->images()->where('id', $id)->update([
                    'order_column' => $index,
                    'author'       => $imageData['author'],
                    'is_thumbnail' => $imageData['is_thumbnail'],
                ]);
            }
        }

        // Case 3: Clean up. Any existing images that were not in the final submission are deleted.
        $idsToDelete = array_diff($existingImageIds, $incomingImageIds);
        if (!empty($idsToDelete)) {
            $imagesToDelete = WorkImage::whereIn('id', $idsToDelete)->get();
            foreach($imagesToDelete as $img) {
                Storage::disk('public')->delete($img->path);
                $img->delete();
            }
        }
    }
}
