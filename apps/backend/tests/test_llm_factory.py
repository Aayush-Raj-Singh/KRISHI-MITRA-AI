from __future__ import annotations

from app.services import llm_factory


def test_llm_factory_returns_bedrock(monkeypatch):
    class DummyBedrock:
        def describe_runtime(self):
            return {"provider": "bedrock", "implementation": "DummyBedrock"}

    monkeypatch.setattr(llm_factory, "BedrockService", DummyBedrock)

    service = llm_factory.get_llm_service()

    assert isinstance(service, DummyBedrock)


def test_llm_factory_runtime_profile_uses_active_service(monkeypatch):
    class DummyBedrock:
        def describe_runtime(self):
            return {
                "provider": "bedrock",
                "implementation": "DummyBedrock",
                "model_id": "anthropic.claude-3-sonnet-20240229-v1:0",
            }

    monkeypatch.setattr(llm_factory, "BedrockService", DummyBedrock)

    profile = llm_factory.get_llm_runtime_profile()

    assert profile["provider"] == "bedrock"
    assert profile["implementation"] == "DummyBedrock"
