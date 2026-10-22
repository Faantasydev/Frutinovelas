import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { ApiError } from './auth';

let redis: Redis | undefined;
let loginLimit: Ratelimit | undefined;
let renderLimit: Ratelimit | undefined;
let renderIpLimit: Ratelimit | undefined;
let statusLimit: Ratelimit | undefined;
let videoLimit: Ratelimit | undefined;

function getLimiters() {
  if (loginLimit && renderLimit && renderIpLimit && statusLimit && videoLimit) return { loginLimit, renderLimit, renderIpLimit, statusLimit, videoLimit };
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new ApiError(503, 'Falta configurar Upstash Redis para proteger el uso del servicio.');
  redis = new Redis({ url, token });
  loginLimit = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, '15 m'), prefix: 'fn:login', analytics: false });
  renderLimit = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, '1 h'), prefix: 'fn:render', analytics: false });
  renderIpLimit = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(15, '1 h'), prefix: 'fn:render-ip', analytics: false });
  statusLimit = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, '1 m'), prefix: 'fn:status', analytics: false });
  videoLimit = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, '1 m'), prefix: 'fn:video', analytics: false });
  return { loginLimit, renderLimit, renderIpLimit, statusLimit, videoLimit };
}

async function consume(limiter:Ratelimit,key:string,message:string):Promise<void>{
  try {const result=await limiter.limit(key);if(!result.success)throw new ApiError(429,message);}
  catch(error){if(error instanceof ApiError)throw error;throw new ApiError(503,'El servicio de límites no está disponible temporalmente.');}
}

export async function enforceLoginLimit(ip: string): Promise<void> {
  const {loginLimit:limiter}=getLimiters();
  await consume(limiter,ip,'Demasiados intentos. Vuelve a intentarlo más tarde.');
}

export async function enforceRenderLimit(sessionId: string,ip:string): Promise<void> {
  const {renderLimit:limiter,renderIpLimit:ipLimiter}=getLimiters();
  await consume(limiter,sessionId,'Llegaste al límite de 5 renders por hora para esta sesión.');
  await consume(ipLimiter,ip,'Llegaste al límite de 15 renders por hora desde esta red.');
}

export async function enforceStatusLimit(sessionId: string): Promise<void> {
  const {statusLimit:limiter}=getLimiters();
  await consume(limiter,sessionId,'Espera un momento antes de actualizar el estado de tus videos.');
}

export async function enforceVideoLimit(sessionId:string):Promise<void>{
  const {videoLimit:limiter}=getLimiters();
  await consume(limiter,sessionId,'Llegaste al límite temporal de reproducción y descargas.');
}
