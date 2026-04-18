from __future__ import annotations

from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from .models import TaskPriority, TaskStatus


class TaskBaseSchema(BaseModel):
    title: str = Field(min_length=3, max_length=120)
    description: str = Field(default="", max_length=1000)
    status: Literal["backlog", "in_progress", "blocked", "done"] = TaskStatus.BACKLOG.value
    priority: Literal["low", "medium", "high", "urgent"] = TaskPriority.MEDIUM.value
    owner: str = Field(default="Unassigned", min_length=2, max_length=80)
    due_date: date | None = None

    @field_validator("title", "owner", mode="before")
    @classmethod
    def strip_text(cls, value: str) -> str:
        if isinstance(value, str):
            return value.strip()
        return value

    @field_validator("description", mode="before")
    @classmethod
    def normalize_description(cls, value: str) -> str:
        if value is None:
            return ""
        if isinstance(value, str):
            return value.strip()
        return value

    @model_validator(mode="after")
    def validate_due_date(self) -> "TaskBaseSchema":
        if self.status != TaskStatus.DONE.value and self.due_date and self.due_date.year < 2000:
            raise ValueError("Due date must be realistic.")
        return self


class TaskCreateSchema(TaskBaseSchema):
    pass


class TaskUpdateSchema(BaseModel):
    title: str | None = Field(default=None, min_length=3, max_length=120)
    description: str | None = Field(default=None, max_length=1000)
    status: Literal["backlog", "in_progress", "blocked", "done"] | None = None
    priority: Literal["low", "medium", "high", "urgent"] | None = None
    owner: str | None = Field(default=None, min_length=2, max_length=80)
    due_date: date | None = None

    @field_validator("title", "owner", mode="before")
    @classmethod
    def strip_optional_text(cls, value: str | None) -> str | None:
        if isinstance(value, str):
            return value.strip()
        return value

    @field_validator("description", mode="before")
    @classmethod
    def strip_optional_description(cls, value: str | None) -> str | None:
        if isinstance(value, str):
            return value.strip()
        return value


class TaskResponseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str
    status: str
    priority: str
    owner: str
    due_date: date | None
    created_at: datetime
    updated_at: datetime


class DashboardSummarySchema(BaseModel):
    total_tasks: int
    overdue_tasks: int
    done_tasks: int
    in_progress_tasks: int
    blocked_tasks: int
