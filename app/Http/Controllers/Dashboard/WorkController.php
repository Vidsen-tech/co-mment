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
        $query = Work::with(['thumbnail', 'translations', 'showings'])->latest('premiere_date');

        if ($search = $request->input('search')) {
            $query->whereHas('translations', function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%");
            });
        }

        $worksPaginated = $query->paginate($request->input('perPage', 20))->withQueryString();

        $worksPaginated->getCollection()->transform(function (Work $work) {
            $translations = $work->translations->mapWithKeys(function ($t) {
                // Safely decode the description JSON, providing a default structure
                $descriptionData = json_decode($t->description, true) ?: ['main' => $t->description, 'credits' => (object)[]];

                return [
                    $t->locale => [
                        'title'       => $t->title,
                        'description' => $descriptionData['main'] ?? '',
                        'credits'     => $descriptionData['credits'] ?? (object)[],
                    ]
                ];
            });

            return [
                'id'            => $work->id,
                'slug'          => $work->slug,
                'title'         => $work->title, // Main title for the current locale
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
        // ★★★ FIX: Adjusted validation to expect credits as an object and thumbnail index as a number ★★★
        $validated = $request->validate([
            'translations'                => 'required|array:en,hr',
            'translations.hr.title'       => 'required|string|max:255|unique:work_translations,title',
            'translations.hr.description' => 'required|string',
            'translations.hr.credits'     => 'nullable|array',
            'translations.en.title'       => 'nullable|string|max:255',
            'translations.en.description' => 'nullable|string',
            'translations.en.credits'     => 'nullable|array',
            'premiere_date'               => 'required|date',
            'images'                      => 'nullable|array',
            'images.*'                    => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:8192', // 8MB
            'image_authors'               => 'nullable|array',
            'image_authors.*'             => 'nullable|string|max:255',
            'thumbnail_index'             => 'nullable|integer|min:0',
            'showings'                    => 'nullable|array',
            'showings.*.performance_date' => 'required|date',
            'showings.*.location'         => 'required|string|max:255',
            'showings.*.news_id'          => 'nullable|integer|exists:news,id',
            'showings.*.external_link'    => 'nullable|url:http,https|max:2048',
        ]);

        DB::beginTransaction();
        try {
            $work = Work::create([
                'slug'          => Str::slug($validated['translations']['hr']['title']),
                'premiere_date' => $validated['premiere_date'],
            ]);

            foreach ($validated['translations'] as $locale => $data) {
                if (!empty($data['title'])) {
                    $descriptionPayload = json_encode([
                        'main'    => $data['description'],
                        'credits' => (object)($data['credits'] ?? []),
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
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error("Work Store Error: " . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return back()->with('error', 'Greška pri spremanju rada.');
        }
    }

    public function update(Request $request, Work $work): RedirectResponse
    {
        // ★★★ FIX: Adjusted validation for the update flow, especially for images ★★★
        $validated = $request->validate([
            'translations'                         => 'required|array:en,hr',
            'translations.hr.title'                => ['required', 'string', 'max:255', Rule::unique('work_translations', 'title')->where('locale', 'hr')->ignore($work->id, 'work_id')],
            'translations.hr.description'          => 'required|string',
            'translations.hr.credits'              => 'nullable|array',
            'translations.en.title'                => ['nullable', 'string', 'max:255', Rule::unique('work_translations', 'title')->where('locale', 'en')->ignore($work->id, 'work_id')],
            'translations.en.description'          => 'nullable|string',
            'translations.en.credits'              => 'nullable|array',
            'premiere_date'                        => 'required|date',
            'is_active'                            => 'required|boolean',
            'showings'                             => 'nullable|array',
            'showings.*.id'                        => 'sometimes|integer|exists:showings,id',
            'showings.*.performance_date'          => 'required|date',
            'showings.*.location'                  => 'required|string|max:255',
            'showings.*.news_id'                   => 'nullable|integer|exists:news,id',
            'showings.*.external_link'             => 'nullable|url:http,https|max:2048',
            'new_images'                           => 'nullable|array',
            'new_images.*'                         => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:8192',
            'new_image_data'                       => 'nullable|array',
            'new_image_data.*.author'              => 'nullable|string|max:255',
            'new_image_data.*.is_thumbnail'        => 'required|boolean',
            'existing_images'                      => 'nullable|array',
            'existing_images.*.id'                 => 'required|integer|exists:work_images,id,work_id,' . $work->id,
            'existing_images.*.author'             => 'nullable|string|max:255',
            'existing_images.*.is_thumbnail'       => 'required|boolean',
            'remove_image_ids'                     => 'nullable|array',
            'remove_image_ids.*'                   => 'integer|exists:work_images,id,work_id,' . $work->id,
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
                    $descriptionPayload = json_encode([
                        'main'    => $data['description'],
                        'credits' => (object)($data['credits'] ?? []),
                    ]);

                    $work->translations()->updateOrCreate(
                        ['locale' => $locale],
                        ['title' => $data['title'], 'description' => $descriptionPayload]
                    );
                } else {
                    $work->translations()->where('locale', $locale)->delete();
                }
            }

            // Sync Showings
            $this->syncShowings($work, $validated['showings'] ?? []);

            // Process Images
            $this->processImageUpdates($request, $work);


            DB::commit();
            return redirect()->route('works.index')->with('success', 'Rad uspješno ažuriran!');
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error("Work Update Error for Work ID {$work->id}: " . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return back()->with('error', 'Greška pri ažuriranju rada: ' . $e->getMessage());
        }
    }

    private function syncShowings(Work $work, array $showingsData): void
    {
        $incomingIds = array_filter(array_column($showingsData, 'id'));

        // Delete showings that are no longer present
        $work->showings()->whereNotIn('id', $incomingIds)->delete();

        // Update or create showings
        foreach ($showingsData as $showingDatum) {
            $work->showings()->updateOrCreate(
                ['id' => $showingDatum['id'] ?? null], // If id is null, it creates
                $showingDatum
            );
        }
    }


    public function destroy(Work $work): RedirectResponse
    {
        $work->update(['is_active' => false]);
        return redirect()->route('works.index')->with('success', 'Rad deaktiviran.');
    }

    private function processAndAttachImages(Request $request, Work $work): void
    {
        $uploadedImages = $request->file('images', []);
        $imageAuthors = $request->input('image_authors', []);
        $thumbnailIndex = (int) $request->input('thumbnail_index', -1);

        foreach ($uploadedImages as $index => $file) {
            if (!$file->isValid()) continue;

            $path = $file->store('work-images', 'public');
            WorkImage::create([
                'work_id'      => $work->id,
                'path'         => $path,
                'author'       => $imageAuthors[$index] ?? null,
                'is_thumbnail' => $index === $thumbnailIndex,
            ]);
        }
    }

    // ★★★ FIX: Completely rewritten image update logic to be simpler and more robust ★★★
    private function processImageUpdates(Request $request, Work $work): void
    {
        // 1. Remove images marked for deletion
        if ($request->filled('remove_image_ids')) {
            $imagesToRemove = WorkImage::whereIn('id', $request->input('remove_image_ids'))
                ->where('work_id', $work->id)
                ->get();
            foreach ($imagesToRemove as $img) {
                Storage::disk('public')->delete($img->path);
                $img->delete();
            }
        }

        // 2. Update existing images (author)
        if ($request->filled('existing_images')) {
            foreach ($request->input('existing_images') as $imageData) {
                WorkImage::where('id', $imageData['id'])->update(['author' => $imageData['author']]);
            }
        }

        // 3. Add new images
        $newImageFiles = $request->file('new_images', []);
        $newImageData = $request->input('new_image_data', []);
        $newImageModels = [];

        foreach ($newImageFiles as $index => $file) {
            if (!$file->isValid()) continue;
            $path = $file->store('work-images', 'public');
            $newImageModels[] = WorkImage::create([
                'work_id' => $work->id,
                'path' => $path,
                'author' => $newImageData[$index]['author'] ?? null,
                'is_thumbnail' => false, // Set thumbnail status in the next step
            ]);
        }

        // 4. Set the single thumbnail for the entire set of images
        $work->images()->update(['is_thumbnail' => false]);

        $thumbnailSet = false;
        // Prioritize a newly uploaded thumbnail
        foreach ($newImageData as $index => $data) {
            if ($data['is_thumbnail'] && isset($newImageModels[$index])) {
                $newImageModels[$index]->update(['is_thumbnail' => true]);
                $thumbnailSet = true;
                break;
            }
        }

        // If no new thumbnail, check existing images
        if (!$thumbnailSet && $request->filled('existing_images')) {
            foreach ($request->input('existing_images') as $imageData) {
                if ($imageData['is_thumbnail']) {
                    WorkImage::where('id', $imageData['id'])->update(['is_thumbnail' => true]);
                    $thumbnailSet = true;
                    break;
                }
            }
        }

        // As a final fallback, if no thumbnail is set at all, make the first available image the thumbnail.
        if (!$thumbnailSet && $firstImage = $work->images()->first()) {
            $firstImage->update(['is_thumbnail' => true]);
        }
    }
}
