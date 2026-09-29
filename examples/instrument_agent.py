import time
from hakscatch import Client
hc=Client.from_env(project="my-agent",capture_content=True)
with hc.trace("refund-assistant",model="your-model") as run:
    run.prompt="How long do I have to request a refund?"
    with run.span("orchestrator","agent") as parent:
        with run.span("knowledge-search","retriever",parent):
            run.contexts=["Customers may request a refund within 30 days of purchase."]
            run.tools.append('search')
        with run.span("generate-answer","llm",parent):
            run.response="You can request a refund within 30 days of purchase."
            run.tools.append('answer')
            # Replace this stub with your actual model call.
            time.sleep(.02)
hc.log("INFO","Agent request complete",trace_id=run.id)
hc.metric("retrieval.documents",len(run.contexts),unit="count")
print("Sent telemetry. Select project my-agent in the dashboard.")
