<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;          //  ← make sure this is here!
use App\Http\Controllers\Api\NewsController;
use App\Http\Controllers\Api\WorkController;

// default Sanctum stub (leave or delete, doesn’t matter)
Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// our news endpoint
Route::get('/news', [NewsController::class, 'index'])->name('api.news');
Route::get('/works', [WorkController::class, 'index']);
