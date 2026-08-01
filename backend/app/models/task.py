from datetime import datetime, timezone
from app.extensions import db


class Task(db.Model):
    __tablename__ = "tasks"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(256), nullable=False)
    description = db.Column(db.Text, nullable=True)
    status = db.Column(
        db.Enum("todo", "in_progress", "review", "done", name="task_status"),
        nullable=False,
        default="todo",
    )
    assigned_to = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_by = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    chat_id = db.Column(db.Integer, db.ForeignKey("chats.id", ondelete="SET NULL"), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    assignee = db.relationship("User", foreign_keys=[assigned_to], back_populates="assigned_tasks")
    creator = db.relationship("User", foreign_keys=[created_by], back_populates="created_tasks")
    chat = db.relationship("Chat", back_populates="tasks")

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "status": self.status,
            "assigned_to": self.assigned_to,
            "assignee": self.assignee.to_dict() if self.assignee else None,
            "created_by": self.created_by,
            "creator": self.creator.to_dict() if self.creator else None,
            "chat_id": self.chat_id,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }
