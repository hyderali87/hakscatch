"""Transparent diagnostics, not certified truth or statistical hypothesis tests."""
import re
from collections import Counter
import numpy as np

STOP = set("a an the is are was were to in on of and or for it this that with be as by from".split())
def tokens(text): return set(re.findall(r"[a-z0-9]+",text.lower()))-STOP

def grounding(response, contexts):
    evidence=tokens(" ".join(contexts)); answer=tokens(response)
    if not answer or not evidence:
        return {"status":"insufficient_data","method":"lexical_overlap_v1","reason":"Nonempty answer and evidence are required"}
    score=len(answer & evidence)/len(answer)
    return {"status":"completed","method":"lexical_overlap_v1","groundedness":round(score,4),
            "unsupported_token_ratio":round(1-score,4),"unmatched_tokens":sorted(answer-evidence)[:60],
            "note":"Lexical support proxy; cannot detect contradictions or establish factual truth."}

def vector_drift(reference,current,threshold):
    a=np.asarray(reference,dtype=float); b=np.asarray(current,dtype=float)
    if a.shape[1]!=b.shape[1]: raise ValueError("Embedding dimensions differ")
    a=a/np.linalg.norm(a,axis=1,keepdims=True); b=b/np.linalg.norm(b,axis=1,keepdims=True)
    # Mean shift of unit vectors has a bounded [0,1] magnitude.
    score=float(np.linalg.norm(a.mean(axis=0)-b.mean(axis=0))/2)
    return {"status":"completed","method":"normalized_centroid_shift_v1","score":round(score,6),
            "threshold":threshold,"alert":score>threshold,"baseline_samples":len(a),"current_samples":len(b),
            "note":"Directional mean shift only; equal centroids can hide distribution changes. Not a p-value."}

def agent_drift(reference,current,threshold):
    def counts(sequences):
        c=Counter()
        for seq in sequences:
            path=["<START>"]+seq+["<END>"]
            c.update(zip(path,path[1:]))
        return c
    a=counts(reference);b=counts(current);keys=sorted(a.keys()|b.keys())
    p=np.array([a[k]/sum(a.values()) for k in keys]);q=np.array([b[k]/sum(b.values()) for k in keys]);m=(p+q)/2
    def kl(x):
        mask=x>0
        return float(np.sum(x[mask]*np.log2(x[mask]/m[mask])))
    score=(kl(p)+kl(q))/2
    return {"status":"completed","method":"tool_transition_jsd_v1","score":round(score,6),
            "threshold":threshold,"alert":score>threshold,"baseline_samples":len(reference),"current_samples":len(current),
            "new_transitions":[list(k) for k in keys if k not in a],
            "note":"Behavioral transition divergence [0,1]; a change is not necessarily a regression."}
