import os
from langfuse import Langfuse
from langfuse.decorators import observe, langfuse_context
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate

_langfuse = Langfuse(
    public_key=os.getenv("LANGFUSE_PUBLIC_KEY"),
    secret_key=os.getenv("LANGFUSE_SECRET_KEY"),
    host=os.getenv("LANGFUSE_HOST", "https://cloud.langfuse.com"),
)

llm = ChatOpenAI(model=os.getenv("OPENAI_MODEL", "gpt-4o"))


@observe()
def traced_llm_call(message: str, user_id: str, prompt_version: str) -> str:
    """Every call here is automatically traced in Langfuse with metadata."""
    langfuse_context.update_current_trace(
        user_id=user_id,
        metadata={"prompt_version": prompt_version},
    )

    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a helpful AI assistant. Be concise."),
        ("user", "{message}"),
    ])
    chain = prompt | llm
    response = chain.invoke({"message": message})
    return response.content
