<?php

/*
|--------------------------------------------------------------------------
| LISTENER: ContarEmailEnviado
|--------------------------------------------------------------------------
|
| ENTENDER — ¿Qué hace?
|
|   Escucha el evento MessageSent de Laravel, que se dispara
|   automáticamente cada vez que el sistema envía un email.
|   Incrementa el contador mensual en metricas_uso_mensual.
|
| PENSAR — ¿Por qué un Listener y no poner el incremento manualmente?
|
|   Con un Listener, cualquier email futuro (confirmación de pedido,
|   notificación de envío, recuperar contraseña) se cuenta solo.
|   No necesitas acordarte de agregar MetricasService::incrementarEmail()
|   en cada nuevo punto del código.
|
| CUÁNDO SE DISPARA:
|   Cada vez que Laravel llama a Mail::send(), Mail::queue(),
|   Notification::send() con canal 'mail', etc.
|
*/

namespace App\Listeners;

use App\Services\MetricasService;
use Illuminate\Mail\Events\MessageSent;

class ContarEmailEnviado
{
    public function handle(MessageSent $event): void
    {
        // Incrementa en 1 el contador de emails del mes actual.
        // Si no existe el registro del mes, lo crea automáticamente.
        MetricasService::incrementarEmail();
    }
}
