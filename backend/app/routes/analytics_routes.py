from flask import Blueprint, jsonify, request
from flask_security import login_required, current_user
from ..models import db, Task, AnalyticsLog
from sqlalchemy import func
from datetime import datetime

analytics_bp = Blueprint("analytics_bp", __name__, url_prefix="/api/analytics")

#User Summary
@analytics_bp.route('/user-summary')
@login_required
def user_summary():
    user_id = current_user.id

    total_tasks = Task.query.filter_by(user_id=user_id).count()
    completed_tasks = Task.query.filter_by(user_id=user_id, is_completed=True).count()
    pending_tasks = total_tasks - completed_tasks

    total_time_spent = (
        db.session.query(db.func.sum(AnalyticsLog.duration_minutes))
        .join(Task, Task.id == AnalyticsLog.task_id)
        .filter(Task.user_id == user_id)
        .scalar()
    )

    return jsonify({
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks,
        "pending_tasks": pending_tasks,
        "total_time_spent_minutes": round(total_time_spent or 0, 2)
    })


# task history
@analytics_bp.route("/task-history", methods=["GET"])
@login_required
def task_history():
    logs = AnalyticsLog.query.filter_by(user_id=current_user.id).order_by(AnalyticsLog.timestamp.desc()).all()
    return jsonify([log.to_dict() for log in logs]), 200

@analytics_bp.route("/duration-by-category", methods=["GET"])
@login_required
def duration_by_category():
    results = db.session.query(
        Task.category,
        func.sum(AnalyticsLog.duration_minutes)
    ).join(Task, Task.id == AnalyticsLog.task_id) \
     .filter(Task.user_id == current_user.id) \
     .group_by(Task.category).all()

    category_data = [
        {
            "category": category or "Uncategorized",
            "total_duration": round(duration or 0, 2)
        }
        for category, duration in results
    ]

    return jsonify(category_data), 200

@analytics_bp.route('/api/tracking/start', methods=['POST'])
@login_required
def start_tracking():
    data = request.json
    task_id = data.get('task_id')

    # End any previous open session
    open_log = AnalyticsLog.query.filter_by(user_id=current_user.id, task_id=task_id, end_time=None).first()
    if open_log:
        return jsonify({"message": "Tracking already in progress"}), 400

    log = AnalyticsLog(
        user_id=current_user.id,
        task_id=task_id,
        action_type="Tracking Started",
        start_time=datetime.utcnow()
    )
    db.session.add(log)
    db.session.commit()
    return jsonify({"message": "Tracking started", "log_id": log.id})


@analytics_bp.route('/api/tracking/pause', methods=['POST'])
@login_required
def pause_tracking():
    data = request.json
    task_id = data.get('task_id')

    open_log = AnalyticsLog.query.filter_by(user_id=current_user.id, task_id=task_id, end_time=None).first()
    if not open_log:
        return jsonify({"message": "No active session found"}), 400

    open_log.end_time = datetime.utcnow()
    open_log.duration_minutes = (open_log.end_time - open_log.start_time).total_seconds() / 60.0
    open_log.action_type = "Tracking Paused"
    db.session.commit()
    return jsonify({"message": "Tracking paused", "duration": open_log.duration_minutes})


@analytics_bp.route('/api/tracking/status/<int:task_id>', methods=['GET'])
@login_required
def tracking_status(task_id):
    open_log = AnalyticsLog.query.filter_by(user_id=current_user.id, task_id=task_id, end_time=None).first()
    if open_log:
        return jsonify({
            "tracking": True,
            "start_time": open_log.start_time.isoformat()
        })
    return jsonify({"tracking": False})
@analytics_bp.route('/time-per-task', methods=['GET'])
@login_required
def time_per_task():
    user_id = current_user.id

    results = (
        db.session.query(Task.title, db.func.sum(AnalyticsLog.duration_minutes))
        .join(AnalyticsLog, Task.id == AnalyticsLog.task_id)
        .filter(Task.user_id == user_id)
        .group_by(Task.title)
        .all()
    )

    data = [
        {"task_title": title, "total_minutes": int(duration or 0)}
        for title, duration in results
    ]

    return jsonify(data)
