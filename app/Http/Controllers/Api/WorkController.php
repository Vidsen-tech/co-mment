<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Work;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;

class WorkController extends Controller
{
    public function index(Request $request)
    {
        $locale = $request->input('locale', session('locale', config('app.fallback_locale', 'hr')));
        App::setLocale($locale);

        $query = Work::query()
            ->with([
                'translation',
                'translations',
                'thumbnail',
                // Eager load images in their correct order
                'images' => fn ($query) => $query->orderBy('order_column', 'asc'),
                'showings.news.translation'
            ])
            ->whereHas('translations', fn ($q) => $q->where('locale', $locale))
            ->active()
            ->latest('premiere_date');

        $works = $query->get()->map(function ($work) {
            $hr_translation = $work->translations->where('locale', 'hr')->first();
            $en_translation = $work->translations->where('locale', 'en')->first();

            // Decode credits, ensuring it's an array
            $hrDescriptionData = json_decode($hr_translation?->description, true) ?: ['main' => $hr_translation?->description, 'credits' => []];
            $enDescriptionData = $en_translation ? (json_decode($en_translation->description, true) ?: ['main' => $en_translation->description, 'credits' => []]) : null;

            return [
                'id' => $work->id,
                'slug' => $work->slug,
                'translations' => [
                    'hr' => [
                        'title' => $hr_translation?->title,
                        'description' => $hrDescriptionData['main'] ?? '',
                        // ★★★ FIX: Ensure credits are always an array ★★★
                        'credits' => $hrDescriptionData['credits'] ?? [],
                    ],
                    'en' => $en_translation ? [
                        'title' => $en_translation->title,
                        'description' => $enDescriptionData['main'] ?? '',
                        'credits' => $enDescriptionData['credits'] ?? [],
                    ] : null,
                ],
                'thumbnail_url' => $work->thumbnail_url,
                'images' => $work->images->map(fn ($img) => [
                    'id' => $img->id,
                    'url' => $img->url,
                    'author' => $img->author,
                    // ★★★ FIX: Add the missing is_thumbnail flag ★★★
                    'is_thumbnail' => $img->is_thumbnail,
                ]),
                'performances' => $work->showings->map(fn ($showing) => [
                    'id' => $showing->id,
                    'date' => $showing->performance_date->format('d.m.Y.'),
                    'time' => $showing->performance_date->format('H:i'),
                    'location' => $showing->location,
                    'news_link' => $showing->news_id && $showing->news ? route('projekti.novosti') . '?news_id=' . $showing->news->id : null,
                    'external_link' => $showing->external_link,
                ]),
            ];
        });

        return response()->json($works);
    }
}
