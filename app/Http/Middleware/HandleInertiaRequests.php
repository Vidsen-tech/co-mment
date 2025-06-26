<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\File;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root Blade view used by Inertia on first load.
     */
    protected $rootView = 'app';

    /**
     * Asset versioning.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Defines the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        // Fun Inspiring quote (optional)
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        return array_merge(parent::share($request), [

            /* -----------------------------------------------------------------
             |  Global app data
             |-----------------------------------------------------------------*/
            'appName' => config('app.name'),

            /* -----------------------------------------------------------------
             |  Auth
             |-----------------------------------------------------------------*/
            'auth' => [
                'user' => $request->user(),
            ],

            /* -----------------------------------------------------------------
             |  Localisation
             |-----------------------------------------------------------------*/
            // Current UI language
            'locale' => fn () => App::getLocale(),

            // List of all available languages (e.g., ["en", "hr"])
            'locales' => fn () => collect(File::files(lang_path()))
                ->map(fn ($f) => $f->getFilenameWithoutExtension())
                ->values(),

            // The actual key-value pairs for the current locale's JSON file
            'translations' => fn () => json_decode(
                File::get(lang_path(App::getLocale() . '.json')),
                true
            ),

            /* -----------------------------------------------------------------
             |  Inspiring quote (optional)
             |-----------------------------------------------------------------*/
            'quote' => [
                'message' => trim($message),
                'author'  => trim($author),
            ],

            /* -----------------------------------------------------------------
             |  Ziggy (routes helper for React)
             |-----------------------------------------------------------------*/
            'ziggy' => fn () => [
                ...(new Ziggy)->toArray(),
                'location' => $request->url(),
            ],
        ]);
    }
}
