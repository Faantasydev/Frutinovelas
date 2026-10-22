# Frutinovelas Studio

Editor web para crear mini novelas de frutas y generar videos verticales reales con React, Remotion y GitHub Actions.

## Requisitos y comandos

Usa Node.js 20 o superior.

```bash
npm ci
npm run dev       # editor web en http://localhost:5173
npm test          # validación de guion
npm run build     # TypeScript + bundle web para Vercel
npm run render    # MP4 H.264 de 5 s, 1080x1920, 30 fps en out/
```

El editor visual permite ajustar personajes, diálogos, cámara y duración de cada escena. El reproductor de Remotion refleja los cambios del guion.

La generación desde el botón requiere desplegar los endpoints `/api` en Vercel y configurar las variables de servidor descritas en [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md). El MP4 se produce en GitHub Actions desde el guion enviado y vuelve a la interfaz mediante un endpoint protegido asociado al trabajo y la sesión.

Kokoro es opcional y local. Consulta [docs/KOKORO.md](docs/KOKORO.md) para instalar el paquete y el modelo español sin APIs de pago. El render no depende de TTS.

## Vercel

Importa el repositorio en Vercel, usa `npm run build` como Build Command y `dist` como Output Directory. `vercel.json` dirige rutas de la aplicación a `index.html`.
