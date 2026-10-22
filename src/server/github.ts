import type { VercelRequest } from '@vercel/node';
import { createHash } from 'node:crypto';
import { ApiError, requiredEnv } from './auth';

const OWNER = 'Faantasydev';
const REPO = 'Frutinovelas';
const WORKFLOW = 'render.yml';
const RUN_PREFIX = 'Frutinovelas:';
const API = 'https://api.github.com';

export type WorkflowRun = { id: number; display_title: string; status: string; conclusion: string | null; created_at: string; html_url: string };
export type RenderStatus = 'pending' | 'processing' | 'completed' | 'error';

function headers(): HeadersInit {
  return { Accept: 'application/vnd.github+json', Authorization: `Bearer ${requiredEnv('GITHUB_ACTIONS_TOKEN')}`, 'X-GitHub-Api-Version': '2022-11-28' };
}

async function github(path: string, init?: RequestInit): Promise<Response> {
  let response:Response;
  try {response=await fetch(`${API}${path}`, { ...init, headers: { ...headers(), ...init?.headers } });}
  catch {throw new ApiError(503,'No se pudo conectar con GitHub Actions. Revisa la disponibilidad del servicio.');}
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    const status = response.status === 401 || response.status === 403 ? 503 : 502;
    throw new ApiError(status, `GitHub Actions respondió ${response.status}.${detail.slice(0, 160)}`);
  }
  return response;
}

export async function dispatchRender(sessionId: string, jobId: string, scriptJson: string, title: string): Promise<void> {
  const ref = process.env.FRUTINOVELAS_GITHUB_REF || 'work';
  await github(`/repos/${OWNER}/${REPO}/actions/workflows/${WORKFLOW}/dispatches`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ref, inputs: { owner_id: sessionId, job_id: jobId, script_json: scriptJson, episode_title: title } }),
  });
}

export async function listSessionRuns(sessionId: string): Promise<WorkflowRun[]> {
  const query = new URLSearchParams({ event: 'workflow_dispatch', branch: process.env.FRUTINOVELAS_GITHUB_REF || 'work', per_page: '100' });
  const response = await github(`/repos/${OWNER}/${REPO}/actions/workflows/${WORKFLOW}/runs?${query}`);
  const data = await response.json() as { workflow_runs: WorkflowRun[] };
  const prefix = `${RUN_PREFIX}${sessionId}:`;
  return (data.workflow_runs ?? []).filter((run) => typeof run.display_title === 'string' && run.display_title.startsWith(prefix));
}

export function jobIdFromRun(run: WorkflowRun, sessionId: string): string | null {
  const prefix = `${RUN_PREFIX}${sessionId}:`;
  if (!run.display_title?.startsWith(prefix)) return null;
  const id = run.display_title.slice(prefix.length, prefix.length + 36);
  return /^[0-9a-f-]{36}$/i.test(id) && run.display_title[prefix.length + 36] === ':' ? id : null;
}

export function jobTitleFromRun(run: WorkflowRun, sessionId: string, jobId: string): string {
  return run.display_title.slice(`${RUN_PREFIX}${sessionId}:${jobId}:`.length) || 'Episodio';
}

export function mapStatus(run: WorkflowRun): RenderStatus {
  if (run.status === 'queued' || run.status === 'requested' || run.status === 'waiting' || run.status === 'pending') return 'pending';
  if (run.status !== 'completed') return 'processing';
  return run.conclusion === 'success' ? 'completed' : 'error';
}

export async function getRun(sessionId: string, jobId: string): Promise<WorkflowRun | null> {
  const runs = await listSessionRuns(sessionId);
  return runs.find((run) => jobIdFromRun(run, sessionId) === jobId) ?? null;
}

export async function getArtifact(runId: number, jobId: string, sessionId: string): Promise<number | null> {
  const response = await github(`/repos/${OWNER}/${REPO}/actions/runs/${runId}/artifacts`);
  const data = await response.json() as { artifacts: Array<{ id: number; name: string; expired: boolean }> };
  const name = `frutinovelas-${sessionId}-${jobId}`;
  return data.artifacts?.find((artifact) => artifact.name === name && !artifact.expired)?.id ?? null;
}

export async function downloadArtifact(artifactId: number): Promise<Uint8Array> {
  const response = await github(`/repos/${OWNER}/${REPO}/actions/artifacts/${artifactId}/zip`);
  const declaredSize = Number(response.headers.get('content-length') ?? 0);
  if (declaredSize > 100 * 1024 * 1024) throw new ApiError(413, 'El video supera el tamaño máximo permitido.');
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength > 100 * 1024 * 1024) throw new ApiError(413, 'El video supera el tamaño máximo permitido.');
  return bytes;
}

export function clientIp(req: VercelRequest): string {
  const value = req.headers['x-forwarded-for'];
  const first = Array.isArray(value) ? value[0] : value?.split(',')[0];
  return createHash('sha256').update((first ?? req.socket.remoteAddress ?? 'unknown').trim().slice(0, 100)).digest('hex');
}
