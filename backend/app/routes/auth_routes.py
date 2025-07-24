from flask import Blueprint, request, jsonify, session
from flask_security import auth_required, login_user, logout_user, current_user
from flask_security.utils import hash_password
from ..models import db, User
from flask import make_response
from flask_security import SQLAlchemyUserDatastore
import traceback

auth_bp = Blueprint("auth_bp", __name__, url_prefix="/api/auth")

user_datastore = SQLAlchemyUserDatastore(db, User, None)

@auth_bp.route("/session-debug", methods=["GET"])
def session_debug():
    return jsonify({
        "session": dict(session),
        "current_user": str(current_user) if current_user.is_authenticated else "Anonymous"
    })

@auth_bp.route("/whoami", methods=["GET"])
@auth_required()
def whoami():
    return jsonify({
        "id": current_user.id,
        "email": current_user.email,
        "active": current_user.active
    }), 200

@auth_bp.route("/register", methods=["POST"])
def register():
    try:
        data = request.get_json()
        email = data.get("email")
        password = data.get("password")

        if not email or not password:
            return jsonify({"error": "Email and password are required"}), 400

        if user_datastore.find_user(email=email):
            return jsonify({"error": "User already exists"}), 400

        user = user_datastore.create_user(
            email=email,
            password=hash_password(password),
            active=True
        )
        db.session.commit()

        login_user(user, remember=True)
        session["user_id"] = user.id
        session.permanent = True

        return jsonify({"message": "User registered successfully"}), 201

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": "Internal server error", "details": str(e)}), 500

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    user = user_datastore.find_user(email=email)
    if user and user.verify_and_update_password(password):
        login_user(user, remember=True)
        session["user_id"] = user.id
        session.permanent = True
        return jsonify({"message": "Login successful"}), 200

    return jsonify({"error": "Invalid credentials"}), 401

@auth_bp.route("/api/auth/logout", methods=["POST"])
@auth_required()
def logout():
    logout_user()
    session.clear()

    response = make_response(jsonify({"message": "Logged out successfully"}), 200)
    
   #clearing cookies
    response.delete_cookie("remember_token")
    response.delete_cookie("session")  
    return response


