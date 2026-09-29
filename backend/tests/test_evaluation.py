import pytest
from pydantic import ValidationError
from app.evaluation import grounding, vector_drift, agent_drift
from app.models import Baseline, Trace, Metric

def test_grounding_supported_and_missing():
    assert grounding('Refunds within 30 days',['Refunds within 30 days'])['groundedness']==1
    assert grounding('Lifetime guarantee',['Refunds within 30 days'])['groundedness']==0
    assert grounding('answer',[])['status']=='insufficient_data'

def test_vector_identity_and_opposite():
    v=[[1,0],[1,0]]
    assert vector_drift(v,v,.2)['score']==0
    assert vector_drift(v,[[-1,0],[-1,0]],.2)['score']==1
    with pytest.raises(ValueError):vector_drift(v,[[1,0,0],[1,0,0]],.2)

def test_agent_order_and_unseen_transition():
    v=[['search','answer'],['search','answer']]
    assert agent_drift(v,v,.2)['score']==0
    r=agent_drift(v,[['answer','search'],['answer','search']],.2)
    assert r['score']==1 and r['alert']

def test_baseline_rejects_invalid_vectors():
    for vectors in [[[0,0],[1,0]],[[1,0],[1]],[[float('nan'),1],[1,0]]]:
        with pytest.raises(ValidationError):Baseline(name='test',kind='vector',embedding_space='v1',vectors=vectors)

def test_span_cycles_rejected():
    with pytest.raises(ValidationError):Trace(id='1',name='bad',latency_ms=1,spans=[dict(id='a',parent_id='b',name='a',duration_ms=1),dict(id='b',parent_id='a',name='b',duration_ms=1)])

def test_metric_rejects_nonfinite():
    with pytest.raises(ValidationError):Metric(name='bad',value=float('inf'))
