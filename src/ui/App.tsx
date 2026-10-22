import { useCallback, useEffect, useState } from 'react';
import { Player } from '@remotion/player';
import { Episode } from '../remotion/Episode';
import { addShot, FPS, initialScript, MAX_SCRIPT_FRAMES, scriptDurationInFrames, setShotDuration, validateScript, type EpisodeScript, type Shot } from '../script';

type JobStatus = 'pending' | 'processing' | 'completed' | 'error';
type RenderJob = { id: string; title: string; status: JobStatus; message?: string; videoUrl?: string; createdAt?: string };

const statusLabel: Record<JobStatus, string> = { pending: 'Pendiente', processing: 'Procesando', completed: 'Completado', error: 'Error' };

export default function App() {
  const [script,setScript]=useState<EpisodeScript>(initialScript);
  const [authenticated,setAuthenticated]=useState<boolean | null>(null);
  const [password,setPassword]=useState('');
  const [loginError,setLoginError]=useState('');
  const [jobs,setJobs]=useState<RenderJob[]>([]);
  const [notice,setNotice]=useState('');
  const duration=scriptDurationInFrames(script);
  const scriptIsValid=validateScript(script);

  const refreshJobs=useCallback(async()=>{
    try {
      const response=await fetch('/api/jobs',{credentials:'same-origin'});
      if(response.status===401){setAuthenticated(false);return;}
      if(!response.ok)return;
      const result=await response.json() as {jobs:RenderJob[]};
      setJobs(current=>{
        const returned=new Set(result.jobs.map(job=>job.id));
        const gracePeriod=current.filter(job=>!returned.has(job.id)&&!!job.createdAt&&Date.now()-Date.parse(job.createdAt)<120_000).map(job=>Date.now()-Date.parse(job.createdAt!)>60_000?{...job,status:'error' as const,message:'GitHub Actions no registró el trabajo. Revisa la configuración del servidor.'}:job);
        return [...gracePeriod.filter(job=>!returned.has(job.id)),...result.jobs];
      });
    } catch { /* Keep the last known job state during short network interruptions. */ }
  },[]);

  useEffect(()=>{fetch('/api/auth/me',{credentials:'same-origin'}).then(r=>setAuthenticated(r.ok)).catch(()=>setAuthenticated(false));},[]);
  useEffect(()=>{if(!authenticated)return;void refreshJobs();const timer=window.setInterval(()=>void refreshJobs(),8000);return()=>window.clearInterval(timer);},[authenticated,refreshJobs]);

  const updateShot=(index:number,patch:Partial<Shot>)=>setScript(current=>({...current,shots:current.shots.map((shot,i)=>i===index?{...shot,...patch}:shot)}));
  const changeDuration=(index:number,seconds:number)=>setScript(current=>{
    const currentDuration=current.shots[index].end-current.shots[index].start;
    const maxFrames=MAX_SCRIPT_FRAMES-(scriptDurationInFrames(current)-currentDuration);
    return setShotDuration(current,index,Math.min(maxFrames,Math.max(15,Math.round(seconds*FPS))));
  });
  const removeShot=(index:number)=>setScript(current=>{
    if(current.shots.length===1)return current;
    const shots=current.shots.filter((_,i)=>i!==index);let cursor=0;
    const normalized=shots.map(shot=>{const size=shot.end-shot.start;const next={...shot,start:cursor,end:cursor+size};cursor+=size;return next;});
    return {...current,shots:normalized};
  });

  const login=async(event:React.FormEvent)=>{
    event.preventDefault();setLoginError('');
    try {const response=await fetch('/api/auth/login',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify({password})});
      if(!response.ok){const data=await response.json().catch(()=>({}));setLoginError(data.error??'No se pudo iniciar sesión.');return;}
      setPassword('');setAuthenticated(true);
    } catch {setLoginError('No se pudo conectar con el servidor.');}
  };

  const logout=async()=>{await fetch('/api/auth/logout',{method:'POST',credentials:'same-origin'}).catch(()=>{});setAuthenticated(false);setJobs([]);};
  const generate=async()=>{
    if(!scriptIsValid)return;setNotice('Enviando el episodio a GitHub Actions…');
    try {const response=await fetch('/api/jobs',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify({script})});
      const data=await response.json().catch(()=>({}));
      if(!response.ok){setNotice(data.error??'No se pudo iniciar el render.');return;}
      setJobs(current=>[{id:data.job.id,title:script.title,status:'pending',createdAt:new Date().toISOString()},...current.filter(job=>job.id!==data.job.id)]);
      setNotice('Episodio en cola. Puedes continuar editando mientras se renderiza.');
    } catch {setNotice('No se pudo conectar con el servidor de render.');}
  };

  if(authenticated===null)return <main className="auth-screen"><div className="auth-card"><span className="brand-mark">f</span><p>Comprobando sesión…</p></div></main>;
  if(!authenticated)return <main className="auth-screen"><form className="auth-card" onSubmit={login}><a className="brand auth-brand" href="#"><span className="brand-mark">f</span><span>frutinovelas<span className="brand-light"> studio</span></span></a><div className="eyebrow">ESTUDIO PRIVADO</div><h1>Bienvenido<br/><em>de vuelta.</em></h1><p>Inicia sesión para generar y ver tus episodios.</p><label className="field-label" htmlFor="studio-password">Contraseña del estudio</label><input id="studio-password" type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required/><button className="button primary full-button">Entrar al estudio <span>→</span></button>{loginError&&<p className="form-error" role="alert">{loginError}</p>}</form></main>;

  return <main className="app-shell">
    <header className="topbar"><a className="brand" href="#"><span className="brand-mark">f</span><span>frutinovelas<span className="brand-light"> studio</span></span></a><div className="top-actions"><span className="saved"><i/> Sesión privada</span><button className="button secondary" onClick={logout}>Cerrar sesión</button><button className="button primary" onClick={()=>void generate()} disabled={!scriptIsValid||jobs.some(job=>job.status==='pending'||job.status==='processing')}>Generar video <span>↗</span></button></div></header>
    <section className="welcome"><div><div className="eyebrow"><span>✦</span> TU ESTUDIO CREATIVO</div><h1>Una historia deliciosa<br/><em>empieza aquí.</em></h1><p>Edita escenas, personajes y diálogos; genera tu episodio en la nube y recibe un MP4 listo para reproducir.</p></div><div className="welcome-sticker"><span>🍓</span><b>Capítulo<br/>{String(script.shots.length).padStart(2,'0')}</b><span>🍌</span></div></section>
    <section className="workspace"><div className="editor-card visual-editor"><div className="card-head"><div><span className="step">01</span><div><h2>Tu episodio</h2><small>Arma la historia escena por escena.</small></div></div><span className={`json-badge ${scriptIsValid?'':'invalid-badge'}`}>{scriptIsValid?'Guion válido':'Revisa el guion'}</span></div>
      <label className="field-label" htmlFor="episode-title">Título del episodio</label><input id="episode-title" className="title-input" maxLength={80} value={script.title} onChange={e=>setScript(current=>({...current,title:e.target.value}))}/>
      <div className="scene-list">{script.shots.map((shot,index)=><article className="scene-card" key={`${index}-${shot.start}`}><div className="scene-heading"><div><span className="scene-index">ESCENA {String(index+1).padStart(2,'0')}</span><span className="scene-time">{(shot.end-shot.start)/FPS}s</span></div>{script.shots.length>1&&<button className="remove-scene" aria-label={`Eliminar escena ${index+1}`} onClick={()=>removeShot(index)}>Eliminar</button>}</div>
        <label className="field-label">Personaje</label><select value={shot.speaker} onChange={e=>updateShot(index,{speaker:e.target.value as Shot['speaker']})}><option value="fresa">🍓 Fresa</option><option value="banano">🍌 Banano</option></select>
        <label className="field-label">Diálogo</label><textarea className="dialogue-input" maxLength={500} value={shot.text} onChange={e=>updateShot(index,{text:e.target.value})}/>
        <div className="scene-controls"><label><span>Duración</span><div className="duration-input"><input aria-label={`Duración de escena ${index+1} en segundos`} type="number" min="0.5" max={((MAX_SCRIPT_FRAMES-(duration-(shot.end-shot.start)))/FPS).toFixed(1)} step="0.5" value={((shot.end-shot.start)/FPS).toFixed(1)} onChange={e=>changeDuration(index,Number(e.target.value)||0.5)}/><span>s</span></div></label><label><span>Cámara</span><select value={shot.camera} onChange={e=>updateShot(index,{camera:e.target.value as Shot['camera']})}><option value="wide">Plano general</option><option value="close">Primer plano</option></select></label></div>
      </article>)}</div><div className="editor-actions"><button className="button secondary" disabled={script.shots.length>=20||duration+90>MAX_SCRIPT_FRAMES} onClick={()=>setScript(current=>addShot(current))}>＋ Añadir escena</button><span className="duration-total">Duración total <b>{(duration/FPS).toFixed(1)} s</b> · máximo 60 s</span></div>
    </div>
      <div className="preview-column"><div className="preview-top"><div><span className="step">02</span><div><h2>Vista previa</h2><small>Vertical · 1080 × 1920 · 30 fps</small></div></div><button className="icon-btn" onClick={()=>void refreshJobs()} aria-label="Actualizar trabajos">↻</button></div><div className="player-frame">{scriptIsValid?<Player key={duration} component={Episode} inputProps={{script}} durationInFrames={duration} fps={FPS} compositionWidth={1080} compositionHeight={1920} controls loop style={{width:'100%',height:'100%'}}/>:<div className="invalid">Completa el título y los diálogos para reproducir la vista previa.</div>}</div><div className="timeline"><div className="timeline-label"><span>SECUENCIA</span><span>{(duration/FPS).toFixed(1)}s</span></div><div className="track">{script.shots.map((shot,index)=><i key={index} style={{flexGrow:shot.end-shot.start,background:shot.speaker==='fresa'?'#e95062':'#f2b948'}}/> )}</div><div className="timeline-captions">{script.shots.map((shot,index)=><span key={index}>{shot.speaker==='fresa'?'FRESA':'BANANO'}</span>)}</div></div></div></section>

    {notice&&<p className="notice" role="status">{notice}</p>}
    <section className="jobs-section"><div className="jobs-heading"><div><span className="step">03</span><div><h2>Tus videos</h2><small>Los renders se procesan en GitHub Actions.</small></div></div><button className="button secondary" onClick={()=>void refreshJobs()}>Actualizar</button></div>
      {jobs.length===0?<div className="empty-jobs">Tus episodios generados aparecerán aquí.</div>:<div className="jobs-grid">{jobs.map(job=><article className="job-card" key={job.id}><div className="job-top"><div><h3>{job.title}</h3><small>Trabajo {job.id.slice(0,8)}</small></div><span className={`job-status ${job.status}`}><i/>{statusLabel[job.status]}</span></div>{job.message&&<p className="job-error">{job.message}</p>}{job.status==='completed'&&job.videoUrl&&<><video className="job-video" src={job.videoUrl} controls preload="metadata"/><a className="button primary download-button" href={`${job.videoUrl}?download=1`} download={`${job.title.replace(/[^\p{L}\p{N}-]+/gu,'-')}.mp4`}>Descargar MP4 ↓</a></>}</article>)}</div>}
    </section>
    <footer><span>Hecho con cariño y un poquito de drama frutal.</span><span>FRUTINOVELAS STUDIO <b>·</b> V 0.2</span></footer>
  </main>;
}
