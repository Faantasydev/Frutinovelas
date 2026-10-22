export type FruitCharacter = 'fresa' | 'banano';
export type Shot = { start: number; end: number; camera: 'wide' | 'close'; speaker: FruitCharacter; text: string };
export type EpisodeScript = { title: string; shots: Shot[] };

export const initialScript: EpisodeScript = {
  title: 'La última fresa',
  shots: [
    { start: 0, end: 72, camera: 'wide', speaker: 'fresa', text: 'Banano… ¿guardaste la última fresa?' },
    { start: 72, end: 150, camera: 'close', speaker: 'banano', text: '¿Yo? ¡Jamás haría algo así!' },
  ],
};

export function validateScript(value: unknown): value is EpisodeScript {
  if (!value || typeof value !== 'object') return false;
  const script = value as EpisodeScript;
  return typeof script.title === 'string' && Array.isArray(script.shots) && script.shots.length > 0 &&
    script.shots.every((shot) => Number.isFinite(shot.start) && Number.isFinite(shot.end) && shot.start >= 0 && shot.start < shot.end &&
      ['wide', 'close'].includes(shot.camera) && ['fresa', 'banano'].includes(shot.speaker) && typeof shot.text === 'string');
}
