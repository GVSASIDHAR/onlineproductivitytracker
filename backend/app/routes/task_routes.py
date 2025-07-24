from flask import Blueprint, request, jsonify
from flask_security import auth_required, current_user
from ..models import db, Task, Subtask, AnalyticsLog
from datetime import datetime
from sqlalchemy import func 

task_bp = Blueprint('task_bp', __name__, url_prefix='/api/tasks')

@task_bp.route("/", methods=["GET"])
@auth_required()
def get_tasks():
    tasks = Task.query.filter_by(user_id=current_user.id).all()
    tasks_data = []

    for task in tasks:
    
        total_time = db.session.query(
            func.sum(AnalyticsLog.duration_minutes)
        ).filter(
            AnalyticsLog.task_id == task.id,
            AnalyticsLog.user_id == current_user.id,
            AnalyticsLog.action_type == "Timer Stopped",
            AnalyticsLog.duration_minutes.isnot(None)
        ).scalar() or 0

        total_time = round(total_time)


        tasks_data.append({
            "id": task.id,
            "title": task.title,
            "description": task.description,
            "category": task.category,
            "priority": task.priority,
            "due_date": task.deadline if task.deadline else None,
            "is_completed": task.is_completed,
           "total_time": total_time,
            "total_time_spent_minutes": total_time

        })

    return jsonify(tasks_data), 200


@task_bp.route("", methods=["POST"])
@auth_required()
def create_task():
    data = request.get_json()
    title = data.get("title")
    if not title:
        return jsonify({"error": "Title is required"}), 400

    deadline_str = data.get("deadline")
    try:
        deadline = datetime.fromisoformat(deadline_str) if deadline_str else None
    except Exception:
        return jsonify({"error": "Invalid deadline format"}), 400

    task = Task(
        title=title,
        description=data.get("description", ""),
        priority=data.get("priority", "Low"),
        category=data.get("category"),
        deadline=deadline,
        is_completed=False,
        user_id=current_user.id
    )

    db.session.add(task)
    db.session.commit()

    log = AnalyticsLog(user_id=current_user.id, action_type="Task Created", task_id=task.id)
    db.session.add(log)
    db.session.commit()

    return jsonify(task.to_dict()), 201


@task_bp.route("/<int:task_id>", methods=["PUT"])
@auth_required()
def update_task(task_id):
    task = Task.query.get_or_404(task_id)
    if task.user_id != current_user.id:
        return jsonify({"error": "Unauthorized"}), 403
    if task.is_completed:
        return jsonify({"error": "Cannot track time for a completed task."}), 400
    data = request.get_json()
    task.title = data.get("title", task.title)
    task.description = data.get("description", task.description)
    task.priority = data.get("priority", task.priority)
    task.category = data.get("category", task.category)

    
    if "deadline" in data:
        deadline_str = data.get("deadline")
        try:
            task.deadline = datetime.fromisoformat(deadline_str) if deadline_str else None
        except Exception:
            return jsonify({"error": "Invalid deadline format"}), 400

 
    is_completed = data.get("is_completed")
    if is_completed is not None:
        task.is_completed = str(is_completed).lower() == "true" or is_completed is True

    db.session.commit()
    return jsonify(task.to_dict()), 200


@task_bp.route("/<int:task_id>", methods=["DELETE"])
@auth_required()
def delete_task(task_id):
    task = Task.query.get_or_404(task_id)
    if task.user_id != current_user.id:
        return jsonify({"error": "Unauthorized"}), 403

    db.session.delete(task)
    db.session.commit()

 
    log = AnalyticsLog(user_id=current_user.id, action_type="Task Deleted", task_id=task.id)
    db.session.add(log)
    db.session.commit()

    return jsonify({"message": "Task deleted"}), 200


@task_bp.route("/<int:task_id>/complete", methods=["POST"])
@auth_required()
def complete_task(task_id):
    task = Task.query.get_or_404(task_id)
    if task.user_id != current_user.id:
        return jsonify({"error": "Unauthorized"}), 403

    task.is_completed = True
    db.session.commit()


    log = AnalyticsLog(user_id=current_user.id, action_type="Task Completed", task_id=task.id)
    db.session.add(log)
    db.session.commit()

    return jsonify({"message": "Task marked complete"}), 200


@task_bp.route('/<int:task_id>', methods=['GET'])
@auth_required()
def get_task(task_id):
    task = Task.query.get_or_404(task_id)
    if task.user_id != current_user.id:
        return jsonify({"error": "Unauthorized"}), 403

    return jsonify(task.to_dict()), 200

@task_bp.route("/<int:task_id>/timer", methods=["POST"])
@auth_required()
def log_task_time(task_id):
    data = request.get_json()
    action = data.get("action")

    if action not in ["start", "stop"]:
        return jsonify({"error": "Invalid action"}), 400

    task = Task.query.get_or_404(task_id)
    if task.user_id != current_user.id:
        return jsonify({"error": "Unauthorized"}), 403

    if action == "start":
        start_time = datetime.utcnow()
        log = AnalyticsLog(
            user_id=current_user.id,
            task_id=task.id,
            action_type="Timer Started",
            start_time=start_time
        )
        db.session.add(log)
        db.session.commit()
        return jsonify({"message": "Timer started", "log_id": log.id}), 200

    elif action == "stop":
    
        log = AnalyticsLog.query.filter_by(
            user_id=current_user.id,
            task_id=task.id,
            action_type="Timer Started",
            end_time=None
        ).order_by(AnalyticsLog.start_time.desc()).first()

        if not log:
            return jsonify({"error": "No active timer found"}), 400

        end_time = datetime.utcnow()
        duration = (end_time - log.start_time).total_seconds() / 60

        log.end_time = end_time
        log.duration_minutes = round(duration, 2)
        log.action_type = "Timer Stopped"

        db.session.commit()
        return jsonify({
            "message": "Timer stopped",
            "duration_minutes": log.duration_minutes,
            "log_id": log.id
        }), 200

@task_bp.route("/<int:task_id>/analytics/latest", methods=["GET"])
@auth_required()
def get_latest_timer_log(task_id):
    task = Task.query.get_or_404(task_id)
    if task.user_id != current_user.id:
        return jsonify({"error": "Unauthorized"}), 403
    log = AnalyticsLog.query.filter_by(
        user_id=current_user.id,
        task_id=task.id,
        action_type="Timer Stopped"
    ).order_by(AnalyticsLog.end_time.desc()).first()

    if not log:
        return jsonify({"duration_minutes": 0.0}), 200

    return jsonify({
        "duration_minutes": round(log.duration_minutes or 0.0, 2)
    }), 200
