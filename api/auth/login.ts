import { createHash, timingSafeEqual } from 'node:crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ApiError, assertSameOrigin, issueSession, jsonError, setPrivateResponseHeaders, setSessionCookie, requiredEnv } from '../../src/server/auth';
import { clientIp } from '../../src/server/github';
import { enforceLoginLimit } from '../../src/server/limits';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setPrivateResponseHeaders(res);
  if (req.method !== 'POST') { res.setHeader('Allow','POST');return res.status(405).json({error:'Método no permitido.'}); }
  try {
    assertSameOrigin(req);
    await enforceLoginLimit(clientIp(req));
    const password = req.body?.password;
    if (typeof password !== 'string' || password.length > 256) throw new ApiError(400,'Introduce la contraseña del estudio.');
    const expected = requiredEnv('STUDIO_PASSWORD');
    if(expected.length<16)throw new ApiError(503,'STUDIO_PASSWORD debe tener al menos 16 caracteres.');
    const actualHash = createHash('sha256').update(password).digest();
    const expectedHash = createHash('sha256').update(expected).digest();
    if (!timingSafeEqual(actualHash,expectedHash)) throw new ApiError(401,'Contraseña incorrecta.');
    const {token}=issueSession();setSessionCookie(res,token);
    return res.status(200).json({ok:true});
  } catch(error) { return jsonError(res,error); }
}
