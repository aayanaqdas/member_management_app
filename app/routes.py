from flask import Blueprint, render_template



routes = Blueprint('routes', __name__)


@routes.route('/')
def index():
    return render_template('login.html')

@routes.route('/login')
def login_page():
    return render_template('login.html')

@routes.route('/memberlist')
def home():
    return render_template('home.html')

@routes.route('/dashboard')
def dashboard():
    return render_template('dashboard.html')