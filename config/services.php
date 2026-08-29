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
        'key'    => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel'              => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
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

    /*
    |--------------------------------------------------------------------------
    | WhatsApp del negocio
    |--------------------------------------------------------------------------
    | Número sin + ni espacios. Ejemplo: 573001234567
    | Configurar en Railway: WHATSAPP_NUMERO=573XXXXXXXXX
    */
    'whatsapp' => [
        'numero' => env('WHATSAPP_NUMERO', ''),
    ],

    /*
    |--------------------------------------------------------------------------
    | Google OAuth — Login con Gmail
    |--------------------------------------------------------------------------
    |
    | Credenciales del proyecto "Gadget Store" en Google Cloud Console.
    | Para editar: https://console.cloud.google.com → proyecto gadget-store-507012
    | → APIs & Services → Google Auth Platform → Clients
    |
    | Al pasar a producción agregar el redirect URI en Google Cloud Console:
    | https://tudominio.com/auth/google/callback
    |
    */
    'google' => [
        'client_id'       => env('GOOGLE_CLIENT_ID'),
        'client_secret'   => env('GOOGLE_CLIENT_SECRET'),
        'redirect'        => env('GOOGLE_REDIRECT_URI'),         // /auth/google/callback (panel admin)
        'redirect_tienda' => env('GOOGLE_REDIRECT_TIENDA_URI'), // /tienda/auth/google/callback (tienda clientes)
    ],

];