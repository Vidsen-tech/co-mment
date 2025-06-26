<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NewsTranslation extends Model
{
    use HasFactory;

    public $timestamps = true;

    protected $fillable = [
        'news_id',
        'locale',
        'title',
        'excerpt',
    ];

    public function news(): BelongsTo
    {
        return $this->belongsTo(News::class);
    }
}
