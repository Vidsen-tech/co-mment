<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Showing extends Model
{
    use HasFactory;

    protected $table = 'showings';

    protected $fillable = [
        'work_id',
        'news_id',
        'external_link', // Add this line
        'performance_date',
        'location',
    ];

    protected $casts = [
        'performance_date' => 'datetime',
    ];

    // ★★★ FIX: This is the critical missing link ★★★
    // This function tells Eloquent that a Showing belongs to a Work.
    public function work(): BelongsTo
    {
        return $this->belongsTo(Work::class);
    }

    public function news(): BelongsTo
    {
        return $this->belongsTo(News::class);
    }
}
