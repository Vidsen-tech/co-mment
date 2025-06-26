<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class NewsImage extends Model
{
    use HasFactory;

    protected $fillable = [
        'news_id',
        'path',
        'author',
        'is_thumbnail',
    ];

    protected $casts = [
        'is_thumbnail' => 'boolean',
    ];

    // This tells Laravel to always include the 'url' when the model is converted to an array/JSON
    protected $appends = ['url'];

    public function news(): BelongsTo
    {
        return $this->belongsTo(News::class);
    }

    /**
     * Get the full, public URL for the image.
     *
     * ★★★ FIX: Using asset() helper is more reliable than Storage::url() ★★★
     * This ensures the URL is always correct, even when running on localhost:8000.
     */
    public function getUrlAttribute(): string
    {
        return $this->path ? asset('storage/' . $this->path) : '';
    }
}
