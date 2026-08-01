from flask import Blueprint, request
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt_identity,
    get_jwt,
)
from app.extensions import db
from app.models.user import User
from app.utils.jwt_utils import revoke_token
from app.utils.response import success, error

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}

    username = (data.get("username") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not username or not email or not password:
        return error("username, email and password are required", 422)

    if len(username) < 3 or len(username) > 80:
        return error("Username must be between 3 and 80 characters", 422)

    if len(password) < 6:
        return error("Password must be at least 6 characters", 422)

    if User.query.filter_by(username=username).first():
        return error("Username already taken", 409)

    if User.query.filter_by(email=email).first():
        return error("Email already registered", 409)

    user = User(username=username, email=email)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))

    return success(
        {
            "user": user.to_dict(include_email=True),
            "access_token": access_token,
            "refresh_token": refresh_token,
        },
        status_code=201,
    )


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}

    login_field = (data.get("email") or data.get("username") or "").strip()
    password = data.get("password") or ""

    if not login_field or not password:
        return error("email/username and password are required", 422)

    # Allow login by email or username
    user = User.query.filter(
        (User.email == login_field.lower()) | (User.username == login_field)
    ).first()

    if not user or not user.check_password(password):
        return error("Invalid credentials", 401)

    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))

    return success(
        {
            "user": user.to_dict(include_email=True),
            "access_token": access_token,
            "refresh_token": refresh_token,
        }
    )


@auth_bp.route("/logout", methods=["DELETE"])
@jwt_required()
def logout():
    jti = get_jwt()["jti"]
    revoke_token(jti)
    return success(message="Logged out successfully")


@auth_bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    identity = get_jwt_identity()
    access_token = create_access_token(identity=identity)
    return success({"access_token": access_token})


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        return error("User not found", 404)
    return success(user.to_dict(include_email=True))
