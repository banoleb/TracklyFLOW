import os
from flask import Blueprint, request, current_app, send_from_directory
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from app.extensions import db
from app.models.user import User
from app.utils.response import success, error

users_bp = Blueprint("users", __name__)

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "webp"}


def _allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@users_bp.route("", methods=["GET"])
@jwt_required()
def search_users():
    q = request.args.get("q", "").strip()
    page = request.args.get("page", 1, type=int)
    per_page = min(request.args.get("per_page", 20, type=int), 100)

    query = User.query
    if q:
        query = query.filter(
            User.username.ilike(f"%{q}%") | User.email.ilike(f"%{q}%")
        )

    paginated = query.order_by(User.username).paginate(page=page, per_page=per_page, error_out=False)

    return success(
        {
            "users": [u.to_dict() for u in paginated.items],
            "total": paginated.total,
            "pages": paginated.pages,
            "page": paginated.page,
        }
    )


@users_bp.route("/<int:user_id>", methods=["GET"])
@jwt_required()
def get_user(user_id):
    user = db.session.get(User, user_id)
    if not user:
        return error("User not found", 404)
    current_user_id = int(get_jwt_identity())
    include_email = current_user_id == user_id
    return success(user.to_dict(include_email=include_email))


@users_bp.route("/me", methods=["PATCH"])
@jwt_required()
def update_profile():
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        return error("User not found", 404)

    data = request.get_json(silent=True) or {}

    if "username" in data:
        new_username = data["username"].strip()
        if len(new_username) < 3 or len(new_username) > 80:
            return error("Username must be between 3 and 80 characters", 422)
        existing = User.query.filter_by(username=new_username).first()
        if existing and existing.id != user_id:
            return error("Username already taken", 409)
        user.username = new_username

    if "email" in data:
        new_email = data["email"].strip().lower()
        existing = User.query.filter_by(email=new_email).first()
        if existing and existing.id != user_id:
            return error("Email already registered", 409)
        user.email = new_email

    if "password" in data:
        if len(data["password"]) < 6:
            return error("Password must be at least 6 characters", 422)
        user.set_password(data["password"])

    db.session.commit()
    return success(user.to_dict(include_email=True))


@users_bp.route("/me/avatar", methods=["POST"])
@jwt_required()
def upload_avatar():
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        return error("User not found", 404)

    if "avatar" not in request.files:
        return error("No file provided", 422)

    file = request.files["avatar"]
    if file.filename == "":
        return error("No file selected", 422)

    if not _allowed_file(file.filename):
        return error("File type not allowed", 422)

    filename = secure_filename(f"avatar_{user_id}.{file.filename.rsplit('.', 1)[1].lower()}")
    upload_folder = current_app.config["UPLOAD_FOLDER"]
    os.makedirs(upload_folder, exist_ok=True)
    file.save(os.path.join(upload_folder, filename))

    user.avatar = f"/api/uploads/{filename}"
    db.session.commit()

    return success({"avatar": user.avatar})


@users_bp.route("/uploads/<path:filename>", methods=["GET"])
def serve_upload(filename):
    return send_from_directory(current_app.config["UPLOAD_FOLDER"], filename)
