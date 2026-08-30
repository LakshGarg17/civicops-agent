"""
Tests for MonitoringAgent and DemoStatusProvider.
Verifies autonomous case monitoring, change detection, generative reasoning, and follow-up task creation.
"""

import pytest
from backend.agents.monitoring_agent import MonitoringAgent
from backend.tools.demo_status_provider import DemoStatusProvider
from backend.services.case_service import CaseService
from backend.services.firestore_service import FirestoreService
from backend.models.notice import NoticeStructuredData
from backend.models.research import ProcedureResearchData
from backend.models.workflow import WorkflowCase, WorkflowTask

@pytest.fixture
def isolated_env():
    """Provides isolated status provider, firestore service, monitoring agent, and case service."""
    status_provider = DemoStatusProvider()
    firestore_svc = FirestoreService()
    for col in firestore_svc._fallback_store:
        firestore_svc._fallback_store[col] = {}

    agent = MonitoringAgent(status_provider=status_provider)
    case_svc = CaseService(
        monitoring_agent_inst=agent,
        firestore_svc=firestore_svc
    )
    return {
        "status_provider": status_provider,
        "firestore_svc": firestore_svc,
        "agent": agent,
        "case_svc": case_svc
    }

def test_monitoring_agent_unchanged_status(isolated_env):
    """Verifies that MonitoringAgent correctly identifies an unchanged case status."""
    agent = isolated_env["agent"]
    status_provider = isolated_env["status_provider"]
    case_id = "CIV-MON-001"

    status_provider.set_status(case_id, "under_review", "Case is actively under review.")

    case_data = {
        "case_id": case_id,
        "status": "under_review",
        "notice": {"notice_type": "Property Tax Notice"},
        "research": {"authority": "Tax Board"}
    }

    result = agent.monitor_case(case_id, case_data)
    assert result["change_detected"] is False
    assert result["current_status"] == "under_review"

def test_monitoring_agent_detects_change_and_reasons(isolated_env):
    """Verifies that MonitoringAgent detects status change and reasons about severity and follow-up task."""
    agent = isolated_env["agent"]
    status_provider = isolated_env["status_provider"]
    case_id = "CIV-MON-002"

    # Set agency status to additional_information_required
    status_provider.set_status(
        case_id=case_id,
        status="additional_information_required",
        message="Additional ownership documentation is required."
    )

    case_data = {
        "case_id": case_id,
        "status": "under_review",
        "notice": {"notice_type": "Property Tax Notice"},
        "research": {"authority": "Travis County Appraisal District"}
    }

    result = agent.monitor_case(case_id, case_data)
    assert result["change_detected"] is True
    assert result["previous_status"] == "under_review"
    assert result["current_status"] == "additional_information_required"
    assert result["severity"] in ("high", "medium")
    assert result["requires_user"] is True
    assert "ownership" in result["next_action"].lower() or "upload" in result["next_action"].lower()

    # Check generated new task
    assert "new_task" in result and result["new_task"] is not None
    new_task = result["new_task"]
    assert "title" in new_task
    assert "description" in new_task
    assert len(new_task.get("required_documents", [])) > 0

def test_case_service_runs_monitoring_cycle_and_mutates_workflow(isolated_env):
    """Verifies that CaseService.run_monitoring_cycle updates the case, workflow, timeline, and notifications."""
    case_svc = isolated_env["case_svc"]
    status_provider = isolated_env["status_provider"]
    case_id = "CIV-MON-003"

    # Setup initial case in Firestore
    notice = NoticeStructuredData(
        notice_type="Property Tax Assessment Notice",
        issuing_authority="County Appraisal District",
        department="Property Valuation",
        reference_number="APN-12345",
        citizen_name="John Citizen",
        property_id="APN-12345",
        amount="$3,200.00",
        issue="Valuation dispute",
        deadline="2026-10-31",
        required_action="Submit dispute application",
        mentioned_documents=["Notice", "Deed"]
    )
    research = ProcedureResearchData(
        procedure_name="Valuation Protest",
        authority="Appraisal Review Board",
        submission_method="Electronic Gateway",
        required_documents=["Notice", "Recorded Deed"],
        steps=["File Form", "Review Determination"],
        deadline_information="October 31",
        fees="$0.00",
        additional_requirements=[],
        source_information=["Property Tax Code"]
    )
    workflow = WorkflowCase(
        case_id=case_id,
        goal="Submit Valuation Protest",
        priority="high",
        deadline="2026-10-31",
        tasks=[
            WorkflowTask(
                id="t1",
                title="Prepare Application",
                description="Draft formal petition",
                category="procedural",
                status="completed",
                requires_user=False
            )
        ],
        missing_documents=[],
        matched_documents=[]
    )

    created_case = case_svc.create_case(notice, research, workflow)
    assert created_case.status == "draft"

    # Simulate submission
    case_svc.approve_action(case_id, "submit_application", "Citizen John", "Authorized")
    case_svc.prepare_application(case_id, "John Citizen", "Please correct valuation")
    case_svc.submit_case(case_id)

    # Flip demo provider status to additional_information_required
    status_provider.set_status(case_id, "additional_information_required", "Provide title certificate.")

    # Run monitoring cycle
    cycle_res = case_svc.run_monitoring_cycle(case_id)
    updated_case = cycle_res["case"]

    assert updated_case.status == "additional_information_required"
    # Verify new task was injected into workflow
    assert len(updated_case.workflow.tasks) > 1
    new_task_titles = [t.title.lower() for t in updated_case.workflow.tasks]
    assert any("ownership" in t or "upload" in t for t in new_task_titles)

    # Verify in-app citizen notification is active
    assert updated_case.unread_notification is not None
    assert updated_case.unread_notification.unread is True

    # Acknowledge notification
    acked_case = case_svc.acknowledge_notification(case_id)
    assert acked_case.unread_notification.unread is False
