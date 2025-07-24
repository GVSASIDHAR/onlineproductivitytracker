from datetime import datetime
from ..models import AnalyticsLog, db
from flask import current_app

def log_event(user_id, action_type, task_id=None, start_time=None, end_time=None, duration_minutes=None):
    try:
        log = AnalyticsLog(
            user_id=user_id,
            task_id=task_id,
            action_type=action_type,
            timestamp=datetime.utcnow(),  # You had missed this
            start_time=start_time,
            end_time=end_time,
            duration_minutes=duration_minutes
        )
        db.session.add(log)
        db.session.commit()
        current_app.logger.info(f"[Analytics] {action_type} for User {user_id}, Task {task_id}")
    except Exception as e:
        current_app.logger.error(f"[Analytics] Logging failed: {str(e)}")
