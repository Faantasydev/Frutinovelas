import { unzipSync } from 'fflate';
import { once } from 'node:events';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ApiError, jsonError, requireSession, setPrivateResponseHeaders } from '../../../src/server/auth';
import { downloadArtifact, getArtifact, getRun, mapStatus } from '../../../src/server/github';
import { enforceVideoLimit } from '../../../src/server/limits';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setPrivateResponseHeaders(res);
  if(req.method!=='GET'&&req.method!=='HEAD'){res.setHeader('Allow','GET, HEAD');return res.status(405).json({error:'Método no permitido.'});}
  try {
    const session=requireSession(req);await enforceVideoLimit(session.sid);const id=String(req.query.id??'');
    if(!/^[0-9a-f-]{36}$/i.test(id))throw new ApiError(400,'Identificador de trabajo no válido.');
    const run=await getRun(session.sid,id);
    if(!run||mapStatus(run)!=='completed')throw new ApiError(409,'El video todavía no está disponible.');
    const artifactId=await getArtifact(run.id,id,session.sid);
    if(!artifactId)throw new ApiError(404,'No se encontró el artefacto de video.');
    const zip=await downloadArtifact(artifactId);const files=unzipSync(zip);
    const mp4=files['frutinovelas.mp4'];
    if(!mp4)throw new ApiError(404,'El artefacto no contiene el MP4 esperado.');
    const range=req.headers.range;let start=0;let end=mp4.byteLength-1;let partial=false;
    if(range){
      const match=/^bytes=(\d*)-(\d*)$/.exec(range);
      if(!match)throw new ApiError(416,'Rango de video no válido.');
      if(match[1]===''){const suffix=Number(match[2]);start=Math.max(0,mp4.byteLength-suffix);}else{start=Number(match[1]);if(match[2])end=Math.min(end,Number(match[2]));}
      if(start>end||start>=mp4.byteLength)throw new ApiError(416,'Rango de video fuera de límites.');partial=true;
    }
    const download=req.query.download==='1';
    res.setHeader('Content-Type','video/mp4');res.setHeader('Accept-Ranges','bytes');res.setHeader('Cache-Control','private, no-store');
    res.setHeader('Content-Length',String(end-start+1));res.setHeader('Content-Disposition',`${download?'attachment':'inline'}; filename="frutinovelas-${id}.mp4"`);
    if(partial)res.setHeader('Content-Range',`bytes ${start}-${end}/${mp4.byteLength}`);
    res.status(partial?206:200);
    if(req.method==='HEAD')return res.end();
    const chunkSize=64*1024;
    for(let offset=start;offset<=end;offset+=chunkSize){
      const chunk=Buffer.from(mp4.subarray(offset,Math.min(end+1,offset+chunkSize)));
      if(!res.write(chunk))await once(res,'drain');
    }
    return res.end();
  }catch(error){return jsonError(res,error);}
}
