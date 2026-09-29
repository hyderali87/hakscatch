"""Send visibly synthetic demo data through the real API. Does not fake historical timestamps."""
import json, os, random, uuid
from pathlib import Path
from urllib.request import Request,urlopen
ROOT=Path(__file__).resolve().parents[1]
values=dict(line.split('=',1) for line in (ROOT/'.env').read_text().splitlines() if '=' in line and not line.startswith('#'))
key=os.getenv('HAKSCATCH_ADMIN_KEY',values['HAKSCATCH_ADMIN_KEY'])
base=os.getenv('HAKSCATCH_URL','http://localhost:8000')
def post(path,data):
    with urlopen(Request(base+'/api/'+path,data=json.dumps(data).encode(),headers={'X-API-Key':key,'Content-Type':'application/json'}),timeout=15) as r:return json.load(r)
rng=random.Random(42)
for i in range(36):
    id=str(uuid.uuid4());bad=i%7==0
    latency=rng.randint(200,2800)
    post('traces',dict(id=id,project='demo',name=['support-agent','research-assistant','document-qa'][i%3],model='synthetic-demo',status='error' if i%11==0 else 'ok',latency_ms=latency,input_tokens=rng.randint(100,1100),output_tokens=rng.randint(30,400),prompt='What is the refund window?',response='All purchases have a lifetime refund guarantee.' if bad else 'Refunds are available within 30 days of purchase.',contexts=['Refunds are available within 30 days of purchase.'],tools=['search','answer'],spans=[dict(id='root',name='orchestrator',kind='agent',duration_ms=latency),dict(id='retrieve',parent_id='root',name='retrieve-policy',kind='retriever',duration_ms=latency*.2),dict(id='answer',parent_id='root',name='generate-answer',kind='llm',duration_ms=latency*.8)],attributes={'synthetic':True,'release':'demo-v1'}))
    post('logs',dict(project='demo',trace_id=id,level='WARN' if bad else 'INFO',message='Synthetic demo: evidence mismatch suspected' if bad else 'Synthetic demo: retrieval completed',attributes={'synthetic':True}))
    post('metrics',dict(project='demo',name='retrieval.recall',value=.4 if bad else .95,unit='ratio'))
    if i<8:post('traces/'+id+'/evaluate?project=demo&mode=lexical',{})
# Unique names make repeated seed runs safe.
suffix=uuid.uuid4().hex[:6]
for kind in ['vector','agent']:
    data=dict(project='demo',name='demo-'+kind+'-'+suffix,kind=kind,embedding_space='demo-embedding-v1',vectors=[[1,0,0],[.95,.05,0],[.9,.1,0]] if kind=='vector' else [],tool_sequences=[['search','answer'],['search','answer']] if kind=='agent' else [])
    b=post('baselines',data)
    data.update(baseline_id=b['id'],threshold=.2,name='current-'+suffix)
    if kind=='vector':data['vectors']=[[0,1,0],[.05,.95,0],[.1,.9,0]]
    else:data['tool_sequences']=[['search','retry','search','answer'],['search','retry','answer']]
    post('drift',data)
print('Seeded project demo: 36 synthetic traces, logs, metrics and evaluation examples.')
