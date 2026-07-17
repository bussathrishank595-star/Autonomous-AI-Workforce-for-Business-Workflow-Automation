# API Documentation

This document lists the core REST API endpoints implemented in AgentOS.

## Endpoints

### 1. Execute Workflow Pipeline
*   **URL**: `/api/execute`
*   **Method**: `POST`
*   **Auth Required**: Yes (Session Cookie)
*   **Request Body**:
    ```json
    {
      "prompt": "Find frontend React developers and schedule interviews."
    }
    ```
*   **Response**:
    ```json
    {
      "success": true,
      "missionId": "uuid-workflow-id"
    }
    ```

### 2. File Ingestion Upload
*   **URL**: `/api/upload`
*   **Method**: `POST`
*   **Auth Required**: Yes
*   **Request Body**: `FormData` containing file attachments.
*   **Response**:
    ```json
    {
      "success": true,
      "files": [
        { "id": "uuid-resume-id", "filename": "cv.pdf", "skipped": false }
      ]
    }
    ```

### 3. Approve Staging Outbox Actions
*   **URL**: `/api/approve`
*   **Method**: `POST`
*   **Auth Required**: Yes
*   **Request Body**:
    ```json
    {
      "missionId": "uuid-workflow-id",
      "actionIds": ["uuid-action-1", "uuid-action-2"]
    }
    ```
*   **Response**:
    ```json
    {
      "success": true,
      "results": [
        { "id": "uuid-action-1", "type": "EMAIL", "success": true }
      ]
    }
    ```
