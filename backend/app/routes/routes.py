from flask import Blueprint, render_template, redirect, url_for
from flask_security import login_required, current_user

main_bp = Blueprint('main_bp', __name__)

@main_bp.route('/')
def home():
    if current_user.is_authenticated:
        return redirect(url_for('main_bp.dashboard'))
    return render_template('index.html')

@main_bp.route('/login')
def loginpage():
    if current_user.is_authenticated:
        return redirect(url_for('main_bp.dashboard'))
    return render_template('login.html')

@main_bp.route('/signup')
def signuppage():
    if current_user.is_authenticated:
        return redirect(url_for('main_bp.dashboard'))
    return render_template('signup.html')

@main_bp.route('/dashboard')
@login_required
def dashboard():
    return render_template('dashboard.html')

@main_bp.route('/tasklist')
@login_required
def tasklist():
    return render_template('tasklist.html')

@main_bp.route('/analytics')
@login_required
def analytics():
    return render_template('analytics.html')
@main_bp.route('/debug-auth')
def debug_auth():
    return {
        "is_authenticated": current_user.is_authenticated,
        "user_id": current_user.get_id(),
        "roles": getattr(current_user, 'roles', []),
        "email": getattr(current_user, 'email', 'N/A')
    }
