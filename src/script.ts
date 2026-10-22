export type FruitCharacter = 'fresa' | 'banano';
export type Shot = { start: number; end: number; camera: 'wide' | 'close'; speaker: FruitCharacter; text: string };
export type EpisodeScript = { title: string; shots: Shot[] };
export const FPS = 30;
export const MAX_SCRIPT_FRAMES = 1800;

export const initialScript: EpisodeScript = {
  title: 'La última fresa',
  shots: [
    { start: 0, end: 72, camera: 'wide', speaker: 'fresa', text: 'Banano… ¿guardaste la última fresa?' },
    { start: 72, end: 150, camera: 'close', speaker: 'banano', text: '¿Yo? ¡Jamás haría algo así!' },
  ],
};

export function scriptDurationInFrames(script: EpisodeScript): number {
  return Math.max(...script.shots.map((shot) => shot.end), 0);
}

export function setShotDuration(script: EpisodeScript, index: number, durationInFrames: number): EpisodeScript {
  const shots = script.shots.map((shot) => ({ ...shot }));
  if (!shots[index]) return script;
  const delta = durationInFrames - (shots[index].end - shots[index].start);
  shots[index].end = shots[index].start + durationInFrames;
  for (let i = index + 1; i < shots.length; i++) {
    shots[i].start += delta;
    shots[i].end += delta;
  }
  return { ...script, shots };
}

export function addShot(script: EpisodeScript): EpisodeScript {
  if (script.shots.length >= 20) return script;
  const end = scriptDurationInFrames(script);
  if (end + 90 > MAX_SCRIPT_FRAMES) return script;
  return { ...script, shots: [...script.shots, { start: end, end: end + 90, camera: 'wide', speaker: 'fresa', text: 'Escribe tu diálogo…' }] };
}

export function validateScript(value: unknown): value is EpisodeScript {
  if (!value || typeof value !== 'object') return false;
  const script = value as EpisodeScript;
  if (typeof script.title !== 'string' || script.title.trim().length < 1 || script.title.length > 80 || /[\u0000-\u001f\u007f]/.test(script.title) || !Array.isArray(script.shots) || script.shots.length < 1 || script.shots.length > 20) return false;
  let cursor = 0;
  for (const shot of script.shots) {
    if (!shot || typeof shot !== 'object') return false;
    if (!Number.isInteger(shot.start) || !Number.isInteger(shot.end) || shot.start !== cursor || shot.end <= shot.start || shot.end - shot.start < 15 ||
      !['wide', 'close'].includes(shot.camera) || !['fresa', 'banano'].includes(shot.speaker) || typeof shot.text !== 'string' || shot.text.trim().length < 1 || shot.text.length > 500) return false;
    cursor = shot.end;
  }
  return cursor <= MAX_SCRIPT_FRAMES;
}
