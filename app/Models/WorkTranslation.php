<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkTranslation extends Model
{
    use HasFactory;

    protected $fillable = [
        'work_id',
        'locale',
        'title',
        'description',
    ];

    public function work(): BelongsTo
    {
        return $this->belongsTo(Work::class);
    }
}
