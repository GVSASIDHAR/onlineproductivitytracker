from flask import Blueprint, render_template
from flask_security import auth_required, current_user

main_bp = Blueprint("main_bp", __name__)

@main_bp.route("/dashboard")
@auth_required()
def dashboard():
    return render_template("dashboard.html", user=current_user)
