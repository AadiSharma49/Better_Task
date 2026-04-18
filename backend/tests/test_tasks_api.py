from datetime import date, timedelta


def test_create_and_list_task(client):
    create_response = client.post(
        "/api/tasks",
        json={
            "title": "Prepare assessment walkthrough",
            "description": "Record a concise architecture overview.",
            "priority": "high",
            "owner": "Harsh",
        },
    )

    assert create_response.status_code == 201
    body = create_response.get_json()
    assert body["status"] == "backlog"

    list_response = client.get("/api/tasks")
    assert list_response.status_code == 200
    assert len(list_response.get_json()) == 1


def test_rejects_invalid_title(client):
    response = client.post("/api/tasks", json={"title": "No"})

    assert response.status_code == 400
    assert response.get_json()["error"] == "validation_error"


def test_rejects_invalid_status_transition(client):
    create_response = client.post(
        "/api/tasks",
        json={"title": "Ship demo", "status": "done", "owner": "Sam"},
    )
    task_id = create_response.get_json()["id"]

    response = client.patch(f"/api/tasks/{task_id}", json={"status": "in_progress"})

    assert response.status_code == 409
    assert "cannot move" in response.get_json()["message"]


def test_dashboard_counts_overdue_tasks(client):
    yesterday = (date.today() - timedelta(days=1)).isoformat()
    client.post(
        "/api/tasks",
        json={
            "title": "Fix blocked issue",
            "status": "blocked",
            "due_date": yesterday,
            "owner": "Mia",
        },
    )

    response = client.get("/api/dashboard")

    assert response.status_code == 200
    body = response.get_json()
    assert body["total_tasks"] == 1
    assert body["overdue_tasks"] == 1
    assert body["blocked_tasks"] == 1
