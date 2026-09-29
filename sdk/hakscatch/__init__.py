"""No external dependencies. Synchronous best-effort telemetry; not an OTLP exporter."""
from dataclasses import dataclass, field, asdict
from contextlib import contextmanager
import json, os, time, uuid, warnings
from urllib.request import Request, urlopen

@dataclass
class Run:
    id: str = field(default_factory=lambda:str(uuid.uuid4()))
    prompt: str = ""
    response: str = ""
    contexts: list = field(default_factory=list)
    tools: list = field(default_factory=list)
    spans: list = field(default_factory=list)
    attributes: dict = field(default_factory=dict)
    input_tokens: int = 0
    output_tokens: int = 0
    @contextmanager
    def span(self,name,kind="tool",parent_id=None):
        s={"id":str(uuid.uuid4()),"parent_id":parent_id,"name":name,"kind":kind,"status":"ok"}
        start=time.perf_counter()
        try:yield s['id']
        except BaseException:
            s['status']='error';raise
        finally:
            s['duration_ms']=(time.perf_counter()-start)*1000
            self.spans.append(s)

class Client:
    def __init__(self,url,key,project="default",strict=False,capture_content=False):
        self.url=url.rstrip('/');self.key=key;self.project=project;self.strict=strict;self.capture_content=capture_content
    @classmethod
    def from_env(cls,project="default",**kwargs):
        return cls(os.environ.get('HAKSCATCH_URL','http://localhost:8000'),os.environ['HAKSCATCH_INGEST_KEY'],project,**kwargs)
    def _send(self,path,payload):
        try:
            req=Request(self.url+'/api/'+path,data=json.dumps(payload).encode(),headers={'Content-Type':'application/json','X-API-Key':self.key})
            with urlopen(req,timeout=5) as r:return json.load(r)
        except Exception:
            if self.strict:raise
            warnings.warn('hakscatch telemetry delivery failed (payload omitted)',RuntimeWarning,stacklevel=2)
    @contextmanager
    def trace(self,name,model="unknown"):
        run=Run();start=time.perf_counter();status='ok';failed=False
        try:yield run
        except BaseException:
            status='error';failed=True;raise
        finally:
            payload=asdict(run)
            if not self.capture_content:
                payload.update(prompt='',response='',contexts=[])
            payload.update(project=self.project,name=name,model=model,status=status,latency_ms=(time.perf_counter()-start)*1000)
            # Never mask the application exception with an ingestion error.
            try:self._send('traces',payload)
            except Exception:
                if not failed:raise
    def log(self,level,message,trace_id=None,**attributes):
        return self._send('logs',dict(project=self.project,level=level,message=message,trace_id=trace_id,attributes=attributes))
    def metric(self,name,value,unit="",**attributes):
        return self._send('metrics',dict(project=self.project,name=name,value=value,unit=unit,attributes=attributes))
