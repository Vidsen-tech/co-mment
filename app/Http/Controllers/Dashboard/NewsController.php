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
        $query = News::with(['thumbnail', 'translation']) // Eager load current locale's translation for the list
        ->latest('date');

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

        // Transform data for the frontend, ensuring all translations are loaded for the edit modal.
        $newsPage->getCollection()->transform(function (News $news) {
            $translations = $news->translations->mapWithKeys(fn($t) => [
                $t->locale => ['title' => $t->title, 'excerpt' => $t->excerpt]
            ]);

            return [
                'id'             => $news->id,
                'title'          => $news->title, // Accessor provides title in current locale
                'type'           => $news->type->value,
                'date'           => $news->date->format('Y-m-d'), // ISO format is best for JS
                'formatted_date' => $news->formatted_date,
                'is_active'      => $news->is_active,
                'thumbnail_url'  => $news->thumbnail_url,
                'source'         => $news->source,
                'images'         => $news->images->map(fn($img) => [
                    'id'           => $img->id,
                    'url'          => $img->url,
                    'author'       => $img->author,
                    'is_thumbnail' => $img->is_thumbnail,
                ])->all(),
                'translations'   => $translations, // Pass all translations for the edit form
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
            'translations'                => 'required|array:en,hr',
            'translations.hr.title'       => 'required|string|max:255|unique:news_translations,title',
            'translations.hr.excerpt'     => 'required|string',
            'translations.en.title'       => 'nullable|string|max:255',
            'translations.en.excerpt'     => 'nullable|string',
            'date'                        => 'required|date',
            'type'                        => ['required', Rule::enum(NewsType::class)],
            'source'                      => 'nullable|string|max:8000|url',
            'images'                      => 'nullable|array',
            'images.*'                    => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:4096',
            'image_authors'               => 'nullable|array',
            'image_authors.*'             => 'nullable|string|max:255',
            'thumbnail_index'             => 'nullable|integer|min:0',
        ]);

        DB::beginTransaction();
        try {
            $news = News::create([
                'slug'      => Str::slug($validated['translations']['hr']['title']),
                'date'      => $validated['date'],
                'type'      => $validated['type'],
                'is_active' => true,
                'source'    => $validated['source'] ?? null,
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
            'translations'                => 'required|array:en,hr',
            'translations.hr.title'       => ['required','string','max:255',Rule::unique('news_translations', 'title')->where('locale', 'hr')->ignore($news->id, 'news_id')],
            'translations.hr.excerpt'     => 'required|string',
            'translations.en.title'       => ['nullable','string','max:255',Rule::unique('news_translations', 'title')->where('locale', 'en')->ignore($news->id, 'news_id')],
            'translations.en.excerpt'     => 'nullable|string',
            'date'                        => 'required|date',
            'type'                        => ['required', Rule::enum(NewsType::class)],
            'is_active'                   => 'required|boolean',
            'source'                      => 'nullable|string|max:2048|url',
            'new_images'                  => 'nullable|array',
            'new_images.*'                => 'image|mimes:jpeg,png,jpg,gif,webp|max:4096',
            'new_image_authors'           => 'nullable|array',
            'remove_image_ids'            => 'nullable|array',
            'remove_image_ids.*'          => 'integer|exists:news_images,id,news_id,' . $news->id,
            'thumbnail_image_id'          => 'nullable|integer|exists:news_images,id,news_id,' . $news->id,
            'new_thumbnail_index'         => 'nullable|integer|min:0',
        ]);

        DB::beginTransaction();
        try {
            $news->update([
                'slug'      => Str::slug($validated['translations']['hr']['title']),
                'date'      => $validated['date'],
                'type'      => $validated['type'],
                'is_active' => $validated['is_active'],
                'source'    => $validated['source'] ?? null,
            ]);

            foreach ($validated['translations'] as $locale => $data) {
                if (!empty($data['title'])) {
                    $news->translations()->updateOrCreate(['locale' => $locale], $data);
                } else {
                    $news->translations()->where('locale', $locale)->delete();
                }
            }

            $this->processImageUpdates($request, $news);

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
        $news->update(['is_active' => false]);
        return redirect()->route('news.index')->with('success', 'Novost deaktivirana.');
    }

    private function processAndAttachImages(Request $request, News $news): void
    {
        if (!$request->hasFile('images')) return;

        $uploadedImages = $request->file('images');
        $imageAuthors = $request->input('image_authors', []);
        $thumbnailIndex = $request->input('thumbnail_index');

        foreach ($uploadedImages as $index => $file) {
            if (!$file->isValid()) continue;
            $path = $file->store('news-images', 'public');
            NewsImage::create([
                'news_id'      => $news->id,
                'path'         => $path,
                'author'       => $imageAuthors[$index] ?? null,
                'is_thumbnail' => (int)$thumbnailIndex === $index,
            ]);
        }
    }

    private function processImageUpdates(Request $request, News $news): void
    {
        if ($request->filled('remove_image_ids')) {
            $imagesToRemove = NewsImage::whereIn('id', $request->input('remove_image_ids'))->where('news_id', $news->id)->get();
            foreach ($imagesToRemove as $img) {
                Storage::disk('public')->delete($img->path);
                $img->delete();
            }
        }

        $newImageIds = [];
        if ($request->hasFile('new_images')) {
            foreach ($request->file('new_images') as $index => $file) {
                if (!$file->isValid()) continue;
                $path = $file->store('news-images', 'public');
                $newImage = NewsImage::create([
                    'news_id'      => $news->id,
                    'path'         => $path,
                    'author'       => $request->input("new_image_authors.{$index}") ?? null,
                    'is_thumbnail' => false,
                ]);
                $newImageIds[$index] = $newImage->id;
            }
        }

        $newThumbnailId = null;
        if ($request->filled('new_thumbnail_index') && isset($newImageIds[$request->input('new_thumbnail_index')])) {
            $newThumbnailId = $newImageIds[$request->input('new_thumbnail_index')];
        } elseif ($request->filled('thumbnail_image_id')) {
            $newThumbnailId = $request->input('thumbnail_image_id');
        }

        NewsImage::where('news_id', $news->id)->update(['is_thumbnail' => false]);

        if ($newThumbnailId) {
            NewsImage::where('id', $newThumbnailId)->update(['is_thumbnail' => true]);
        } elseif ($firstImage = $news->images()->first()) {
            $firstImage->update(['is_thumbnail' => true]);
        }
    }
}
