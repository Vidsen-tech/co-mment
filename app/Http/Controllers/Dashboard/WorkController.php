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
    // The `index` method is unchanged and correct.
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
                    'performance_date' => $s->performance_date ? $s->performance_date->format('Y-m-d H:i') : null,
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

    // The `store` method is unchanged and correct.
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
                $this->syncShowings($work, $validated['showings']);
            }
            if ($request->hasFile('images')) {
                $this->processAndAttachImages($work, $request->file('images', []), $request->input('image_data', []));
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
        // ★★★ THE FINAL FIX IS HERE ★★★
        // The validation is now IDENTICAL to your working NewsController.
        // We are not validating the nested keys of `ordered_images`.
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
            'ordered_images'                => 'required|array', // This is the key change
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

            $this->processOrderedImageUpdates(
                $work,
                $validated['ordered_images'],
                $request->file('new_images', [])
            );

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
        $work->update(['is_active' => false]);
        return redirect()->route('works.index')->with('success', 'Rad arhiviran.');
    }

    private function syncShowings(Work $work, array $showingsData): void
    {
        $incomingIds = array_filter(array_column($showingsData, 'id'));
        $work->showings()->whereNotIn('id', $incomingIds)->delete();
        foreach ($showingsData as $showingDatum) {
            $work->showings()->updateOrCreate(['id' => $showingDatum['id'] ?? null], $showingDatum);
        }
    }

    private function processAndAttachImages(Work $work, array $uploadedImages, array $imageData): void
    {
        foreach ($uploadedImages as $index => $file) {
            if (!$file->isValid()) continue;

            $path = $file->store('work-images', 'public');
            if ($path === false) throw new \Exception("Could not save file for new work.");

            WorkImage::create([
                'work_id'      => $work->id,
                'path'         => $path,
                'author'       => $imageData[$index]['author'] ?? null,
                'is_thumbnail' => $imageData[$index]['is_thumbnail'] ?? false,
                'order_column' => $index,
            ]);
        }
    }

    // ★★★ FIX: The function signature and logic now mirrors the working NewsController. ★★★
    private function processOrderedImageUpdates(Work $work, array $orderedImages, array $newImageFiles): void
    {
        $existingImageIds = $work->images()->pluck('id')->all();
        $incomingImageIds = [];
        $newFileCounter = 0;

        foreach ($orderedImages as $order => $imageData) {
            $isNew = $imageData['is_new'] ?? false;

            if ($isNew) {
                $file = $newImageFiles[$newFileCounter] ?? null;

                if ($file && $file->isValid()) {
                    $path = $file->store('work-images', 'public');
                    if (!$path) throw new \Exception("Could not save new file to disk for work ID {$work->id}.");

                    WorkImage::create([
                        'work_id'      => $work->id,
                        'path'         => $path,
                        'author'       => $imageData['author'],
                        'is_thumbnail' => $imageData['is_thumbnail'],
                        'order_column' => $order,
                    ]);
                    $newFileCounter++;
                }
            } else {
                $id = $imageData['id'];
                $incomingImageIds[] = $id;

                WorkImage::where('id', $id)->where('work_id', $work->id)->update([
                    'order_column' => $order,
                    'author'       => $imageData['author'],
                    'is_thumbnail' => $imageData['is_thumbnail'],
                ]);
            }
        }

        $idsToDelete = array_diff($existingImageIds, $incomingImageIds);
        if (!empty($idsToDelete)) {
            $imagesToDelete = WorkImage::whereIn('id', $idsToDelete)->get();
            foreach ($imagesToDelete as $img) {
                Storage::disk('public')->delete($img->path);
                $img->delete();
            }
        }
    }
}
