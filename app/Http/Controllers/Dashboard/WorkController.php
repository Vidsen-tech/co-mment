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
        $query = Work::with(['thumbnail', 'translation', 'showings'])->latest('premiere_date');

        if ($search = $request->input('search')) {
            $query->whereHas('translations', function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%");
            });
        }

        $worksPaginated = $query->paginate($request->input('perPage', 20))->withQueryString();

        $worksPaginated->getCollection()->transform(function (Work $work) {
            // ★★★ FIX 1: Properly decode the JSON description for EACH translation ★★★
            $translations = $work->translations->mapWithKeys(function ($t) {
                // Safely decode, providing a default structure if it's not valid JSON
                $descriptionData = json_decode($t->description, true) ?: ['main' => $t->description, 'credits' => []];

                return [
                    $t->locale => [
                        'title'       => $t->title,
                        'description' => $descriptionData['main'] ?? '', // Send only the main text
                        'credits'     => $descriptionData['credits'] ?? [], // Send credits as an array/object
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
                'images'        => $work->images->map(fn ($img) => [
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
                    'external_link'    => $s->external_link, // ★ Add this line
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
        // ★★★ FIX 2: Update validation to expect 'description' as string and 'credits' as array ★★★
        $validated = $request->validate([
            'translations'                      => 'required|array:en,hr',
            'translations.hr.title'             => 'required|string|max:255|unique:work_translations,title',
            'translations.hr.description'       => 'required|string',
            'translations.hr.credits'           => 'nullable|array',
            'translations.en.title'             => 'nullable|string|max:255',
            'translations.en.description'       => 'nullable|string',
            'translations.en.credits'           => 'nullable|array',
            'premiere_date'                     => 'required|date',
            'images'                            => 'nullable|array',
            'images.*'                          => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:8000',
            'image_authors'                     => 'nullable|array',
            'image_authors.*'                   => 'nullable|string|max:255',
            'existing_image_authors'      => 'nullable|array',
            'thumbnail_index'                   => 'nullable|integer|min:0',
            'showings'                          => 'nullable|array',
            'showings.*.performance_date'       => 'required|date',
            'showings.*.location'               => 'required|string|max:255',
            'showings.*.news_id'                => 'nullable|integer|exists:news,id',
            'showings.*.external_link'          => 'nullable|url|max:2048',
        ]);

        DB::beginTransaction();
        try {
            $work = Work::create([
                'slug'          => Str::slug($validated['translations']['hr']['title']),
                'premiere_date' => $validated['premiere_date'],
                'is_active'     => true,
            ]);

            foreach ($validated['translations'] as $locale => $data) {
                if (!empty($data['title'])) {
                    // ★★★ FIX 3: Re-encode the description and credits into our structured JSON format ★★★
                    $descriptionPayload = json_encode([
                        'main'    => $data['description'],
                        'credits' => $data['credits'] ?? [],
                    ]);
                    $work->translations()->create([
                        'locale'      => $locale,
                        'title'       => $data['title'],
                        'description' => $descriptionPayload,
                    ]);
                }
            }

            if (!empty($validated['showings'])) {
                $work->showings()->createMany($validated['showings']);
            }
            if ($request->hasFile('images')) {
                $this->processAndAttachImages($request, $work);
            }

            DB::commit();
            return redirect()->route('works.index')->with('success', 'Rad uspješno stvoren!');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Work Store Error: " . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return back()->withInput()->with('error', 'Greška pri spremanju rada.');
        }
    }

    public function update(Request $request, Work $work): RedirectResponse
    {
        // ★★★ FIX 4: Update validation for the update method as well ★★★
        $validated = $request->validate([
            'translations'                      => 'required|array:en,hr',
            'translations.hr.title'             => ['required', 'string', 'max:255', Rule::unique('work_translations', 'title')->where('locale', 'hr')->ignore($work->id, 'work_id')],
            'translations.hr.description'       => 'required|string',
            'translations.hr.credits'           => 'nullable|array',
            'translations.en.title'             => ['nullable', 'string', 'max:255', Rule::unique('work_translations', 'title')->where('locale', 'en')->ignore($work->id, 'work_id')],
            'translations.en.description'       => 'nullable|string',
            'translations.en.credits'           => 'nullable|array',
            'premiere_date'                     => 'required|date',
            'is_active'                         => 'required|boolean',
            'showings'                          => 'nullable|array',
            'showings.*.id'                     => 'nullable|integer|exists:showings,id',
            'showings.*.performance_date'       => 'required|date',
            'showings.*.location'               => 'required|string|max:255',
            'showings.*.news_id'                => 'nullable|integer|exists:news,id',
            'new_images'                        => 'nullable|array',
            'new_images.*'                      => 'image|mimes:jpeg,png,jpg,gif,webp|max:4096',
            'new_image_authors'                 => 'nullable|array',
            'existing_images_authors'           => 'nullable|array', // ★★★ NEW: For updating existing image authors (for a later step)
            'remove_image_ids'                  => 'nullable|array',
            'remove_image_ids.*'                => 'integer|exists:work_images,id,work_id,' . $work->id,
            'thumbnail_image_id'                => 'nullable|integer|exists:work_images,id,work_id,' . $work->id,
            'new_thumbnail_index'               => 'nullable|integer|min:0',
            'showings.*.external_link'          => 'nullable|url|max:2048',
        ]);

        DB::beginTransaction();
        try {
            $work->update([
                'slug'          => Str::slug($validated['translations']['hr']['title']),
                'premiere_date' => $validated['premiere_date'],
                'is_active'     => $validated['is_active'],
            ]);

            foreach ($validated['translations'] as $locale => $data) {
                if (!empty($data['title'])) {
                    // ★★★ FIX 5: Encode the JSON payload on update too ★★★
                    $descriptionPayload = json_encode([
                        'main'    => $data['description'],
                        'credits' => $data['credits'] ?? [],
                    ]);
                    $work->translations()->updateOrCreate(
                        ['locale' => $locale],
                        ['title' => $data['title'], 'description' => $descriptionPayload]
                    );
                } else {
                    $work->translations()->where('locale', $locale)->delete();
                }
            }

            // Update showings
            $existingShowingIds = [];
            if (!empty($validated['showings'])) {
                foreach ($validated['showings'] as $showingData) {
                    if (isset($showingData['id']) && is_numeric($showingData['id'])) {
                        $showing = $work->showings()->find($showingData['id']);
                        $showing?->update($showingData);
                        $existingShowingIds[] = $showingData['id'];
                    } else {
                        $newShowing = $work->showings()->create($showingData);
                        $existingShowingIds[] = $newShowing->id;
                    }
                }
            }
            $work->showings()->whereNotIn('id', $existingShowingIds)->delete();

            $this->processImageUpdates($request, $work);
            DB::commit();
            return redirect()->route('works.index')->with('success', 'Rad uspješno ažuriran!');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Work Update Error for Work ID {$work->id}: " . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return back()->withInput()->with('error', 'Greška pri ažuriranju rada.');
        }
    }

    // No changes needed for destroy, processAndAttachImages, or processImageUpdates for THIS step.
    // I am including them so you have the one complete, correct file.

    public function destroy(Work $work): RedirectResponse
    {
        $work->update(['is_active' => false]);
        return redirect()->route('works.index')->with('success', 'Rad deaktiviran.');
    }

    private function processAndAttachImages(Request $request, Work $work): void
    {
        if (!$request->hasFile('images')) return;
        $uploadedImages = $request->file('images');
        $imageAuthors = $request->input('image_authors', []);
        $thumbnailIndex = $request->input('thumbnail_index');
        foreach ($uploadedImages as $index => $file) {
            if (!$file->isValid()) continue;
            $path = $file->store('work-images', 'public');
            WorkImage::create(['work_id' => $work->id, 'path' => $path, 'author' => $imageAuthors[$index] ?? null, 'is_thumbnail' => (int)$thumbnailIndex === $index,]);
        }
    }

    private function processImageUpdates(Request $request, Work $work): void
    {
        // ★★★ START: NEW LOGIC FOR UPDATING EXISTING IMAGES ★★★
        if ($request->filled('existing_image_authors')) {
            foreach ($request->input('existing_image_authors') as $imageId => $author) {
                $work->images()->where('id', $imageId)->update(['author' => $author]);
            }
        }
        // ★★★ END: NEW LOGIC ★★★

        if ($request->filled('remove_image_ids')) {
            $imagesToRemove = WorkImage::whereIn('id', $request->input('remove_image_ids'))->where('work_id', $work->id)->get();
            foreach ($imagesToRemove as $img) {
                Storage::disk('public')->delete($img->path);
                $img->delete();
            }
        }
        $newImageIds = [];
        if ($request->hasFile('new_images')) {
            foreach ($request->file('new_images') as $index => $file) {
                if (!$file->isValid()) continue;
                $path = $file->store('work-images', 'public');
                $newImage = WorkImage::create(['work_id' => $work->id, 'path' => $path, 'author' => $request->input("new_image_authors.{$index}") ?? null, 'is_thumbnail' => false,]);
                $newImageIds[$index] = $newImage->id;
            }
        }
        $newThumbnailId = null;
        if ($request->filled('new_thumbnail_index') && isset($newImageIds[$request->input('new_thumbnail_index')])) {
            $newThumbnailId = $newImageIds[$request->input('new_thumbnail_index')];
        } elseif ($request->filled('thumbnail_image_id')) {
            $newThumbnailId = $request->input('thumbnail_image_id');
        }
        WorkImage::where('work_id', $work->id)->update(['is_thumbnail' => false]);
        if ($newThumbnailId) {
            WorkImage::where('id', $newThumbnailId)->update(['is_thumbnail' => true]);
        } elseif ($firstImage = $work->images()->first()) {
            $firstImage->update(['is_thumbnail' => true]);
        }
    }
}
