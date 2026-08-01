from flask import request
from flask_socketio import join_room, leave_room, emit
from flask_jwt_extended import decode_token
from app.models.chat import ChatMember


def register_socket_events(socketio):

    @socketio.on("connect")
    def on_connect(auth):
        token = None
        if auth:
            token = auth.get("token")
        if not token:
            token = request.args.get("token")

        if not token:
            return False  # Reject unauthenticated connections

        try:
            decoded = decode_token(token)
            request.user_id = int(decoded["sub"])
        except Exception:
            return False

        emit("connected", {"user_id": request.user_id})

    @socketio.on("disconnect")
    def on_disconnect():
        pass

    @socketio.on("join_chat")
    def on_join_chat(data):
        chat_id = data.get("chat_id")
        if not chat_id:
            return
        user_id = getattr(request, "user_id", None)
        if not user_id:
            return

        membership = ChatMember.query.filter_by(chat_id=chat_id, user_id=user_id).first()
        if membership:
            join_room(f"chat_{chat_id}")
            emit("joined_chat", {"chat_id": chat_id})

    @socketio.on("leave_chat")
    def on_leave_chat(data):
        chat_id = data.get("chat_id")
        if chat_id:
            leave_room(f"chat_{chat_id}")
            emit("left_chat", {"chat_id": chat_id})

    @socketio.on("typing")
    def on_typing(data):
        chat_id = data.get("chat_id")
        user_id = getattr(request, "user_id", None)
        if chat_id and user_id:
            emit("user_typing", {"chat_id": chat_id, "user_id": user_id}, room=f"chat_{chat_id}", include_self=False)

    @socketio.on("stop_typing")
    def on_stop_typing(data):
        chat_id = data.get("chat_id")
        user_id = getattr(request, "user_id", None)
        if chat_id and user_id:
            emit("user_stop_typing", {"chat_id": chat_id, "user_id": user_id}, room=f"chat_{chat_id}", include_self=False)
