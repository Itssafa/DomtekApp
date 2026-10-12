<?php

namespace App\Http\Requests\Org;

use App\Rules\CodePostalTunisien;
use Illuminate\Foundation\Http\FormRequest;

class StoreBienRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $typesBien = 'appartement,maison,villa,bureau,terrain,studio,duplex,local_commercial,entrepot,ferme,autre';

        return [
            'immeuble_id'       => ['nullable', 'exists:immeubles,id'],
            'bloc'              => ['nullable', 'integer', 'min:1'],
            'num'               => ['nullable', 'string', 'max:20'],
            'designation'       => ['required', 'string', 'max:255'],
            'description'       => ['nullable', 'string'],
            'notes'             => ['nullable', 'string'],
            'type_transaction'  => ['required', 'in:vente,loyer'],
            'type_location'     => ['nullable', 'in:meuble,non_meuble'],
            'type_bien'         => ['required', "in:{$typesBien}"],
            'prix'              => ['required', 'numeric', 'min:0'],
            'taxe_fonciere'     => ['nullable', 'numeric', 'min:0'],
            'regime_juridique'  => ['nullable', 'in:mono_propriete,co_propriete'],
            'superficie'        => ['nullable', 'numeric', 'min:0'],
            'superficie_commune' => ['nullable', 'numeric', 'min:0'],
            'adresse'           => ['nullable', 'string', 'max:255'],
            'ville'             => ['nullable', 'string', 'max:100'],
            'pays'              => ['nullable', 'string', 'max:100'],
            'code_postal'       => ['nullable', 'string', 'max:20', new CodePostalTunisien],
            'maps_url'          => ['nullable', 'string', 'max:2048'],
            'nb_pieces'         => ['nullable', 'integer', 'min:0'],
            'nb_chambres'       => ['nullable', 'integer', 'min:0'],
            'nb_salles_bain'    => ['nullable', 'integer', 'min:0'],
            'nb_cuisine'        => ['nullable', 'integer', 'min:0'],
            'etage'             => ['nullable', 'integer'],
            'date_construction' => ['nullable', 'date'],
            'accepte_animaux'   => ['boolean'],
            'accepte_fumeurs'   => ['boolean'],
            'options'           => ['nullable', 'array'],
            'options.*'         => ['string'],
        ];
    }
}
