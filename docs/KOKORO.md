# Kokoro en español (local, sin API de pago)

La integración opcional usa `KPipeline(lang_code='e')` con la voz `ef_dora` y guarda WAV PCM a 24 kHz. El módulo ejecutable está en `scripts/kokoro_tts.py`; `src/tts/kokoro.ts` lo invoca sin incluir Python o modelos en el bundle del navegador.

Para preparar un entorno Python compatible, crea un entorno virtual e instala `kokoro`, `soundfile` y `numpy` siguiendo las instrucciones actuales del proyecto oficial Kokoro. El primer uso descarga pesos de modelo desde Hugging Face, por lo que se requiere conectividad y espacio local. Se trata de síntesis local y no requiere un servicio de pago.

Estado de esta entrega: no se incluye inferencia de Kokoro en el render Remotion. Antes de usarla en el pipeline, genera un WAV de prueba con `python scripts/kokoro_tts.py "Hola, soy Fresa" /tmp/fresa.wav ef_dora` y valida el resultado. La disponibilidad de voces depende de la versión del paquete y del idioma instalado.
