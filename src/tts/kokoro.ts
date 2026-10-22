/** Optional local Kokoro TTS adapter. No paid API is used. */
export type SpanishVoice = 'ef_dora' | 'em_alex' | 'em_santa';
export async function generateSpanishSpeech(text: string, outputPath: string, voice: SpanishVoice = 'ef_dora') {
  if (!text.trim()) throw new Error('El texto de voz no puede estar vacío.');
  // Kokoro currently ships as a Python package; call it in the optional worker so browser builds stay lightweight.
  const { spawn } = await import('node:child_process');
  const child = spawn('python3', ['scripts/kokoro_tts.py', text, outputPath, voice], { stdio: 'inherit' });
  const code = await new Promise<number | null>((resolve, reject) => {
    child.once('error', reject);
    child.once('close', resolve);
  });
  if (code !== 0) throw new Error('Kokoro TTS no disponible. Sigue docs/KOKORO.md para instalar sus dependencias locales.');
}
