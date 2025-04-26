from flask import Flask, render_template
from flask_sqlalchemy import SQLAlchemy
from flask_marshmallow import Marshmallow
from flask_jwt_extended import JWTManager
from datetime import timedelta
from flask_cors import CORS

db = SQLAlchemy()
ma = Marshmallow()
jwt = JWTManager()


def create_app():
    # app instance initialization
    app = Flask(__name__, 
                template_folder='../templates',
                static_folder='../static',
                static_url_path='/static')
    # load configurations
    app.config.from_object('config.Config')
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(minutes=30)
    app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0  # Disable caching during development
    app.config['JWT_TOKEN_LOCATION'] = ['headers']
    app.config['JWT_HEADER_NAME'] = 'Authorization'
    app.config['JWT_HEADER_TYPE'] = 'Bearer'
    app.config['JWT_ERROR_MESSAGE_KEY'] = 'error'
    
    # Enable CORS with proper headers
    CORS(app, resources={
        r"/*": {
            "origins": "*",
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "expose_headers": ["Authorization"]
        }
    })
    
    # initialize extensions
    db.init_app(app)
    ma.init_app(app)
    jwt.init_app(app)

    @jwt.user_identity_loader
    def user_identity_lookup(user):
        return str(user)

    @jwt.user_lookup_loader
    def user_lookup_callback(_jwt_header, jwt_data):
        identity = jwt_data["sub"]
        return identity

    # start
    @app.route('/')
    def index():
        return render_template('index.html')

    @app.route('/test-static')
    def test_static():
        return app.send_static_file('css/dashboardlaboratory.css')

    # Blueprints
    from app.routes.patient import patient_bp
    app.register_blueprint(patient_bp, url_prefix='/patient')

    from app.routes.doctor import doctor_bp
    app.register_blueprint(doctor_bp, url_prefix='/doctor')

    from app.routes.lab_staff import lab_staff_bp
    app.register_blueprint(lab_staff_bp, url_prefix='/lab')

    from app.routes.patient import protected_bp
    app.register_blueprint(protected_bp)

    # Register new blueprints
    # from app.routes.auth import auth_bp
    # app.register_blueprint(auth_bp, url_prefix='/auth')

    from app.routes.help import help_bp
    app.register_blueprint(help_bp)

    from app.routes.health_tips import help_tips_bp
    app.register_blueprint(help_tips_bp)

    # Add a route to serve static files directly
    @app.route('/static/<path:filename>')
    def serve_static(filename):
        return app.send_static_file(filename)

    return app
