import os
from flask import Flask, g
import mysql.connector
from flask_jwt_extended import JWTManager
from app.routes import routes
from app.auth import auth, any_users_exist, create_default_admin
from app.api import api
from app.excel_handler import excel_handler
from app.config import Config


def create_app():
    app = Flask(__name__, template_folder='../templates', static_folder='../static')
    app.config.from_object(Config)

    # Initialize JWTManager
    jwt = JWTManager(app)
    
    # Function to get DB connection
    def get_db():
        if 'db' not in g:
            g.db = mysql.connector.connect(**app.config['DATABASE_CONFIG'])
        return g.db

    # Close DB connection after each request
    @app.teardown_appcontext
    def close_db(exception):
        db = g.pop('db', None)
        if db is not None:
            db.close()

    app.get_db = get_db
    app.register_blueprint(routes)
    app.register_blueprint(auth)
    app.register_blueprint(api)
    app.register_blueprint(excel_handler)

     # Check if any users exist and create a default admin if none exist
    with app.app_context():
        if not any_users_exist():
            create_default_admin()

    return app

    