from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Tuple


def build_llm_prompt(
    system_prompt: str,
    user_context: Dict[str, Any],
    conversation: List[Dict[str, str]],
    user_message: str,
    language: str,
    retrieved_context: List[Dict[str, str]] | None = None,
) -> str:
    history = "\n".join([f"{item['role']}: {item['content']}" for item in conversation])
    context_lines = "\n".join([f"- {key}: {value}" for key, value in user_context.items()])
    rag_lines = ""
    if retrieved_context:
        rag_lines = "\n\nRetrieved Context:\n" + "\n".join(
            [
                f"[{item.get('source', 'unknown')} | {item.get('reference', 'n/a')}]\n{item.get('content', '')}"
                for item in retrieved_context
            ]
        )
    return (
        f"System: {system_prompt}\n\n"
        f"Language: {language}\n"
        f"User Context:\n{context_lines}\n\n"
        f"Conversation History:\n{history}\n\n"
        f"{rag_lines}\n\n"
        f"User Query: {user_message}\n\n"
        "Response:\n"
        "- Cite retrieved references when factual claims are made.\n"
        "- If the context is insufficient, explicitly mention uncertainty.\n"
        "- Include a final line in this format when references are used: Sources: <comma separated source names>"
    )


class BaseLLMService(ABC):
    @abstractmethod
    def describe_runtime(self) -> Dict[str, Any]:
        raise NotImplementedError

    @abstractmethod
    def generate_reply(
        self,
        system_prompt: str,
        user_context: Dict[str, Any],
        conversation: List[Dict[str, str]],
        user_message: str,
        language: str,
        retrieved_context: List[Dict[str, str]] | None = None,
    ) -> Tuple[str, str, bool]:
        raise NotImplementedError

    @abstractmethod
    def health_check(self, test_fallback: bool = False) -> Dict[str, Any]:
        raise NotImplementedError
