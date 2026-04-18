from __future__ import annotations

from datetime import date

from flask import abort

from .db import db
from .models import Task, TaskStatus
from .schemas import TaskCreateSchema, TaskUpdateSchema


def list_tasks(status: str | None = None, priority: str | None = None) -> list[Task]:
    query = Task.query.order_by(Task.updated_at.desc(), Task.created_at.desc())

    if status:
        query = query.filter_by(status=status)

    if priority:
        query = query.filter_by(priority=priority)

    return list(query.all())


def get_task_or_404(task_id: int) -> Task:
    task = db.session.get(Task, task_id)
    if task is None:
        abort(404)
    return task


def create_task(payload: dict) -> Task:
    data = TaskCreateSchema.model_validate(payload)
    task = Task(**data.model_dump())
    db.session.add(task)
    db.session.commit()
    return task


def update_task(task: Task, payload: dict) -> Task:
    updates = TaskUpdateSchema.model_validate(payload).model_dump(exclude_unset=True)

    new_status = updates.get("status")
    if new_status and not task.can_transition_to(TaskStatus(new_status)):
        abort(
            409,
            description=f"Task cannot move from '{task.status}' to '{new_status}'.",
        )

    for field, value in updates.items():
        setattr(task, field, value)

    task.mark_updated()
    db.session.commit()
    return task


def delete_task(task: Task) -> None:
    db.session.delete(task)
    db.session.commit()


def build_dashboard() -> dict[str, int]:
    tasks = Task.query.all()
    today = date.today()

    return {
        "total_tasks": len(tasks),
        "overdue_tasks": len(
            [
                task
                for task in tasks
                if task.due_date and task.due_date < today and task.status != TaskStatus.DONE.value
            ]
        ),
        "done_tasks": len([task for task in tasks if task.status == TaskStatus.DONE.value]),
        "in_progress_tasks": len(
            [task for task in tasks if task.status == TaskStatus.IN_PROGRESS.value]
        ),
        "blocked_tasks": len([task for task in tasks if task.status == TaskStatus.BLOCKED.value]),
    }
