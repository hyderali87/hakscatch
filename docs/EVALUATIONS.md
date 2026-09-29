# Evaluation contracts and limitations

## Evidence grounding / hallucination screening

`lexical_overlap_v1`: lowercase ASCII word tokens, remove a small stopword list, then calculate the fraction of unique answer tokens that also occur in supplied contexts. Groundedness 1 means all remaining answer tokens appeared in evidence. `unsupported_token_ratio = 1 - groundedness`. Missing evidence or empty useful answer produces `insufficient_data`.

This is a cheap screening signal, **not a hallucination probability**. Paraphrases may score poorly; contradictions can score highly. Non-English tokenization is not supported by this lexical method. It cannot prove truth, assess source quality or validate world knowledge. Use the local judge and human-labeled calibration data for semantic evaluation.

## LLM-as-a-judge

`ollama_judge_v1` evaluates supplied question, answer and contexts against a fixed rubric. Groundedness and relevance are bounded 0–1 scores. It reports unsupported claims and a brief rationale. The model, method and rubric version are persisted. Temperature is zero but model execution is not guaranteed deterministic.

Retrieved content is labeled untrusted in the judge prompt. This reduces but does not eliminate prompt-injection susceptibility. The judge has no tools and cannot act on its input. Never treat the result as a sole authorization or safety decision. Evaluate agreement with human judgments using representative labeled cases before choosing operational thresholds.

## Vector drift

`normalized_centroid_shift_v1`: normalize each nonzero embedding to unit length, calculate each window's mean vector, then `score = ||mean(reference) - mean(current)||₂ / 2`. Range 0–1; higher means a greater mean-direction shift. Alert when score is strictly greater than the configured threshold.

The embedding-space identifier must include model/version/preprocessing; vectors must have matching dimensions. Baselines and current windows need >=2 samples, but representative windows generally need many more. Same-centroid distribution changes can go undetected. This is not a statistical significance test, semantic correctness test, or automatic embedding-model migration detector. Comparing different models is rejected when identifiers differ.

## Agent drift

`tool_transition_jsd_v1`: count adjacent tool transitions including START/END sentinels, normalize counts, and compute Jensen–Shannon divergence using base-2 logs. Range 0–1. Alert on strictly greater than threshold. New transitions are included in the result.

Tool names should not use reserved `<START>`/`<END>` names. This detects changed tool sequencing, not changes to internal reasoning or goals. A good new workflow can trigger it. Changes to prompts, traffic mix and tool naming can all create drift; compare compatible cohorts. Different full paths can share transition statistics.

## Calibrate before acting

Use a clean baseline from a known release; compare matched traffic windows; review false alarms with human labels; choose a threshold for your task. Keep model versions and baseline names stable. The default 0.2 drift threshold is illustrative, not validated for your business. No automatic rollback or external notifications are performed.
