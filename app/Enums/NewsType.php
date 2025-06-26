<?php

namespace App\Enums;

enum NewsType: string
{
    case RADOVI = 'Radovi';
    case RADIONICE = 'Radionice';
    case NOVOSTI = 'Novosti';

    /**
     * Get all enum values.
     *
     * @return array<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
