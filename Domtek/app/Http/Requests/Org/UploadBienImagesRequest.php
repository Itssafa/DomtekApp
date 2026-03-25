<?php

namespace App\Http\Requests\Org;

use Illuminate\Foundation\Http\FormRequest;

class UploadBienImagesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'images'           => ['required', 'array', 'max:10'],
            'images.*'         => ['image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'image_principale' => ['nullable', 'integer'],
        ];
    }
}
