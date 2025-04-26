from flask import Blueprint, render_template

help_tips_bp = Blueprint('help_tips', __name__)


@help_tips_bp.route('/help_tips')
def help_tips_page():
    return render_template('health_tips.html') 