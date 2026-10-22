import { AbsoluteFill, interpolate, Sequence, useCurrentFrame } from 'remotion';
import { initialScript, type EpisodeScript } from '../script';
import { Banana, Strawberry } from './characters';

const ShotView = ({ shot }: { shot: EpisodeScript['shots'][number] }) => {
  const frame=useCurrentFrame(); const zoom=shot.camera==='close'?1.14:1;
  const pan=Math.sin(frame/24)*12;
  return <AbsoluteFill style={{background:'linear-gradient(145deg,#fff2dd 0%,#ffe5bd 100%)',overflow:'hidden'}}>
    <div style={{position:'absolute',inset:'5% 6% auto',height:'49%',borderRadius:'50%',background:'radial-gradient(ellipse,#fff9e8 0%,#f8d8aa 72%,transparent 73%)'}}/>
    <div style={{position:'absolute',bottom:'16%',left:'8%',right:'8%',height:24,borderRadius:20,background:'#d5945a',boxShadow:'0 12px 0 #b97543'}}/>
    <div style={{position:'absolute',inset:0,transform:`scale(${zoom}) translateX(${pan}px)`,transformOrigin:shot.camera==='close'?'50% 55%':'50% 50%'}}>
      <div style={{position:'absolute',left:'15%',bottom:'17%',width:'37%',height:'48%'}}><Strawberry active={shot.speaker==='fresa'}/></div>
      <div style={{position:'absolute',right:'11%',bottom:'17%',width:'40%',height:'48%'}}><Banana active={shot.speaker==='banano'}/></div>
    </div>
    <div style={{position:'absolute',top:'7%',left:0,right:0,textAlign:'center',fontFamily:'sans-serif',fontSize:37,fontWeight:800,color:'#6c3c41',letterSpacing:2}}>FRUTINOVELAS</div>
    <div style={{position:'absolute',bottom:'5%',left:'7%',right:'7%',padding:'24px 26px',borderRadius:24,background:'#fffdf7',boxShadow:'0 10px 30px #743a3020',fontFamily:'sans-serif',fontSize:31,lineHeight:1.25,fontWeight:700,color:'#422f31',textAlign:'center'}}>{shot.text}</div>
  </AbsoluteFill>;
};

export const Episode = ({ script = initialScript }: { script?: EpisodeScript }) => {
  const frame=useCurrentFrame();
  const fade=interpolate(frame,[0,9,141,150],[0,1,1,0],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  return <AbsoluteFill style={{opacity:fade}}>{script.shots.map((shot,i)=><Sequence key={`${shot.start}-${i}`} from={shot.start} durationInFrames={shot.end-shot.start}><ShotView shot={shot}/></Sequence>)}</AbsoluteFill>;
};
