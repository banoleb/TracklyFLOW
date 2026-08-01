from app.routes.auth import auth_bp
from app.routes.users import users_bp
from app.routes.chats import chats_bp
from app.routes.messages import messages_bp
from app.routes.tasks import tasks_bp

__all__ = ["auth_bp", "users_bp", "chats_bp", "messages_bp", "tasks_bp"]
