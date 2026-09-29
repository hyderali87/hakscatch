# Local LLM-as-a-judge

Ollama is optional. No paid model API is required. Running a model still needs sufficient RAM/CPU (and optionally GPU), disk space and a model download. The supplied Compose profile runs CPU inference; it does not configure GPU passthrough.

One small starting model is `qwen2.5:1.5b` (Apache-2.0 model family release). Small models can give poor evaluations: use this to test the integration and compare it with human labels before relying on its scores. Verify the model card/license for the exact artifact you deploy.

```bash
docker compose --profile judge up -d ollama
docker compose exec ollama ollama pull qwen2.5:1.5b
```

Set `OLLAMA_MODEL=qwen2.5:1.5b` in `.env`, then:

```bash
docker compose --profile judge up -d --force-recreate api
```

Open a trace that contains a response and evidence contexts. Click **Run LLM judge**. A missing model/configuration returns an explicit error. Nothing is scored until the model returns valid structured JSON.

The API sends `/api/chat` with a JSON schema in `format`, `stream:false` and temperature 0, and validates the returned JSON again with Pydantic. The model must support Ollama's structured output behavior. Model-service failures, malformed scores or timeouts return 502. The model response is not executed.

For native development set `OLLAMA_URL=http://127.0.0.1:11434` and `OLLAMA_MODEL` before starting the backend. The container setup instead uses the private service name `http://ollama:11434`. Do not expose Ollama directly to the public internet.

References:
- https://docs.ollama.com/api/chat
- https://docs.ollama.com/capabilities/structured-outputs
- https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct
