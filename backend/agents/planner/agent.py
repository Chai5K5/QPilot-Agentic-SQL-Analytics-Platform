import os
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from api.schemas import ExecutionPlan

load_dotenv()

llm = ChatGroq(
    model="openai/gpt-oss-20b",
    api_key=os.getenv("GROQ_API_KEY"),
    temperature=0
)

structured_llm = llm.with_structured_output(
    ExecutionPlan,
    method="json_schema"
)

def plan_user_request(question: str) -> ExecutionPlan:
    """
    Uses LLM to create a structured execution plan
    for the user's natural-language request.
    """

    prompt = f"""
You are the Planner Agent for QPilot, an Agentic SQL Analytics Platform.

Your job is to analyze the user's request and create an execution plan
for the downstream agents.

Do NOT write SQL.
Do NOT answer the user's question.
Only decide what needs to be done.

Classify the request into an appropriate task.

Your response MUST contain:
- task: the type of operation required
- question: the original user request
- steps: clear, ordered steps for downstream agents

Do not omit any of these fields.

User request:
{question}
"""

    return structured_llm.invoke(prompt)