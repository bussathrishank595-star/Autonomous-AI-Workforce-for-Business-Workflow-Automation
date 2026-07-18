# Workflow Orchestration Engine

This document details the scheduling model of AgentOS.

## Pipeline Lifecycle
1. **Planning**: The user prompt is parsed by `MissionPlannerAgent` to choose execution steps and tasks.
2. **Tasks Execution**:
   - The server processes each planned task sequentially.
   - Status transitions: `PENDING` ➔ `RUNNING` ➔ `COMPLETED`/`FAILED`.
3. **Staging / HITL Approval**: Email and calendar actions are staged as pending items. They are executed only when the user triggers the `/api/approve` endpoint.
4. **Completion**: Once all approvals are executed, the final status becomes `COMPLETED`.
