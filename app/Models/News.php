<?php

namespace App\Models;

use App\Enums\NewsType;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasOneOrMany;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Storage;

class News extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'slug',
        'date',
        'category',
        'source_url',  // ★ CORRECTED: Renamed from 'source'
        'source_text', // ★ CORRECTED: Added for the custom source name
        'type',
        'is_active',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'date'      => 'date',
        'is_active' => 'boolean',
        'type'      => NewsType::class,
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var array<int, string>
     */
    // ★★★ THIS IS THE PRIMARY FIX: A single, correct declaration for $appends ★★★
    protected $appends = [
        'thumbnail_url',
        'formatted_date',
        'title',
        'excerpt',
        'source', // This correctly includes the new 'source' object accessor
    ];


    // --- RELATIONSHIPS ---

    public function images(): HasMany
    {
        return $this->hasMany(NewsImage::class);
    }

    public function thumbnail(): HasOne
    {
        return $this->hasOne(NewsImage::class)->where('is_thumbnail', true);
    }

    public function translations(): HasMany
    {
        return $this->hasMany(NewsTranslation::class);
    }

    public function translation(): HasOneOrMany
    {
        return $this->hasOne(NewsTranslation::class)->where('locale', App::getLocale());
    }


    // --- SCOPES ---

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }


    // --- ACCESSORS ---

    public function getTitleAttribute(): ?string
    {
        return $this->translation->title ?? $this->translations->first()->title ?? null;
    }

    public function getExcerptAttribute(): ?string
    {
        return $this->translation->excerpt ?? $this->translations->first()->excerpt ?? null;
    }

    public function getThumbnailUrlAttribute(): ?string
    {
        return $this->thumbnail ? Storage::url($this->thumbnail->path) : null;
    }

    public function getFormattedDateAttribute(): string
    {
        return $this->date ? $this->date->format('d. m. Y.') : '';
    }

    /**
     * ★ CORRECTED: New accessor to combine source_url and source_text into an object.
     * This is for the 'source' key in the $appends array.
     */
    public function getSourceAttribute(): ?array
    {
        if (!$this->source_url) {
            return null;
        }

        return [
            'url'  => $this->source_url,
            'text' => $this->source_text,
        ];
    }
}
