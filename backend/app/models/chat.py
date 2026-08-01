from datetime import datetime, timezone
from app.extensions import db


class Chat(db.Model):
    __tablename__ = "chats"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(128), nullable=True)
    type = db.Column(db.Enum("personal", "group", "channel", name="chat_type"), nullable=False, default="personal")
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    members = db.relationship("ChatMember", back_populates="chat", lazy="dynamic", cascade="all, delete-orphan")
    messages = db.relationship("Message", back_populates="chat", lazy="dynamic", cascade="all, delete-orphan")
    tasks = db.relationship("Task", back_populates="chat", lazy="dynamic")

    def to_dict(self, include_members=False, current_user_id=None):
        data = {
            "id": self.id,
            "name": self.name,
            "type": self.type,
            "created_at": self.created_at.isoformat(),
        }
        if include_members:
            data["members"] = [m.to_dict() for m in self.members]

        # For personal chats, expose the other participant's name as the chat name
        if self.type == "personal" and current_user_id is not None and self.name is None:
            other = (
                ChatMember.query.filter(
                    ChatMember.chat_id == self.id,
                    ChatMember.user_id != current_user_id,
                ).first()
            )
            if other and other.user:
                data["name"] = other.user.username

        return data


class ChatMember(db.Model):
    __tablename__ = "chat_members"

    id = db.Column(db.Integer, primary_key=True)
    chat_id = db.Column(db.Integer, db.ForeignKey("chats.id", ondelete="CASCADE"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role = db.Column(db.Enum("owner", "admin", "member", name="member_role"), nullable=False, default="member")
    joined_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    __table_args__ = (db.UniqueConstraint("chat_id", "user_id", name="uq_chat_member"),)

    # Relationships
    chat = db.relationship("Chat", back_populates="members")
    user = db.relationship("User", back_populates="chat_memberships")

    def to_dict(self):
        return {
            "id": self.id,
            "chat_id": self.chat_id,
            "user_id": self.user_id,
            "username": self.user.username if self.user else None,
            "avatar": self.user.avatar if self.user else None,
            "role": self.role,
            "joined_at": self.joined_at.isoformat(),
        }
