from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db, socketio
from app.models.message import Message
from app.models.chat import ChatMember
from app.utils.response import success, error

messages_bp = Blueprint("messages", __name__)


def _is_member(chat_id, user_id):
    return ChatMember.query.filter_by(chat_id=chat_id, user_id=user_id).first() is not None


@messages_bp.route("/chats/<int:chat_id>/messages", methods=["GET"])
@jwt_required()
def list_messages(chat_id):
    user_id = int(get_jwt_identity())
    if not _is_member(chat_id, user_id):
        return error("Access denied", 403)

    page = request.args.get("page", 1, type=int)
    per_page = min(request.args.get("per_page", 50, type=int), 100)

    paginated = (
        Message.query.filter_by(chat_id=chat_id)
        .order_by(Message.created_at.desc())
        .paginate(page=page, per_page=per_page, error_out=False)
    )

    messages = list(reversed([m.to_dict() for m in paginated.items]))
    return success(
        {
            "messages": messages,
            "total": paginated.total,
            "pages": paginated.pages,
            "page": paginated.page,
        }
    )


@messages_bp.route("/chats/<int:chat_id>/messages", methods=["POST"])
@jwt_required()
def send_message(chat_id):
    user_id = int(get_jwt_identity())
    if not _is_member(chat_id, user_id):
        return error("Access denied", 403)

    data = request.get_json(silent=True) or {}
    content = (data.get("content") or "").strip()
    if not content:
        return error("Message content cannot be empty", 422)

    msg = Message(chat_id=chat_id, user_id=user_id, content=content)
    db.session.add(msg)
    db.session.commit()

    msg_data = msg.to_dict()

    # Emit real-time event to the chat room
    socketio.emit("new_message", msg_data, room=f"chat_{chat_id}")

    return success(msg_data, status_code=201)


@messages_bp.route("/messages/<int:message_id>", methods=["PATCH"])
@jwt_required()
def edit_message(message_id):
    user_id = int(get_jwt_identity())
    msg = db.session.get(Message, message_id)
    if not msg:
        return error("Message not found", 404)
    if msg.user_id != user_id:
        return error("Cannot edit another user's message", 403)

    data = request.get_json(silent=True) or {}
    content = (data.get("content") or "").strip()
    if not content:
        return error("Message content cannot be empty", 422)

    msg.content = content
    db.session.commit()

    msg_data = msg.to_dict()
    socketio.emit("message_updated", msg_data, room=f"chat_{msg.chat_id}")

    return success(msg_data)


@messages_bp.route("/messages/<int:message_id>", methods=["DELETE"])
@jwt_required()
def delete_message(message_id):
    user_id = int(get_jwt_identity())
    msg = db.session.get(Message, message_id)
    if not msg:
        return error("Message not found", 404)

    # Allow author or chat admin/owner to delete
    member = ChatMember.query.filter_by(chat_id=msg.chat_id, user_id=user_id).first()
    if msg.user_id != user_id and (not member or member.role not in ("owner", "admin")):
        return error("Access denied", 403)

    chat_id = msg.chat_id
    db.session.delete(msg)
    db.session.commit()

    socketio.emit("message_deleted", {"message_id": message_id, "chat_id": chat_id}, room=f"chat_{chat_id}")

    return success(message="Message deleted")
