# Frutinovelas Studio

Prototipo inicial para escribir mini novelas de frutas y renderizarlas en video vertical con React y Remotion.

## Requisitos y comandos

Usa Node.js 20 o superior.

```bash
npm ci
npm run dev       # editor web en http://localhost:5173
npm test          # validación de guion
npm run build     # TypeScript + bundle web para Vercel
npm run render    # MP4 H.264 de 5 s, 1080x1920, 30 fps en out/
```

El guion inicial y su validador están en `src/script.ts`; la composición se puede previsualizar en Remotion Studio con `npm run remotion`. El botón Exportar muestra el comando local de render; no ejecuta un render en el navegador.

Kokoro es opcional y local. Consulta [docs/KOKORO.md](docs/KOKORO.md) para instalar el paquete y el modelo español sin APIs de pago. El primer render no depende de TTS.

## Vercel

Importa el repositorio en Vercel, usa `npm run build` como Build Command y `dist` como Output Directory. `vercel.json` dirige rutas de la aplicación a `index.html`.
