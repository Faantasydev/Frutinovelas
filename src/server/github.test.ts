import { afterEach, describe, expect, it, vi } from 'vitest';
import { dispatchRender, jobIdFromRun, mapStatus, type WorkflowRun } from './github';

describe('GitHub Actions render adapter',()=>{
  afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();});

  it('dispatches the submitted per-episode script using a server token',async()=>{
    vi.stubEnv('GITHUB_ACTIONS_TOKEN','unit-test-server-token');
    vi.stubEnv('FRUTINOVELAS_GITHUB_REF','work');
    const fetchMock=vi.fn(async()=>new Response(null,{status:204}));
    vi.stubGlobal('fetch',fetchMock);
    const ownerId='11111111-1111-4111-8111-111111111111';
    const jobId='22222222-2222-4222-8222-222222222222';
    const script=JSON.stringify({title:'Episodio propio',shots:[{start:0,end:45,speaker:'fresa',camera:'close',text:'Hola'}]});
    await dispatchRender(ownerId,jobId,script,'Episodio propio');
    const [url,init]=fetchMock.mock.calls[0] as unknown as [string,RequestInit];
    expect(url).toContain('/actions/workflows/render.yml/dispatches');
    expect(init.method).toBe('POST');
    expect(new Headers(init.headers).get('authorization')).toBe('Bearer unit-test-server-token');
    expect(JSON.parse(String(init.body))).toMatchObject({ref:'work',inputs:{owner_id:ownerId,job_id:jobId,episode_title:'Episodio propio',script_json:script}});
  });

  it('maps a session-scoped workflow title to its UUID and job state',()=>{
    const run={id:1,display_title:'Frutinovelas:11111111-1111-4111-8111-111111111111:22222222-2222-4222-8222-222222222222:Hola',status:'completed',conclusion:'success',created_at:'',html_url:''} satisfies WorkflowRun;
    expect(jobIdFromRun(run,'11111111-1111-4111-8111-111111111111')).toBe('22222222-2222-4222-8222-222222222222');
    expect(jobIdFromRun(run,'33333333-3333-4333-8333-333333333333')).toBeNull();
    expect(mapStatus(run)).toBe('completed');
    expect(mapStatus({...run,status:'queued',conclusion:null})).toBe('pending');
    expect(mapStatus({...run,conclusion:'failure'})).toBe('error');
  });
});
