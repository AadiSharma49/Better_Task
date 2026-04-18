from __future__ import annotations

from datetime import date, datetime, timezone
from enum import StrEnum

from .db import db


class TaskStatus(StrEnum):
    BACKLOG = "backlog"
    IN_PROGRESS = "in_progress"
    BLOCKED = "blocked"
    DONE = "done"


class TaskPriority(StrEnum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class Task(db.Model):
    __tablename__ = "tasks"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text, nullable=False, default="")
    status = db.Column(db.String(20), nullable=False, default=TaskStatus.BACKLOG.value)
    priority = db.Column(db.String(20), nullable=False, default=TaskPriority.MEDIUM.value)
    owner = db.Column(db.String(80), nullable=False, default="Unassigned")
    due_date = db.Column(db.Date, nullable=True)
    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    def mark_updated(self) -> None:
        self.updated_at = datetime.now(timezone.utc)

    def can_transition_to(self, new_status: TaskStatus) -> bool:
        current_status = TaskStatus(self.status)

        allowed_transitions = {
            TaskStatus.BACKLOG: {TaskStatus.IN_PROGRESS, TaskStatus.BLOCKED, TaskStatus.DONE},
            TaskStatus.IN_PROGRESS: {TaskStatus.BLOCKED, TaskStatus.DONE},
            TaskStatus.BLOCKED: {TaskStatus.IN_PROGRESS, TaskStatus.DONE},
            TaskStatus.DONE: set(),
        }

        return new_status == current_status or new_status in allowed_transitions[current_status]

    def set_due_date(self, due_date: date | None) -> None:
        self.due_date = due_date
