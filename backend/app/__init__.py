import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_security import Security, SQLAlchemyUserDatastore
from flask_cors import CORS
from dotenv import load_dotenv


basedir = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(basedir, '..', '.env'))


db = SQLAlchemy()
migrate = Migrate()

from .models import User, Role
user_datastore = SQLAlchemyUserDatastore(db, User, None)
security = Security()

def create_app():
    from config import Config


    app = Flask(__name__, template_folder='templates', static_folder='static')
    app.config.from_object(Config)


    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'super-secret-123')
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv("DATABASE_URL")
    app.config['SECURITY_PASSWORD_SALT'] = os.getenv('SECURITY_PASSWORD_SALT', 'super-salty-value')


    app.config['SESSION_COOKIE_SECURE'] = True
    app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
    app.config['REMEMBER_COOKIE_SECURE'] = True
    app.config['REMEMBER_COOKIE_SAMESITE'] = 'Lax'
    CORS(app, origins=["http://127.0.0.1:5000"], supports_credentials=True)

    
    db.init_app(app)
    migrate.init_app(app, db)
    security.init_app(app, user_datastore)

    
    from .routes.task_routes import task_bp
    from .routes.auth_routes import auth_bp
    from .routes.analytics_routes import analytics_bp
    from .routes.routes import main_bp

    app.register_blueprint(task_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(analytics_bp)
    app.register_blueprint(main_bp)

    

    return app
