"""Requires a disposable PostgreSQL-compatible TEST_DATABASE_URL. Never use production."""
import os,uuid
import pytest
os.environ.setdefault('HAKSCATCH_ADMIN_KEY','test-admin-key-000000000000000000')
os.environ.setdefault('HAKSCATCH_INGEST_KEY','test-ingest-key-00000000000000000')
if os.getenv('TEST_DATABASE_URL'):os.environ['DATABASE_URL']=os.environ['TEST_DATABASE_URL']
from fastapi.testclient import TestClient
from app.main import app, scrub

@pytest.fixture(scope='module')
def client():
    if not os.getenv('TEST_DATABASE_URL'):pytest.skip('Set TEST_DATABASE_URL to disposable test database')
    with TestClient(app) as c:yield c

def test_scrub():
    assert scrub({'api_key':'secret','message':'mail me at a@example.com'})=={'api_key':'[REDACTED]','message':'mail me at [EMAIL]'}

def test_ingest_read_evaluate_drift(client):
    project='test-'+uuid.uuid4().hex
    admin={'X-API-Key':os.environ['HAKSCATCH_ADMIN_KEY']};write={'X-API-Key':os.environ['HAKSCATCH_INGEST_KEY']}
    assert client.get('/api/overview').status_code==401
    assert client.get('/api/overview',headers=write).status_code==401
    payload=dict(id=str(uuid.uuid4()),project=project,name='request',latency_ms=42,prompt='Policy?',response='Refunds within 30 days',contexts=['Refunds within 30 days'],input_tokens=10,output_tokens=5)
    assert client.post('/api/traces',json=payload,headers=write).status_code==200
    assert client.post('/api/traces',json=payload,headers=write).status_code==409
    assert client.get('/api/traces/'+payload['id']+'?project=wrong',headers=admin).status_code==404
    assert client.post('/api/logs',headers=write,json=dict(project=project,trace_id=payload['id'],message='retrieval completed')).status_code==200
    assert client.post('/api/logs',headers=write,json=dict(project='wrong',trace_id=payload['id'],message='bad')).status_code==404
    assert client.get('/api/logs',headers=admin,params=dict(project=project,q='retrieval')).json()[0]['message']=='retrieval completed'
    assert client.post('/api/metrics',headers=write,json=dict(project=project,name='recall',value=.8)).status_code==200
    summary=client.get('/api/overview',headers=admin,params=dict(project=project)).json()['summary']
    assert summary['traces']==1 and summary['tokens']==15 and summary['p95_latency']==42
    result=client.post('/api/traces/'+payload['id']+'/evaluate',params=dict(project=project),headers=admin).json()
    assert result['result']['groundedness']==1
    b=dict(project=project,name='v1',kind='vector',embedding_space='space1',vectors=[[1,0],[1,0]])
    ref=client.post('/api/baselines',json=b,headers=admin).json()
    d={**b,'baseline_id':ref['id'],'threshold':.2,'vectors':[[0,1],[0,1]]}
    assert client.post('/api/drift',json=d,headers=admin).json()['result']['alert']
    d['embedding_space']='wrong'
    assert client.post('/api/drift',json=d,headers=admin).status_code==422
    # Real judge is optional; missing config must never produce fabricated scores.
    if not os.getenv('OLLAMA_MODEL'):
        assert client.post('/api/traces/'+payload['id']+'/evaluate',params=dict(project=project,mode='judge'),headers=admin).status_code==503
    assert client.post('/api/logs',content=b'x'*2_000_001,headers=write).status_code==413

def test_judge_schema_and_failure(client,monkeypatch):
    from app import main
    project='judge-'+uuid.uuid4().hex;admin={'X-API-Key':os.environ['HAKSCATCH_ADMIN_KEY']}
    id=str(uuid.uuid4());client.post('/api/traces',headers=admin,json=dict(id=id,project=project,name='judge',latency_ms=10,response='answer',contexts=['evidence']))
    monkeypatch.setenv('OLLAMA_MODEL','test-model')
    class Good:
        def raise_for_status(self):pass
        def json(self):return {'message':{'content':'{"groundedness":0.5,"relevance":0.9,"reasoning":"Partially supported","unsupported_claims":[]}'}}
    monkeypatch.setattr(main.httpx,'post',lambda *a,**k:Good())
    path='/api/traces/'+id+'/evaluate?project='+project+'&mode=judge'
    assert client.post(path,headers=admin).json()['result']['groundedness']==.5
    class Bad(Good):
        def json(self):return {'message':{'content':'{"groundedness":9}'}}
    monkeypatch.setattr(main.httpx,'post',lambda *a,**k:Bad())
    assert client.post(path,headers=admin).status_code==502
