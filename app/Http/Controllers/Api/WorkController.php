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
        // Get locale from the request, fallback to session, then to default
        $locale = $request->input('locale', session('locale', config('app.fallback_locale', 'hr')));
        App::setLocale($locale);

        $query = Work::query()
            ->with([
                // Eager load the translation for the current locale
                'translation',
                // Eager load all translations to get credits for both languages
                'translations',
                'thumbnail',
                'images',
                // Eager load showings and their related news with translation
                'showings.news.translation'
            ])
            // Only show works that have a translation for the requested locale
            ->whereHas('translations', fn ($q) => $q->where('locale', $locale))
            ->active()
            ->latest('premiere_date');

        $works = $query->get()->map(function ($work) {
            // Manually structure the data for the frontend
            $hr_translation = $work->translations->where('locale', 'hr')->first();
            $en_translation = $work->translations->where('locale', 'en')->first();

            // Decode the JSON description and credits
            $hrDescriptionData = json_decode($hr_translation?->description, true) ?: ['main' => $hr_translation?->description, 'credits' => []];
            $enDescriptionData = $en_translation ? (json_decode($en_translation->description, true) ?: ['main' => $en_translation->description, 'credits' => []]) : null;

            return [
                'id' => $work->id,
                'slug' => $work->slug,
                'translations' => [
                    'hr' => [
                        'title' => $hr_translation?->title,
                        'description' => $hrDescriptionData['main'] ?? '',
                        'credits' => $hrDescriptionData['credits'] ?? (object)[],
                    ],
                    'en' => $en_translation ? [
                        'title' => $en_translation->title,
                        'description' => $enDescriptionData['main'] ?? '',
                        'credits' => $enDescriptionData['credits'] ?? (object)[],
                    ] : null,
                ],
                'thumbnail_url' => $work->thumbnail_url,
                'images' => $work->images->map(fn ($img) => [
                    'id' => $img->id,
                    'url' => $img->url,
                    'author' => $img->author,
                ]),
                'performances' => $work->showings->map(fn ($showing) => [
                    'id' => $showing->id,
                    'date' => $showing->performance_date->format('d.m.Y.'),
                    'time' => $showing->performance_date->format('H:i'),
                    'location' => $showing->location,
                    'news_link' => $showing->news_id && $showing->news ? route('projekti.novosti') . '?news_id=' . $showing->news->id : null,
                    'external_link' => $showing->external_link, // ★ Add this line
                ]),

            ];
        });

        return response()->json($works);
    }
}
