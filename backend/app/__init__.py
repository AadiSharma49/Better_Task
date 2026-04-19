import logging
import os
from pathlib import Path

from flask import Flask, jsonify
from flask_cors import CORS

from .db import db
from .routes import api


def create_app(test_config: dict | None = None) -> Flask:
    app = Flask(__name__)

    base_dir = Path(__file__).resolve().parent.parent
    if os.getenv("VERCEL"):
        default_db_path = Path("/tmp") / "pulseboard-tasks.db"
    else:
        default_db_path = base_dir / "data" / "tasks.db"
    default_db_path.parent.mkdir(parents=True, exist_ok=True)

    app.config.update(
        SQLALCHEMY_DATABASE_URI=f"sqlite:///{default_db_path}",
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
        JSON_SORT_KEYS=False,
    )

    if test_config:
        app.config.update(test_config)

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
    )
    app.logger.setLevel(logging.INFO)

    CORS(
        app,
        resources={
            r"/api/*": {
                "origins": os.getenv("FRONTEND_ORIGIN", "http://localhost:5173"),
            }
        },
    )

    db.init_app(app)

    with app.app_context():
        db.create_all()

    app.register_blueprint(api, url_prefix="/api")

    @app.get("/health")
    def healthcheck():
        return jsonify({"status": "ok"})

    @app.errorhandler(404)
    def not_found(_error):
        return jsonify({"error": "not_found", "message": "Resource not found."}), 404

    @app.errorhandler(500)
    def internal_error(error):
        app.logger.exception("Unhandled server error: %s", error)
        return (
            jsonify(
                {
                    "error": "internal_server_error",
                    "message": "Something went wrong on the server.",
                }
            ),
            500,
        )

    return app
