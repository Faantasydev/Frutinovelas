import { randomUUID } from 'node:crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { validateScript, type EpisodeScript } from '../../src/script';
import { ApiError, assertSameOrigin, jsonError, requireSession } from '../../src/server/auth';
import { clientIp, dispatchRender, getArtifact, jobIdFromRun, jobTitleFromRun, listSessionRuns, mapStatus } from '../../src/server/github';
import { enforceRenderLimit, enforceStatusLimit } from '../../src/server/limits';

export const config = { api: { bodyParser: { sizeLimit: '64kb' } } };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const session=requireSession(req);
    if(req.method==='GET'){
      await enforceStatusLimit(session.sid);
      const runs=(await listSessionRuns(session.sid)).sort((a,b)=>Date.parse(b.created_at)-Date.parse(a.created_at)).slice(0,3);
      const jobs=await Promise.all(runs.map(async run=>{
        const id=jobIdFromRun(run,session.sid);if(!id)return null;
        let status=mapStatus(run);let videoUrl:string|undefined;
        if(status==='completed'){
          const artifact=await getArtifact(run.id,id,session.sid);
          if(artifact)videoUrl=`/api/jobs/${id}/video`;
          else status='processing';
        }
        return {id,title:jobTitleFromRun(run,session.sid,id),status,message:status==='error'?`El render terminó con estado ${run.conclusion}.`:undefined,videoUrl,createdAt:run.created_at};
      }));
      return res.status(200).json({jobs:jobs.filter(Boolean)});
    }
    if(req.method!=='POST'){res.setHeader('Allow','GET, POST');return res.status(405).json({error:'Método no permitido.'});}
    assertSameOrigin(req);
    const script=req.body?.script as EpisodeScript;
    if(!script||!validateScript(script))throw new ApiError(400,'El guion no es válido o supera los límites permitidos.');
    const serialized=JSON.stringify(script);
    if(Buffer.byteLength(serialized,'utf8')>48*1024)throw new ApiError(413,'El guion supera el tamaño máximo permitido.');
    await enforceRenderLimit(session.sid,clientIp(req));
    const runs=await listSessionRuns(session.sid);
    const active=runs.filter(run=>run.status==='queued'||run.status==='requested'||run.status==='waiting'||run.status==='in_progress');
    if(active.length>=2)throw new ApiError(429,'Ya hay dos episodios en proceso. Espera a que termine uno.');
    const jobId=randomUUID();
    await dispatchRender(session.sid,jobId,serialized,script.title);
    return res.status(202).json({job:{id:jobId,title:script.title,status:'pending'}});
  }catch(error){return jsonError(res,error);}
}
