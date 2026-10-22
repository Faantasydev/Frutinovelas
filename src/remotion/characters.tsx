import { spring, useCurrentFrame, useVideoConfig } from 'remotion';

export const Strawberry = ({ active = false }: { active?: boolean }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const bob = Math.sin(f / 8) * 5; const blink = f % 83 < 4 ? 0.18 : 1;
  const talk = active ? Math.abs(Math.sin(f * 0.72)) * 8 : 0;
  const enter = spring({ frame: f, fps, config: { damping: 12 } });
  return <svg viewBox="0 0 320 360" width="100%" height="100%" style={{ transform: `translateY(${bob + (1-enter)*70}px) rotate(${Math.sin(f/20)*2}deg)` }} aria-label="Fresa">
    <ellipse cx="160" cy="322" rx="100" ry="18" fill="#713b2922"/><path d="M160 58 C89 43 52 100 64 191 C76 276 131 323 160 330 C190 322 245 276 257 191 C270 100 231 43 160 58Z" fill="#f45568" stroke="#bd3151" strokeWidth="7"/>
    <path d="M160 59 Q113 22 93 49 Q130 51 160 83 Q184 40 224 44 Q196 25 160 59Z" fill="#4f9b68" stroke="#347a4b" strokeWidth="5"/>
    {[0,1,2,3,4,5,6,7,8].map((i)=><ellipse key={i} cx={95+(i%3)*63+(i%2)*5} cy={116+Math.floor(i/3)*49} rx="4" ry="8" fill="#ffd16b" transform={`rotate(18 ${95+(i%3)*63} ${116+Math.floor(i/3)*49})`}/>)}
    <ellipse cx="125" cy="174" rx="10" ry={13*blink} fill="#3b2830"/><ellipse cx="195" cy="174" rx="10" ry={13*blink} fill="#3b2830"/><circle cx="128" cy="170" r="3" fill="white"/><circle cx="198" cy="170" r="3" fill="white"/>
    <path d={`M143 207 Q160 ${216+talk} 177 207`} fill="none" stroke="#812b43" strokeWidth="6" strokeLinecap="round"/>
    <path d="M75 210 Q44 215 39 190 M245 210 Q274 215 281 190" fill="none" stroke="#bd3151" strokeWidth="9" strokeLinecap="round"/>
  </svg>;
};

export const Banana = ({ active = false }: { active?: boolean }) => {
  const f=useCurrentFrame(); const {fps}=useVideoConfig(); const bob=Math.sin(f/9+1)*5; const blink=f%91<4?0.2:1;
  const talk=active?Math.abs(Math.sin(f*0.8))*7:0; const enter=spring({frame:f,fps,config:{damping:13}});
  return <svg viewBox="0 0 320 360" width="100%" height="100%" style={{transform:`translateY(${bob+(1-enter)*65}px) rotate(${Math.sin(f/17+1)*2}deg)`}} aria-label="Banano">
    <ellipse cx="162" cy="322" rx="103" ry="18" fill="#713b2922"/><path d="M70 75 Q87 48 119 65 Q158 119 226 102 Q249 96 261 78 Q281 92 267 129 Q236 214 168 272 Q133 303 98 286 Q66 269 70 229 Q112 235 157 202 Q203 169 212 127 Q137 143 95 111 Q75 96 70 75Z" fill="#ffd44f" stroke="#cc9d2c" strokeWidth="8" strokeLinejoin="round"/><path d="M73 75 Q85 63 103 64 L116 79 Q94 88 79 99Z M260 78 Q274 72 282 85 L272 105 Q257 104 248 98Z" fill="#6b4932"/><ellipse cx="147" cy="149" rx="9" ry={12*blink} fill="#3b2830"/><ellipse cx="194" cy="148" rx="9" ry={12*blink} fill="#3b2830"/><circle cx="149" cy="146" r="3" fill="white"/><circle cx="196" cy="145" r="3" fill="white"/><path d={`M159 181 Q174 ${192+talk} 190 179`} fill="none" stroke="#895522" strokeWidth="6" strokeLinecap="round"/><path d="M129 185 Q106 191 99 179 M213 183 Q234 188 242 174" fill="none" stroke="#b77f26" strokeWidth="8" strokeLinecap="round"/>
  </svg>;
};
