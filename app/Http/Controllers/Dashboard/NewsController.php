<?php

namespace App\Http\Controllers\Dashboard;

use App\Enums\NewsType;
use App\Http\Controllers\Controller;
use App\Models\News;
use App\Models\NewsImage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class NewsController extends Controller
{
    public function index(Request $request): Response
    {
        $query = News::with(['translation'])->latest('date');

        if ($search = $request->input('search')) {
            $query->whereHas('translations', function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('excerpt', 'like', "%{$search}%");
            });
        }
        if ($type = $request->input('type')) {
            if ($enumType = NewsType::tryFrom($type)) {
                $query->where('type', $enumType);
            }
        }

        $newsPage = $query->paginate($request->input('perPage', 20))->withQueryString();

        $newsPage->getCollection()->transform(function (News $news) {
            $translations = $news->translations->mapWithKeys(fn($t) => [
                $t->locale => ['title' => $t->title, 'excerpt' => $t->excerpt]
            ]);

            return [
                'id'             => $news->id,
                'title'          => $news->title,
                'type'           => $news->type->value,
                'date'           => $news->date->format('Y-m-d'),
                'formatted_date' => $news->formatted_date,
                'is_active'      => $news->is_active,
                'thumbnail_url'  => $news->thumbnail_url,
                // ★★★ FIX: Correctly construct the source object from the model's properties.
                'source'         => [
                    'url'  => $news->source_url,
                    'text' => $news->source_text,
                ],
                'images'         => $news->images()->orderBy('order_column')->get()->map(fn($img) => [
                    'id'           => $img->id,
                    'url'          => $img->url,
                    'author'       => $img->author,
                    'is_thumbnail' => $img->is_thumbnail,
                ])->all(),
                'translations'   => $translations,
                'created_at'     => $news->created_at->format('d. m. Y H:i'),
                'updated_at'     => $news->updated_at->format('d. m. Y H:i'),
            ];
        });

        return Inertia::render('dashboard/news/Index', [
            'news'      => $newsPage,
            'filters'   => $request->only(['search', 'type']),
            'newsTypes' => NewsType::values(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'translations'              => 'required|array:en,hr',
            'translations.hr.title'     => 'required|string|max:255|unique:news_translations,title',
            'translations.hr.excerpt'   => 'required|string',
            'translations.en.title'     => 'nullable|string|max:255',
            'translations.en.excerpt'   => 'nullable|string',
            'date'                      => 'required|date',
            'type'                      => ['required', Rule::enum(NewsType::class)],
            'source_url'                => 'nullable|string|max:2048|url',
            'source_text'               => 'nullable|string|max:255',
            'images'                    => 'nullable|array',
            'images.*'                  => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:65536',
            'image_data'                => 'required|array',
            'image_data.*.author'       => 'nullable|string|max:255',
            'image_data.*.is_thumbnail' => 'required|boolean',
        ]);

        DB::beginTransaction();
        try {
            $news = News::create([
                'slug'        => Str::slug($validated['translations']['hr']['title']),
                'date'        => $validated['date'],
                'type'        => $validated['type'],
                'is_active'   => true,
                'source_url'  => $validated['source_url'] ?? null,
                'source_text' => $validated['source_text'] ?? null,
            ]);

            foreach ($validated['translations'] as $locale => $data) {
                if (!empty($data['title'])) {
                    $news->translations()->create(['locale' => $locale] + $data);
                }
            }

            if ($request->hasFile('images')) {
                $this->processAndAttachImages($request, $news);
            }

            DB::commit();
            return redirect()->route('news.index')->with('success', 'Novost uspješno stvorena!');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("News Store Error: " . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return back()->withInput()->with('error', 'Greška pri spremanju novosti.');
        }
    }

    public function update(Request $request, News $news): RedirectResponse
    {
        $validated = $request->validate([
            'translations'              => 'required|array:en,hr',
            'translations.hr.title'     => ['required', 'string', 'max:255', Rule::unique('news_translations', 'title')->where('locale', 'hr')->ignore($news->id, 'news_id')],
            'translations.hr.excerpt'   => 'required|string',
            'translations.en.title'     => ['nullable', 'string', 'max:255', Rule::unique('news_translations', 'title')->where('locale', 'en')->ignore($news->id, 'news_id')],
            'translations.en.excerpt'   => 'nullable|string',
            'date'                      => 'required|date',
            'type'                      => ['required', Rule::enum(NewsType::class)],
            'is_active'                 => 'required|boolean',
            'source_url'                => 'nullable|string|max:2048|url',
            'source_text'               => 'nullable|string|max:255',
            'new_images'                => 'nullable|array',
            'new_images.*'              => 'image|mimes:jpeg,png,jpg,gif,webp|max:65536',
            'ordered_images'            => 'required|array',
        ], [
            'new_images.*.max' => 'Slika ne smije biti veća od 64MB.',
        ]);

        DB::beginTransaction();
        try {
            $news->update([
                'slug'        => Str::slug($validated['translations']['hr']['title']),
                'date'        => $validated['date'],
                'type'        => $validated['type'],
                'is_active'   => $validated['is_active'],
                'source_url'  => $validated['source_url'] ?? null,
                'source_text' => $validated['source_text'] ?? null,
            ]);

            foreach ($validated['translations'] as $locale => $data) {
                if (!empty($data['title'])) {
                    $news->translations()->updateOrCreate(['locale' => $locale], $data);
                } else {
                    $news->translations()->where('locale', $locale)->delete();
                }
            }

            // ★★★ FIX: Pass all necessary data to the refactored image processing function.
            $this->processOrderedImageUpdates(
                $news,
                $validated['ordered_images'],
                $request->file('new_images', [])
            );

            DB::commit();
            return redirect()->route('news.index')->with('success', 'Novost uspješno ažurirana!');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("News Update Error for News ID {$news->id}: " . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return back()->withInput()->with('error', 'Greška pri ažuriranju novosti.');
        }
    }

    public function destroy(News $news): RedirectResponse
    {
        // Consider deleting images from storage here if it's a hard delete
        $news->update(['is_active' => false]);
        return redirect()->route('news.index')->with('success', 'Novost deaktivirana.');
    }

    private function processAndAttachImages(Request $request, News $news): void
    {
        $uploadedImages = $request->file('images', []);
        $imageData = $request->input('image_data', []);

        foreach ($uploadedImages as $index => $file) {
            if (!$file->isValid()) continue;

            $path = $file->store('news-images', 'public');
            if ($path === false) {
                throw new \Exception("Could not save file to disk.");
            }
            NewsImage::create([
                'news_id'      => $news->id,
                'path'         => $path,
                'author'       => $imageData[$index]['author'] ?? null,
                'is_thumbnail' => $imageData[$index]['is_thumbnail'] ?? false,
                'order_column' => $index,
            ]);
        }
    }

    // ★★★ FIX: A completely refactored and robust function for handling image updates.
    private function processOrderedImageUpdates(News $news, array $orderedImages, array $newImageFiles): void
    {
        $existingImageIds = $news->images()->pluck('id')->all();
        $incomingImageIds = [];
        $newFileCounter = 0;

        // Loop through the metadata of all images (old and new) in their desired final order.
        foreach ($orderedImages as $order => $imageData) {
            $isNew = $imageData['is_new'] ?? false;

            if ($isNew) {
                // This is a new image. Get its file from the separate files array.
                $file = $newImageFiles[$newFileCounter] ?? null;

                if ($file && $file->isValid()) {
                    $path = $file->store('news-images', 'public');
                    if (!$path) throw new \Exception("Could not save new file to disk for news ID {$news->id}.");

                    NewsImage::create([
                        'news_id'      => $news->id,
                        'path'         => $path,
                        'author'       => $imageData['author'],
                        'is_thumbnail' => $imageData['is_thumbnail'],
                        'order_column' => $order,
                    ]);
                    $newFileCounter++;
                }
            } else {
                // This is an existing image. Update its metadata.
                $id = $imageData['id'];
                $incomingImageIds[] = $id; // Keep track of which existing images we want to keep.

                NewsImage::where('id', $id)->where('news_id', $news->id)->update([
                    'order_column' => $order,
                    'author'       => $imageData['author'],
                    'is_thumbnail' => $imageData['is_thumbnail'],
                ]);
            }
        }

        // Determine which old images were removed on the frontend and delete them.
        $idsToDelete = array_diff($existingImageIds, $incomingImageIds);
        if (!empty($idsToDelete)) {
            $imagesToDelete = NewsImage::whereIn('id', $idsToDelete)->get();
            foreach ($imagesToDelete as $img) {
                Storage::disk('public')->delete($img->path);
                $img->delete();
            }
        }
    }
}
