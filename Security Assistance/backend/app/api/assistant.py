"""
TrustGrid AI — Security Assistant API
======================================
POST /assistant/chat  — Primary endpoint (new, schema-compatible with frontend)

All intelligence is LOCAL — no external AI APIs are used.
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from app.services.security_assistant import process_security_question
from app.database.mongodb import chat_collection

router = APIRouter(prefix="/assistant", tags=["AI Security Assistant"])


class AssistantRequest(BaseModel):
    message: str
    target_host: Optional[str] = None


class AssistantResponse(BaseModel):
    answer: str
    sources: List[str]
    related_assets: List[dict]
    related_vulnerabilities: List[dict]
    recommended_actions: List[str]
    intent: Optional[str] = None
    timestamp: str


@router.post("/chat", response_model=AssistantResponse)
def assistant_chat(request: AssistantRequest):
    """
    Context-aware AI Security Assistant.

    Processes a natural-language security question using live MongoDB telemetry.
    Supports intents: RISK_EXPLANATION, PRIORITY_ANALYSIS, ASSET_ANALYSIS,
    VULNERABILITY_ANALYSIS, CVE_EXPLANATION, REMEDIATION, SECURITY_POSTURE, SCAN_SUMMARY.

    No external LLM or AI API is used — all intelligence is local.
    """
    message = request.message.strip()
    if not message:
        return AssistantResponse(
            answer="Please provide a question.",
            sources=[],
            related_assets=[],
            related_vulnerabilities=[],
            recommended_actions=[],
            timestamp=datetime.utcnow().isoformat(),
        )

    result = process_security_question(message)

    ts = datetime.utcnow().isoformat()

    # Persist to chat history (best-effort, non-blocking)
    try:
        chat_collection.insert_one({
            "user": "assistant_api",
            "prompt": message,
            "response": result.get("answer", ""),
            "intent": result.get("intent", "UNKNOWN"),
            "timestamp": ts,
            "api_version": "v2_assistant",
        })
    except Exception:
        pass

    return AssistantResponse(
        answer=result.get("answer", ""),
        sources=result.get("sources", []),
        related_assets=result.get("related_assets", []),
        related_vulnerabilities=result.get("related_vulnerabilities", []),
        recommended_actions=result.get("recommended_actions", []),
        intent=result.get("intent"),
        timestamp=ts,
    )
