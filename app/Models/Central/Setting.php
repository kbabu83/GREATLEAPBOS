<?php

namespace App\Models\Central;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    protected $connection = 'central';

    protected $fillable = [
        'key',
        'value',
        'section',
        'type',
        'label',
        'description',
        'is_encrypted',
        'order',
    ];

    protected $casts = [
        'is_encrypted' => 'boolean',
        'order' => 'integer',
    ];

    protected $appends = ['display_value'];

    /**
     * Get decrypted value
     */
    public function getValue()
    {
        if ($this->is_encrypted && $this->value) {
            return decrypt($this->value);
        }
        return $this->value;
    }

    /**
     * Set encrypted value
     */
    public function setValue($value)
    {
        if ($this->is_encrypted) {
            $this->value = encrypt($value);
        } else {
            $this->value = $value;
        }
        return $this;
    }

    /**
     * Get display value (hidden if encrypted)
     */
    public function getDisplayValueAttribute()
    {
        if ($this->is_encrypted) {
            return $this->value ? '••••••••' : '';
        }
        return $this->value;
    }
}
