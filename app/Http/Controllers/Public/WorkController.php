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
        $locale = $request->input('locale', session('locale', config('app.fallback_locale', 'hr')));
        App::setLocale($locale);

        $works = Work::query()
            ->with([
                'translation',
                'thumbnail',
                // ★★★ THE FIX IS HERE: This MUST match the method name in the Work model ★★★
                'showings.news.translation', // Also load nested relationships
                'images' => fn ($q) => $q->orderBy('is_thumbnail', 'desc'),
            ])
            ->whereHas('translations', fn ($q) => $q->where('locale', $locale))
            ->active()
            ->latest('premiere_date')
            ->get()
            ->map(function (Work $work) {
                $descriptionData = json_decode($work->description, true);

                return [
                    'id' => $work->id,
                    'slug' => $work->slug,
                    'title' => $work->title,
                    'description' => $descriptionData['main'] ?? '',
                    'credits' => $descriptionData['credits'] ?? [],
                    'premiere_date' => $work->premiere_date->format('d.m.Y.'),
                    'thumbnail_url' => $work->thumbnail_url,
                    'performances' => $work->showings->map(fn ($p) => [
                        'id' => $p->id,
                        'date' => $p->performance_date->format('d.m.Y.'),
                        'time' => $p->performance_date->format('H:i'),
                        'location' => $p->location,
                        // ★★★ AND THE FIX IS HERE: Create the correct news link ★★★
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
