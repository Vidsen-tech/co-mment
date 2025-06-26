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

    // 'title' and 'excerpt' are removed, 'slug' is now set based on HR title in the controller.
    protected $fillable = [
        'slug',
        'date',
        'category',
        'source',
        'type',
        'is_active',
    ];

    protected $casts = [
        'date'      => 'date',
        'is_active' => 'boolean',
        'type'      => NewsType::class,
    ];

    // We add 'title' and 'excerpt' to $appends. This tells Laravel to include them
    // in JSON/array conversions by using the getTitleAttribute() and getExcerptAttribute() accessors.
    protected $appends = ['thumbnail_url', 'formatted_date', 'title', 'excerpt'];

    // --- RELATIONSHIPS ---

    public function images(): HasMany
    {
        return $this->hasMany(NewsImage::class);
    }

    public function thumbnail(): HasOne
    {
        return $this->hasOne(NewsImage::class)->where('is_thumbnail', true);
    }

    // Relationship to all translations for this news item.
    public function translations(): HasMany
    {
        return $this->hasMany(NewsTranslation::class);
    }

    // A smart relationship that automatically gets the translation for the current app locale.
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

    // This accessor dynamically provides the 'title' attribute.
    public function getTitleAttribute(): ?string
    {
        // It prioritizes the loaded 'translation' relation. If that's not available,
        // it falls back to the first available translation to prevent errors.
        return $this->translation->title ?? $this->translations->first()->title ?? null;
    }

    // This accessor dynamically provides the 'excerpt' attribute.
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
}
