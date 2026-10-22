import type { VercelRequest, VercelResponse } from '@vercel/node';
import { assertSameOrigin, clearSessionCookie } from '../../src/server/auth';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({error:'Método no permitido.'});}
  try {assertSameOrigin(req);clearSessionCookie(res);return res.status(200).json({ok:true});}
  catch {return res.status(403).json({error:'Origen de solicitud no permitido.'});}
}
