from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.chat import Chat, ChatMember
from app.models.user import User
from app.utils.response import success, error

chats_bp = Blueprint("chats", __name__)


def _get_member(chat_id, user_id):
    return ChatMember.query.filter_by(chat_id=chat_id, user_id=user_id).first()


@chats_bp.route("", methods=["GET"])
@jwt_required()
def list_chats():
    user_id = int(get_jwt_identity())
    memberships = (
        ChatMember.query.filter_by(user_id=user_id)
        .join(Chat)
        .order_by(Chat.created_at.desc())
        .all()
    )
    chats = [m.chat.to_dict(current_user_id=user_id) for m in memberships]
    return success(chats)


@chats_bp.route("", methods=["POST"])
@jwt_required()
def create_chat():
    user_id = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}

    chat_type = data.get("type", "group")
    if chat_type not in ("personal", "group", "channel"):
        return error("Invalid chat type", 422)

    member_ids = data.get("member_ids", [])
    name = (data.get("name") or "").strip() or None

    if chat_type == "personal":
        if len(member_ids) != 1:
            return error("Personal chat requires exactly one other user", 422)
        other_id = int(member_ids[0])
        if other_id == user_id:
            return error("Cannot create personal chat with yourself", 422)

        # Check if a personal chat already exists between these two users
        existing = (
            db.session.query(Chat)
            .join(ChatMember, ChatMember.chat_id == Chat.id)
            .filter(
                Chat.type == "personal",
                ChatMember.user_id == user_id,
            )
            .all()
        )
        for ch in existing:
            other = ChatMember.query.filter(
                ChatMember.chat_id == ch.id,
                ChatMember.user_id == other_id,
            ).first()
            if other:
                return success(ch.to_dict(include_members=True, current_user_id=user_id))

    if chat_type in ("group", "channel") and not name:
        return error("name is required for group/channel chats", 422)

    chat = Chat(name=name, type=chat_type)
    db.session.add(chat)
    db.session.flush()

    # Add creator as owner
    db.session.add(ChatMember(chat_id=chat.id, user_id=user_id, role="owner"))

    # Add other members
    all_ids = set(int(mid) for mid in member_ids)
    all_ids.discard(user_id)
    for mid in all_ids:
        if db.session.get(User, mid):
            db.session.add(ChatMember(chat_id=chat.id, user_id=mid, role="member"))

    db.session.commit()
    return success(chat.to_dict(include_members=True, current_user_id=user_id), status_code=201)


@chats_bp.route("/<int:chat_id>", methods=["GET"])
@jwt_required()
def get_chat(chat_id):
    user_id = int(get_jwt_identity())
    chat = db.session.get(Chat, chat_id)
    if not chat:
        return error("Chat not found", 404)
    if not _get_member(chat_id, user_id):
        return error("Access denied", 403)
    return success(chat.to_dict(include_members=True, current_user_id=user_id))


@chats_bp.route("/<int:chat_id>", methods=["PATCH"])
@jwt_required()
def update_chat(chat_id):
    user_id = int(get_jwt_identity())
    chat = db.session.get(Chat, chat_id)
    if not chat:
        return error("Chat not found", 404)

    member = _get_member(chat_id, user_id)
    if not member or member.role not in ("owner", "admin"):
        return error("Access denied", 403)

    data = request.get_json(silent=True) or {}
    if "name" in data:
        chat.name = (data["name"] or "").strip() or None

    db.session.commit()
    return success(chat.to_dict(include_members=True, current_user_id=user_id))


@chats_bp.route("/<int:chat_id>", methods=["DELETE"])
@jwt_required()
def delete_chat(chat_id):
    user_id = int(get_jwt_identity())
    chat = db.session.get(Chat, chat_id)
    if not chat:
        return error("Chat not found", 404)

    member = _get_member(chat_id, user_id)
    if not member or member.role != "owner":
        return error("Only the owner can delete this chat", 403)

    db.session.delete(chat)
    db.session.commit()
    return success(message="Chat deleted")


@chats_bp.route("/<int:chat_id>/members", methods=["POST"])
@jwt_required()
def add_member(chat_id):
    user_id = int(get_jwt_identity())
    chat = db.session.get(Chat, chat_id)
    if not chat:
        return error("Chat not found", 404)

    member = _get_member(chat_id, user_id)
    if not member or member.role not in ("owner", "admin"):
        return error("Access denied", 403)

    data = request.get_json(silent=True) or {}
    new_user_id = data.get("user_id")
    if not new_user_id:
        return error("user_id is required", 422)

    new_user_id = int(new_user_id)
    if not db.session.get(User, new_user_id):
        return error("User not found", 404)

    if _get_member(chat_id, new_user_id):
        return error("User is already a member", 409)

    new_member = ChatMember(chat_id=chat_id, user_id=new_user_id, role="member")
    db.session.add(new_member)
    db.session.commit()
    return success(new_member.to_dict(), status_code=201)


@chats_bp.route("/<int:chat_id>/members/<int:target_user_id>", methods=["DELETE"])
@jwt_required()
def remove_member(chat_id, target_user_id):
    user_id = int(get_jwt_identity())
    chat = db.session.get(Chat, chat_id)
    if not chat:
        return error("Chat not found", 404)

    member = _get_member(chat_id, user_id)
    if not member:
        return error("Access denied", 403)

    # Allow self-leave or admin/owner removal
    if target_user_id != user_id and member.role not in ("owner", "admin"):
        return error("Access denied", 403)

    target_member = _get_member(chat_id, target_user_id)
    if not target_member:
        return error("Member not found", 404)

    db.session.delete(target_member)
    db.session.commit()
    return success(message="Member removed")
