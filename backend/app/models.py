from flask_sqlalchemy import SQLAlchemy
from flask_security import UserMixin, RoleMixin
from datetime import datetime
import uuid
from . import db  


roles_users = db.Table(
    'roles_users',
    db.Column('user_id', db.Integer(), db.ForeignKey('user.id')),
    db.Column('role_id', db.Integer(), db.ForeignKey('role.id'))
)


class Role(db.Model, RoleMixin):
    id = db.Column(db.Integer(), primary_key=True)
    name = db.Column(db.String(80), unique=True)
    description = db.Column(db.String(255))

    def __repr__(self):
        return f"<Role {self.name}>"



class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    active = db.Column(db.Boolean(), default=True)
    fs_uniquifier = db.Column(db.String(64), unique=True, nullable=False, default=lambda: str(uuid.uuid4()))

  
    confirmed_at = db.Column(db.DateTime())
    last_login_at = db.Column(db.DateTime())
    current_login_at = db.Column(db.DateTime())
    last_login_ip = db.Column(db.String(100))
    current_login_ip = db.Column(db.String(100))
    login_count = db.Column(db.Integer)


    roles = db.relationship('Role', secondary=roles_users, backref=db.backref('users', lazy='dynamic'))
    tasks = db.relationship('Task', backref='user', lazy=True, cascade="all, delete-orphan")
    logs = db.relationship('AnalyticsLog', backref='task', cascade="all, delete", passive_deletes=True)


    def __repr__(self):
        return f"<User {self.email}>"


class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    deadline = db.Column(db.String(20))  # Renamed from due_date for clarity
    priority = db.Column(db.String(20))  # High, Medium, Low
    category = db.Column(db.String(100))
    is_completed = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)


    subtasks = db.relationship('Subtask', backref='task', lazy=True, cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Task {self.title}>"

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "deadline": self.deadline,
            "priority": self.priority,
            "category": self.category,
            "is_completed": self.is_completed,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "user_id": self.user_id
        }

class Subtask(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    is_done = db.Column(db.Boolean, default=False)

    task_id = db.Column(db.Integer, db.ForeignKey('task.id', ondelete="CASCADE"))


    def __repr__(self):
        return f"<Subtask {self.title}>"

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "is_done": self.is_done,
            "task_id": self.task_id
        }


class AnalyticsLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    task_id = db.Column(db.Integer, db.ForeignKey('task.id', ondelete="CASCADE"))


    action_type = db.Column(db.String(50))
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)


    start_time = db.Column(db.DateTime)
    end_time = db.Column(db.DateTime)
    duration_minutes = db.Column(db.Float)

    def __repr__(self):
        return f"<Log {self.action_type} by User {self.user_id}>"

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "task_id": self.task_id,
            "action_type": self.action_type,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "start_time": self.start_time.isoformat() if self.start_time else None,
            "end_time": self.end_time.isoformat() if self.end_time else None,
            "duration_minutes": self.duration_minutes
        }
