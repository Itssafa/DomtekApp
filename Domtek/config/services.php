<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'twilio' => [
        'sid'   => env('TWILIO_SID'),
        'token' => env('TWILIO_TOKEN'),
        'from'  => env('TWILIO_FROM'),
    ],

    'stripe' => [
        'key'            => env('STRIPE_KEY'),
        'secret'         => env('STRIPE_SECRET'),
        'webhook_secret' => env('STRIPE_WEBHOOK_SECRET'),
        'currency'       => env('STRIPE_CURRENCY', 'eur'),
    ],

    'frontend' => [
        'url' => env('FRONTEND_URL', 'http://localhost:3000'),
    ],

    'google' => [
        'client_id'     => env('GOOGLE_CLIENT_ID'),
        'client_secret' => env('GOOGLE_CLIENT_SECRET'),
        'redirect'      => env('APP_URL', 'http://localhost:8000') . '/api/auth/google/callback',
    ],

    'gemini' => [
        'key' => env('GEMINI_API_KEY'),
    ],

    'groq' => [
        'key' => env('GROQ_API_KEY'),

        // Les modèles de Groq sont retirés sans préavis (llama-3.3-70b-versatile
        // l'a été, ce qui a fait tomber deux fonctionnalités à la fois). Les noms
        // vivent donc ici, modifiables par .env sans toucher au code.
        //
        // Deux modèles, car les deux usages n'ont pas les mêmes besoins :
        //  - texte libre : un modèle raisonnant convient, son raisonnement est
        //    renvoyé dans un champ séparé et ne pollue pas la description ;
        //  - JSON strict : un modèle raisonnant échoue (il dépense son budget en
        //    réflexion et ne produit rien, ou invalide le format JSON). Il faut
        //    un modèle qui répond directement.
        'model'      => env('GROQ_MODEL', 'openai/gpt-oss-120b'),
        'model_json' => env('GROQ_MODEL_JSON', 'qwen/qwen3.8-27b'),
    ],

];
