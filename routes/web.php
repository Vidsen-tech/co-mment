<?php

// Import necessary classes
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\Dashboard\NewsController; // Import the new controller
use App\Http\Controllers\ProfileController; // Ensure ProfileController is imported if used below
use App\Http\Controllers\WorkshopInquiryController;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

// --- Public Marketing/Frontend Routes ---
Route::get('/', function () {
    return Inertia::render('marketing/landing');
})->name('home');

Route::get('/lang/{locale}', function ($locale) {
    session()->put('locale', $locale); // Explicitly set locale in session
    return back();
})->whereIn('locale', ['en', 'hr'])->name('lang.switch');

Route::get('/about', fn () => Inertia::render('marketing/about'))
    ->name('about');
Route::get('/contact', fn () => Inertia::render('marketing/contact'))
    ->name('contact');
Route::get('/projekti/novosti-arhiva', fn () => Inertia::render('projekti/novosti'))
    ->name('projekti.novosti');

Route::get('/projekti/radovi', [\App\Http\Controllers\Public\WorkController::class, 'index'])
    ->name('projekti.radovi');

Route::get('/projekti/radionice', fn () => Inertia::render('projekti/Radionice'))
    ->name('projekti.radionice');

Route::post('/radionice/send-inquiry', [WorkshopInquiryController::class, 'send'])->name('workshop.inquiry.send');
Route::post('/rider-request', [App\Http\Controllers\WorkshopInquiryController::class, 'sendRiderRequest'])->name('rider.request.send');

// --- Authenticated Dashboard Routes ---
Route::middleware(['auth', 'verified'])->prefix('dashboard')->group(function () {

    // Default dashboard page
    Route::get('/', function () {
        // ***** THE ONLY CHANGE IS HERE *****
        // Changed 'Dashboard/Index' to 'dashboard' to match your file name
        return Inertia::render('dashboard');
        // ***** END OF CHANGE *****
    })->name('dashboard');

    // News Management Routes
    Route::resource('news', \App\Http\Controllers\Dashboard\NewsController::class)
        ->except(['create','edit']);

    Route::resource('works', \App\Http\Controllers\Dashboard\WorkController::class)
        ->except(['create', 'edit']);


    // Settings/Profile Routes (Example - adjust/remove if defined elsewhere)
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');



}); // --- End of Authenticated Group ---


// --- Include Auth Routes (Usually at the end) ---
// require __DIR__.'/settings.php'; // Keep if you have this file and it defines different routes
require __DIR__.'/auth.php';
