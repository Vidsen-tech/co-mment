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
        // Prioritize the locale from the request query string.
        // Fall back to the session, and then to the config default.
        // This makes the API endpoint flexible and cache-friendly.
        $locale = $request->input('locale', session('locale', config('app.fallback_locale', 'hr')));
        App::setLocale($locale);

        $query = News::query()
            ->with([
                // Eagerly load the specific translation for the current locale.
                'translation',
                // Also load the necessary image relations efficiently.
                'thumbnail' => fn ($q) => $q->select('id', 'news_id', 'path', 'is_thumbnail'),
                'images'    => fn ($q) => $q->select('id', 'news_id', 'path', 'author'),
            ])
            // Ensure we only show news that has a translation for the selected locale.
            ->whereHas('translations', fn ($q) => $q->where('locale', $locale))
            ->active()
            ->latest('date');

        $newsItems = $query->paginate($request->input('per_page', 9));

        return response()->json($newsItems);
    }
}
