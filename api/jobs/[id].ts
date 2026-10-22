import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ApiError, jsonError, requireSession, setPrivateResponseHeaders } from '../../src/server/auth';
import { getArtifact, getRun, mapStatus } from '../../src/server/github';
import { enforceStatusLimit } from '../../src/server/limits';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setPrivateResponseHeaders(res);
  if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({error:'Método no permitido.'});}
  try {
    const session=requireSession(req);await enforceStatusLimit(session.sid);
    const id=String(req.query.id??'');if(!/^[0-9a-f-]{36}$/i.test(id))throw new ApiError(400,'Identificador de trabajo no válido.');
    const run=await getRun(session.sid,id);
    if(!run)return res.status(200).json({job:{id,status:'pending'}});
    let status=mapStatus(run);let videoUrl:string|undefined;
    if(status==='completed'){
      const artifact=await getArtifact(run.id,id,session.sid);
      if(artifact)videoUrl=`/api/jobs/${id}/video`;else status='processing';
    }
    return res.status(200).json({job:{id,status,message:status==='error'?`El render terminó con estado ${run.conclusion}.`:undefined,videoUrl}});
  }catch(error){return jsonError(res,error);}
}
