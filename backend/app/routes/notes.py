from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.note import Note
from app.utils.response import success, error

notes_bp = Blueprint("notes", __name__)


@notes_bp.route("", methods=["GET"])
@jwt_required()
def list_notes():
    user_id = int(get_jwt_identity())
    page = request.args.get("page", 1, type=int)
    per_page = min(request.args.get("per_page", 20, type=int), 100)

    paginated = (
        Note.query.filter_by(user_id=user_id)
        .order_by(Note.updated_at.desc())
        .paginate(page=page, per_page=per_page, error_out=False)
    )

    return success(
        {
            "notes": [n.to_dict() for n in paginated.items],
            "total": paginated.total,
            "pages": paginated.pages,
            "page": paginated.page,
        }
    )


@notes_bp.route("", methods=["POST"])
@jwt_required()
def create_note():
    user_id = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}

    content = (data.get("content") or "").strip()
    if not content:
        return error("content is required", 422)

    title = (data.get("title") or "").strip() or None

    note = Note(title=title, content=content, user_id=user_id)
    db.session.add(note)
    db.session.commit()
    return success(note.to_dict(), status_code=201)


@notes_bp.route("/<int:note_id>", methods=["GET"])
@jwt_required()
def get_note(note_id):
    user_id = int(get_jwt_identity())
    note = db.session.get(Note, note_id)
    if not note:
        return error("Note not found", 404)
    if note.user_id != user_id:
        return error("Access denied", 403)
    return success(note.to_dict())


@notes_bp.route("/<int:note_id>", methods=["PATCH"])
@jwt_required()
def update_note(note_id):
    user_id = int(get_jwt_identity())
    note = db.session.get(Note, note_id)
    if not note:
        return error("Note not found", 404)
    if note.user_id != user_id:
        return error("Access denied", 403)

    data = request.get_json(silent=True) or {}

    if "title" in data:
        note.title = (data["title"] or "").strip() or None

    if "content" in data:
        content = (data["content"] or "").strip()
        if not content:
            return error("content cannot be empty", 422)
        note.content = content

    db.session.commit()
    return success(note.to_dict())


@notes_bp.route("/<int:note_id>", methods=["DELETE"])
@jwt_required()
def delete_note(note_id):
    user_id = int(get_jwt_identity())
    note = db.session.get(Note, note_id)
    if not note:
        return error("Note not found", 404)
    if note.user_id != user_id:
        return error("Access denied", 403)

    db.session.delete(note)
    db.session.commit()
    return success(message="Note deleted")
