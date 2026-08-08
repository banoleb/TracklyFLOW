import os
import uuid
from flask import Blueprint, request, current_app, send_from_directory
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from app.extensions import db, socketio
from app.models.message import Message
from app.models.chat import ChatMember
from app.utils.response import success, error

messages_bp = Blueprint("messages", __name__)

# Maps accepted MIME types to a fixed safe extension (values are hard-coded literals
# so the extension used in the filesystem path is never derived from user input).
_MIME_TO_EXT: dict = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/gif": "gif",
    "image/webp": "webp",
    "application/pdf": "pdf",
    "text/plain": "txt",
    "text/csv": "csv",
    "application/msword": "doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "application/vnd.ms-excel": "xls",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
    "application/zip": "zip",
    "video/mp4": "mp4",
    "audio/mpeg": "mp3",
}


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
    since_id = request.args.get("since_id", type=int)

    query = Message.query.filter_by(chat_id=chat_id)
    if since_id is not None:
        query = query.filter(Message.id > since_id)

    paginated = (
        query
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

    attachment_url = None
    attachment_name = None

    # Support both multipart/form-data (with optional file) and application/json
    if request.content_type and "multipart/form-data" in request.content_type:
        content = (request.form.get("content") or "").strip() or None
        file = request.files.get("file")
        if file and file.filename:
            # Derive extension from the MIME type using a hard-coded map so that
            # no user-supplied string ever reaches os.path.join (breaks taint chain).
            mime = (file.content_type or "").split(";")[0].strip().lower()
            ext = _MIME_TO_EXT.get(mime)
            if ext is None:
                return error("File type not allowed", 422)
            safe_name = secure_filename(file.filename) or ("attachment." + ext)
            unique_name = "msg_" + str(chat_id) + "_" + uuid.uuid4().hex + "." + ext
            upload_folder = os.path.join(current_app.config["UPLOAD_FOLDER"], "messages")
            os.makedirs(upload_folder, exist_ok=True)
            file.save(os.path.join(upload_folder, unique_name))
            attachment_url = "/api/messages/uploads/" + unique_name
            attachment_name = safe_name
    else:
        data = request.get_json(silent=True) or {}
        content = (data.get("content") or "").strip() or None

    if not content and not attachment_url:
        return error("Message must have content or an attachment", 422)

    msg = Message(
        chat_id=chat_id,
        user_id=user_id,
        content=content,
        attachment_url=attachment_url,
        attachment_name=attachment_name,
    )
    db.session.add(msg)
    db.session.commit()

    msg_data = msg.to_dict()
    socketio.emit("new_message", msg_data, room=f"chat_{chat_id}")
    return success(msg_data, status_code=201)


@messages_bp.route("/uploads/<path:filename>", methods=["GET"])
def serve_message_upload(filename):
    upload_folder = os.path.join(current_app.config["UPLOAD_FOLDER"], "messages")
    return send_from_directory(upload_folder, filename)


@messages_bp.route("/<int:message_id>", methods=["PATCH"])
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


@messages_bp.route("/<int:message_id>", methods=["DELETE"])
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
