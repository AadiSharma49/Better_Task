from __future__ import annotations

from flask import Blueprint, jsonify, request
from pydantic import ValidationError
from werkzeug.exceptions import HTTPException

from .schemas import DashboardSummarySchema, TaskResponseSchema
from .services import build_dashboard, create_task, delete_task, get_task_or_404, list_tasks, update_task

api = Blueprint("api", __name__)


@api.errorhandler(ValidationError)
def handle_validation_error(error: ValidationError):
    return (
        jsonify(
            {
                "error": "validation_error",
                "message": "Request validation failed.",
                "details": error.errors(),
            }
        ),
        400,
    )


@api.errorhandler(HTTPException)
def handle_http_error(error: HTTPException):
    return (
        jsonify(
            {
                "error": error.name.lower().replace(" ", "_"),
                "message": error.description,
            }
        ),
        error.code,
    )


@api.get("/tasks")
def get_tasks():
    tasks = list_tasks(
        status=request.args.get("status"),
        priority=request.args.get("priority"),
    )
    return jsonify([TaskResponseSchema.model_validate(task).model_dump(mode="json") for task in tasks])


@api.post("/tasks")
def post_task():
    task = create_task(request.get_json(silent=True) or {})
    return jsonify(TaskResponseSchema.model_validate(task).model_dump(mode="json")), 201


@api.get("/tasks/<int:task_id>")
def get_task(task_id: int):
    task = get_task_or_404(task_id)
    return jsonify(TaskResponseSchema.model_validate(task).model_dump(mode="json"))


@api.patch("/tasks/<int:task_id>")
def patch_task(task_id: int):
    task = get_task_or_404(task_id)
    updated = update_task(task, request.get_json(silent=True) or {})
    return jsonify(TaskResponseSchema.model_validate(updated).model_dump(mode="json"))


@api.delete("/tasks/<int:task_id>")
def remove_task(task_id: int):
    task = get_task_or_404(task_id)
    delete_task(task)
    return "", 204


@api.get("/dashboard")
def get_dashboard():
    summary = DashboardSummarySchema.model_validate(build_dashboard())
    return jsonify(summary.model_dump())
