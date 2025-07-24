from .task_routes import task_bp

def register_routes(app):
    app.register_blueprint(task_bp)
