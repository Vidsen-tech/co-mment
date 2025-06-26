<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;

class SetLocale
{
    public function handle(Request $request, Closure $next)
    {
        // order of precedence: explicit param > session > default
        if ($request->route('locale')) {
            session(['locale' => $request->route('locale')]);
        }

        App::setLocale(
            session('locale', config('app.locale')) // fallback from .env
        );

        return $next($request);
    }
}
