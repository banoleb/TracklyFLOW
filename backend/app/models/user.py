from datetime import datetime, timezone
from werkzeug.security import generate_password_hash, check_password_hash
from app.extensions import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(256), nullable=False)
    avatar = db.Column(db.String(512), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    chat_memberships = db.relationship("ChatMember", back_populates="user", lazy="dynamic")
    messages = db.relationship("Message", back_populates="author", lazy="dynamic")
    assigned_tasks = db.relationship(
        "Task", foreign_keys="Task.assigned_to", back_populates="assignee", lazy="dynamic"
    )
    created_tasks = db.relationship(
        "Task", foreign_keys="Task.created_by", back_populates="creator", lazy="dynamic"
    )

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self, include_email=False):
        data = {
            "id": self.id,
            "username": self.username,
            "avatar": self.avatar,
            "created_at": self.created_at.isoformat(),
        }
        if include_email:
            data["email"] = self.email
        return data
