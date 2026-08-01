from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.task import Task
from app.models.chat import ChatMember
from app.models.user import User
from app.utils.response import success, error

tasks_bp = Blueprint("tasks", __name__)

VALID_STATUSES = ("todo", "in_progress", "review", "done")


@tasks_bp.route("", methods=["GET"])
@jwt_required()
def list_tasks():
    user_id = int(get_jwt_identity())

    chat_id = request.args.get("chat_id", type=int)
    status = request.args.get("status")
    assigned = request.args.get("assigned_to", type=int)
    page = request.args.get("page", 1, type=int)
    per_page = min(request.args.get("per_page", 20, type=int), 100)

    query = Task.query

    if chat_id:
        # Verify membership
        if not ChatMember.query.filter_by(chat_id=chat_id, user_id=user_id).first():
            return error("Access denied", 403)
        query = query.filter_by(chat_id=chat_id)
    else:
        # Return tasks in chats where the user is a member
        member_chat_ids = [
            m.chat_id for m in ChatMember.query.filter_by(user_id=user_id).all()
        ]
        query = query.filter(Task.chat_id.in_(member_chat_ids))

    if status and status in VALID_STATUSES:
        query = query.filter_by(status=status)
    if assigned:
        query = query.filter_by(assigned_to=assigned)

    paginated = query.order_by(Task.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )

    return success(
        {
            "tasks": [t.to_dict() for t in paginated.items],
            "total": paginated.total,
            "pages": paginated.pages,
            "page": paginated.page,
        }
    )


@tasks_bp.route("", methods=["POST"])
@jwt_required()
def create_task():
    user_id = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}

    title = (data.get("title") or "").strip()
    if not title:
        return error("title is required", 422)

    chat_id = data.get("chat_id")
    if chat_id:
        chat_id = int(chat_id)
        if not ChatMember.query.filter_by(chat_id=chat_id, user_id=user_id).first():
            return error("Access denied", 403)

    assigned_to = data.get("assigned_to")
    if assigned_to:
        assigned_to = int(assigned_to)
        if not db.session.get(User, assigned_to):
            return error("Assigned user not found", 404)

    status = data.get("status", "todo")
    if status not in VALID_STATUSES:
        return error(f"status must be one of {VALID_STATUSES}", 422)

    task = Task(
        title=title,
        description=(data.get("description") or "").strip() or None,
        status=status,
        assigned_to=assigned_to,
        created_by=user_id,
        chat_id=chat_id,
    )
    db.session.add(task)
    db.session.commit()
    return success(task.to_dict(), status_code=201)


@tasks_bp.route("/<int:task_id>", methods=["GET"])
@jwt_required()
def get_task(task_id):
    user_id = int(get_jwt_identity())
    task = db.session.get(Task, task_id)
    if not task:
        return error("Task not found", 404)

    if task.chat_id:
        if not ChatMember.query.filter_by(chat_id=task.chat_id, user_id=user_id).first():
            return error("Access denied", 403)

    return success(task.to_dict())


@tasks_bp.route("/<int:task_id>", methods=["PATCH"])
@jwt_required()
def update_task(task_id):
    user_id = int(get_jwt_identity())
    task = db.session.get(Task, task_id)
    if not task:
        return error("Task not found", 404)

    if task.chat_id:
        if not ChatMember.query.filter_by(chat_id=task.chat_id, user_id=user_id).first():
            return error("Access denied", 403)

    data = request.get_json(silent=True) or {}

    if "title" in data:
        title = data["title"].strip()
        if not title:
            return error("title cannot be empty", 422)
        task.title = title

    if "description" in data:
        task.description = (data["description"] or "").strip() or None

    if "status" in data:
        if data["status"] not in VALID_STATUSES:
            return error(f"status must be one of {VALID_STATUSES}", 422)
        task.status = data["status"]

    if "assigned_to" in data:
        assigned_to = data["assigned_to"]
        if assigned_to is not None:
            assigned_to = int(assigned_to)
            if not db.session.get(User, assigned_to):
                return error("Assigned user not found", 404)
        task.assigned_to = assigned_to

    db.session.commit()
    return success(task.to_dict())


@tasks_bp.route("/<int:task_id>", methods=["DELETE"])
@jwt_required()
def delete_task(task_id):
    user_id = int(get_jwt_identity())
    task = db.session.get(Task, task_id)
    if not task:
        return error("Task not found", 404)

    if task.created_by != user_id:
        return error("Only the task creator can delete it", 403)

    db.session.delete(task)
    db.session.commit()
    return success(message="Task deleted")
