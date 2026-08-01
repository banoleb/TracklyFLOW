from app.extensions import db
from datetime import datetime, timezone


class TokenBlocklist(db.Model):
    __tablename__ = "token_blocklist"

    id = db.Column(db.Integer, primary_key=True)
    jti = db.Column(db.String(36), nullable=False, unique=True, index=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)


def is_token_revoked(jwt_header, jwt_payload):
    jti = jwt_payload["jti"]
    token = db.session.execute(
        db.select(TokenBlocklist).filter_by(jti=jti)
    ).scalar_one_or_none()
    return token is not None


def revoke_token(jti):
    db.session.add(TokenBlocklist(jti=jti))
    db.session.commit()
