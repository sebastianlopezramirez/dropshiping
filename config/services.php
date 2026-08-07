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

    /*
    |--------------------------------------------------------------------------
    | Wompi — Pasarela de pagos colombiana
    |--------------------------------------------------------------------------
    |
    | Obtén tus credenciales en: https://comercios.wompi.co/
    | Sandbox (pruebas): https://sandbox.wompi.co/
    |
    | public_key    → para generar links de pago desde el frontend
    | private_key   → para llamadas server-to-server (crear links via API)
    | integrity_key → para verificar la firma de los webhooks
    | sandbox       → true en desarrollo, false en producción
    |
    */
    'wompi' => [
        'public_key'    => env('WOMPI_PUBLIC_KEY'),
        'private_key'   => env('WOMPI_PRIVATE_KEY'),
        'integrity_key' => env('WOMPI_INTEGRITY_KEY'),
        'sandbox'       => env('WOMPI_SANDBOX', true),
    ],

];
