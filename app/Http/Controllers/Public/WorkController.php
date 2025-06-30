<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Work;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Inertia\Inertia;
use Inertia\Response;

class WorkController extends Controller
{
    public function index(Request $request): Response
    {
        // ★ NOTE: We still set the locale to have it available globally, e.g., for shared props.
        $locale = session('locale', config('app.fallback_locale', 'hr'));
        App::setLocale($locale);

        $works = Work::query()
            ->with([
                // ★ CHANGED: We load all translations, not just the one for the current locale.
                'translations',
                'thumbnail',
                'showings.news.translation',
                'images' => fn ($q) => $q->orderBy('is_thumbnail', 'desc')->orderBy('id'),
            ])
            // ★ REMOVED: The whereHas condition that limited to a single locale is gone.
            // We now fetch works that have at least one translation.
            ->whereHas('translations')
            ->active()
            ->latest('premiere_date')
            ->get()
            ->map(function (Work $work) {
                // ★ CHANGED: We now map all available translations into a nested object.
                // This is the key change that enables frontend language switching.
                $translations = $work->translations->mapWithKeys(function ($t) {
                    $descriptionData = json_decode($t->description, true);
                    return [
                        $t->locale => [
                            'title' => $t->title,
                            'description' => $descriptionData['main'] ?? '',
                            'credits' => $descriptionData['credits'] ?? [],
                        ]
                    ];
                });

                return [
                    'id' => $work->id,
                    'slug' => $work->slug,
                    // ★ NEW: Pass the entire translations object to the frontend.
                    'translations' => $translations,
                    'premiere_date' => $work->premiere_date->format('d.m.Y.'),
                    'thumbnail_url' => $work->thumbnail_url,
                    'performances' => $work->showings->map(fn ($p) => [
                        'id' => $p->id,
                        'date' => $p->performance_date->format('d.m.Y.'),
                        'time' => $p->performance_date->format('H:i'),
                        'location' => $p->location,
                        'news_link' => $p->news_id && $p->news ? route('projekti.novosti', ['slug' => $p->news->slug]) : null,
                    ]),
                    'images' => $work->images->map(fn($img) => [
                        'id' => $img->id, 'url' => $img->url, 'author' => $img->author,
                    ])->all(),
                ];
            });

        return Inertia::render('projekti/Radovi', [
            'works' => $works,
        ]);
    }
}
