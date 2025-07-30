<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\News;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;

class NewsController extends Controller
{
    public function index(Request $request)
    {
        $locale = $request->input('locale', session('locale', config('app.fallback_locale', 'hr')));
        App::setLocale($locale);

        $query = News::query()
            ->with([
                'translation',
                'thumbnail' => fn ($q) => $q->select('id', 'news_id', 'path', 'is_thumbnail'),
                'images'    => fn ($q) => $q->select('id', 'news_id', 'path', 'author'),
            ])
            ->active();

        // ★★★ THIS ENTIRE BLOCK IS THE MAIN CHANGE ★★★
        // It handles both the required locale and the optional search in one go.
        $query->whereHas('translations', function ($q) use ($locale, $request) {
            // First, ensure we only get results for the correct language
            $q->where('locale', $locale);

            // Then, if a search term is provided, apply the filter
            if ($search = $request->input('search')) {
                $q->where(function ($subQuery) use ($search) {
                    $subQuery->where('title', 'like', "%{$search}%")
                        ->orWhere('excerpt', 'like', "%{$search}%");
                });
            }
        });

        // The ordering is applied last
        $query->latest('date');

        $newsItems = $query->paginate($request->input('per_page', 9));

        return response()->json($newsItems);
    }
}
