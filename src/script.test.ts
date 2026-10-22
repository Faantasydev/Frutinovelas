import { describe, expect, it } from 'vitest';
import { addShot, initialScript, scriptDurationInFrames, setShotDuration, validateScript } from './script';

describe('episode script', () => {
  it('accepts the included two-scene Spanish script', () => expect(validateScript(initialScript)).toBe(true));
  it('rejects a scene with an invalid frame range', () => {
    expect(validateScript({...initialScript, shots:[{...initialScript.shots[0], end:0}]})).toBe(false);
  });
  it('rejects malformed input', () => expect(validateScript({title:'x',shots:[]})).toBe(false));
  it('rejects null scenes without throwing', () => expect(validateScript({title:'x',shots:[null]})).toBe(false));
  it('keeps scene timing contiguous when a duration changes', () => {
    const next=setShotDuration(initialScript,0,90);
    expect(next.shots[1].start).toBe(90);
    expect(next.shots[1].end).toBe(168);
    expect(scriptDurationInFrames(next)).toBe(168);
    expect(validateScript(next)).toBe(true);
  });
  it('adds a new scene after the current timeline', () => {
    const next=addShot(initialScript);
    expect(next.shots[2].start).toBe(150);
    expect(next.shots[2].end).toBe(240);
    expect(validateScript(next)).toBe(true);
  });
});
