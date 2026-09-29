from typing import Literal
from pydantic import BaseModel, Field, ConfigDict, model_validator
import math

class Strict(BaseModel):
    model_config = ConfigDict(extra="forbid", allow_inf_nan=False)

class Span(Strict):
    id: str = Field(min_length=1, max_length=128)
    parent_id: str | None = None
    name: str = Field(min_length=1, max_length=200)
    kind: Literal["agent", "llm", "retriever", "tool"] = "llm"
    duration_ms: float = Field(ge=0, le=86400000)
    status: Literal["ok", "error"] = "ok"

class Trace(Strict):
    id: str = Field(min_length=1, max_length=128)
    project: str = Field(default="default", min_length=1, max_length=100)
    name: str = Field(min_length=1, max_length=200)
    model: str = Field(default="unknown", max_length=200)
    status: Literal["ok", "error"] = "ok"
    latency_ms: float = Field(ge=0, le=86400000)
    input_tokens: int = Field(default=0, ge=0, le=100000000)
    output_tokens: int = Field(default=0, ge=0, le=100000000)
    prompt: str = Field(default="", max_length=30000)
    response: str = Field(default="", max_length=30000)
    contexts: list[str] = Field(default_factory=list, max_length=30)
    tools: list[str] = Field(default_factory=list, max_length=100)
    spans: list[Span] = Field(default_factory=list, max_length=200)
    attributes: dict = Field(default_factory=dict)
    @model_validator(mode="after")
    def validate_tree(self):
        ids = {s.id for s in self.spans}
        if len(ids) != len(self.spans): raise ValueError("duplicate span ids")
        parents = {s.id:s.parent_id for s in self.spans}
        for s in self.spans:
            seen = {s.id}; parent = s.parent_id
            while parent:
                if parent not in ids or parent in seen: raise ValueError("invalid or cyclic span parent")
                seen.add(parent); parent = parents[parent]
        if any(len(c)>30000 for c in self.contexts): raise ValueError("context too long")
        return self

class Log(Strict):
    project: str = Field(default="default", min_length=1,max_length=100)
    trace_id: str | None = Field(default=None,max_length=128)
    level: Literal["DEBUG","INFO","WARN","ERROR"] = "INFO"
    message: str = Field(min_length=1,max_length=10000)
    attributes: dict = Field(default_factory=dict)

class Metric(Strict):
    project: str = Field(default="default",min_length=1,max_length=100)
    name: str = Field(min_length=1,max_length=100)
    value: float
    unit: str = Field(default="",max_length=30)
    attributes: dict = Field(default_factory=dict)

class Baseline(Strict):
    project: str = Field(default="default",min_length=1,max_length=100)
    name: str = Field(min_length=1,max_length=100)
    kind: Literal["vector","agent"]
    embedding_space: str = Field(default="",max_length=200)
    vectors: list[list[float]] = Field(default_factory=list,max_length=500)
    tool_sequences: list[list[str]] = Field(default_factory=list,max_length=500)
    @model_validator(mode="after")
    def check(self):
        if self.kind == "vector":
            if not self.embedding_space or len(self.vectors)<2: raise ValueError("embedding_space and >=2 vectors required")
            dims={len(v) for v in self.vectors}
            if len(dims)!=1 or not 1<=next(iter(dims))<=4096: raise ValueError("invalid dimensions")
            if any(not all(math.isfinite(x) and abs(x)<=1e10 for x in v) or not any(x!=0 for x in v) for v in self.vectors): raise ValueError("vectors must be finite, bounded to 1e10 and nonzero")
        else:
            if len(self.tool_sequences)<2: raise ValueError(">=2 tool sequences required")
            if any(len(s)>100 or any(len(t)>200 or t in ("<START>","<END>") for t in s) for s in self.tool_sequences): raise ValueError("sequence too long")
        return self

class Drift(Baseline):
    baseline_id: int = Field(gt=0)
    threshold: float = Field(default=0.2,ge=0,le=1)

class JudgeResult(Strict):
    groundedness: float = Field(ge=0,le=1)
    relevance: float = Field(ge=0,le=1)
    reasoning: str = Field(min_length=1,max_length=4000)
    unsupported_claims: list[str] = Field(default_factory=list,max_length=50)
