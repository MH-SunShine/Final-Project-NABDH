# app/__init__.py
from flask import Flask


def create_app():
    app = Flask(__name__)
    # Initialize configurations, extensions, and blueprints here
    return app
