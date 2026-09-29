import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'sdk'))
from hakscatch import Client
import pytest

def test_sdk_privacy_and_exception():
    client=Client('http://unused','key');sent=[]
    client._send=lambda path,payload:sent.append(payload)
    with client.trace('test') as run:
        run.prompt='private';run.response='private'
        with run.span('parent','agent') as p:
            with run.span('child','tool',p):pass
    assert sent[0]['prompt']=='' and len(sent[0]['spans'])==2
    with pytest.raises(ValueError):
        with client.trace('failed'):raise ValueError('application error')
    assert sent[-1]['status']=='error'
