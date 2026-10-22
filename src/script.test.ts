import { describe, expect, it } from 'vitest';
import { initialScript, validateScript } from './script';

describe('episode script', () => {
  it('accepts the included two-scene Spanish script', () => expect(validateScript(initialScript)).toBe(true));
  it('rejects a scene with an invalid frame range', () => {
    expect(validateScript({...initialScript, shots:[{...initialScript.shots[0], end:0}]})).toBe(false);
  });
  it('rejects malformed input', () => expect(validateScript({title:'x',shots:[]})).toBe(false));
});
