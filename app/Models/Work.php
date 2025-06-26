<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Storage;

class Work extends Model
{
    use HasFactory;

    protected $fillable = [
        'slug',
        'premiere_date',
        'is_active',
    ];

    protected $casts = [
        'premiere_date' => 'date',
        'is_active' => 'boolean',
    ];

    protected $appends = ['title', 'description', 'thumbnail_url'];

    // --- RELATIONSHIPS ---

    public function translations(): HasMany
    {
        return $this->hasMany(WorkTranslation::class);
    }

    public function translation(): HasOne
    {
        return $this->hasOne(WorkTranslation::class)->where('locale', App::getLocale());
    }

    public function images(): HasMany
    {
        return $this->hasMany(WorkImage::class);
    }

    public function thumbnail(): HasOne
    {
        return $this->hasOne(WorkImage::class)->where('is_thumbnail', true);
    }

    // ★★★ THIS MUST BE NAMED showings() ★★★
    public function showings(): HasMany
    {
        return $this->hasMany(Showing::class)->orderBy('performance_date', 'desc');
    }

    // --- SCOPES ---

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    // --- ACCESSORS ---

    public function getTitleAttribute(): ?string
    {
        return $this->translation?->title;
    }

    public function getDescriptionAttribute(): ?string
    {
        return $this->translation?->description;
    }

    public function getThumbnailUrlAttribute(): ?string
    {
        $thumbnailPath = $this->thumbnail?->path;
        return $thumbnailPath ? Storage::url($thumbnailPath) : null;
    }
}
