import os
from flask import Flask
from app.config import config
from app.extensions import db, migrate, jwt, socketio, cors


def create_app(config_name=None):
    if config_name is None:
        config_name = os.environ.get("FLASK_ENV", "default")

    app = Flask(__name__)
    app.config.from_object(config[config_name])

    # Ensure upload folder exists
    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}})
    socketio.init_app(
        app,
        cors_allowed_origins=app.config["CORS_ORIGINS"],
        async_mode="eventlet",
    )

    # Register blueprints
    from app.routes.auth import auth_bp
    from app.routes.users import users_bp
    from app.routes.chats import chats_bp
    from app.routes.messages import messages_bp
    from app.routes.tasks import tasks_bp
    from app.routes.notes import notes_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(users_bp, url_prefix="/api/users")
    app.register_blueprint(chats_bp, url_prefix="/api/chats")
    app.register_blueprint(messages_bp, url_prefix="/api/messages")
    app.register_blueprint(tasks_bp, url_prefix="/api/tasks")
    app.register_blueprint(notes_bp, url_prefix="/api/notes")

    # Register socket events
    from app.sockets import register_socket_events
    register_socket_events(socketio)

    # JWT token blocklist loader
    from app.utils.jwt_utils import is_token_revoked
    jwt.token_in_blocklist_loader(is_token_revoked)

    @app.route("/api/health")
    def health():
        return {"status": "ok", "version": "1.0.0"}

    return app
