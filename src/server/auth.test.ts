import { afterEach, describe, expect, it, vi } from 'vitest';
import type { VercelRequest } from '@vercel/node';
import { getSession, issueSession } from './auth';

describe('signed web sessions',()=>{
  afterEach(()=>vi.unstubAllEnvs());

  it('accepts a signed cookie and rejects a changed signature',()=>{
    vi.stubEnv('SESSION_SECRET','test-session-signing-secret-with-32-bytes-minimum');
    const {token,session}=issueSession();
    const request=(cookie:string)=>({headers:{cookie:`fn_studio_session=${cookie}`}} as unknown as VercelRequest);
    expect(getSession(request(token))).toEqual(session);
    expect(getSession(request(`${token.slice(0,-1)}x`))).toBeNull();
  });
});
