from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token, set_access_cookies, jwt_required, get_jwt_identity, unset_jwt_cookies
import bcrypt
import logging
import json

from app.decorators import roles_required


logging.basicConfig(level=logging.ERROR)

auth = Blueprint('auth', __name__)

def any_users_exist():
    try:
        conn = current_app.get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT COUNT(*) as count FROM users")
        result = cursor.fetchone()
        return result['count'] > 0
    except Exception as e:
        logging.error(f"Error checking if any users exist: {e}")
        return False
    
def create_default_admin():
    try:
        conn = current_app.get_db()
        cursor = conn.cursor(dictionary=True)
        hashed_password = bcrypt.hashpw("adminpassword".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        cursor.execute("INSERT INTO users (name, email, password, role) VALUES (%s, %s, %s, %s)", 
                       ("Admin", "admin@membermanagementapp.com", hashed_password, "Admin"))
        conn.commit()
        cursor.close()
        logging.info("Default admin user created")
    except Exception as e:
        logging.error(f"Error creating default admin user: {e}")

def user_exists(email):
    try:
        conn = current_app.get_db()
        cursor = conn.cursor(dictionary=True)

        query = "SELECT email FROM users WHERE email=%s"
        cursor.execute(query, (email,))
        result = cursor.fetchone()
        return result is not None
    except Exception as e:
        logging.error(f"Error checking if user exists: {e}")
        return False


@auth.route('/api/login', methods=['POST'])
def login():
    try:
        email = request.json.get('email', None)
        password = request.json.get('password', None)

        if not email or not password:
            return jsonify({'status': 'error', 'message': 'Missing email or password'}), 400

        conn = current_app.get_db()
        cursor = conn.cursor(dictionary=True)
        query = "SELECT password, role FROM users WHERE email=%s"
        cursor.execute(query, (email,))
        user = cursor.fetchone()
        cursor.close()

        if user and bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
            identity = json.dumps({'email': email, 'role': user['role']})
            access_token = create_access_token(identity=identity)
            response = jsonify({'status': 'success', 'message': 'Login successful', 'role': user['role']})
            set_access_cookies(response, access_token)
            return response, 200
        else:
            return jsonify({'status': 'error', 'message': 'Invalid email or password'}), 401
    except Exception as e:
        logging.error(f"Error during login: {e}")
   
   
        return jsonify({'status': 'error', 'message': 'An error occurred during login.', 'code': 'LOGIN_ERROR'}), 500
@auth.route('/api/dashboard/register', methods=['POST'])
@jwt_required()
@roles_required('Admin')
def register():
    try:
        data = request.get_json()
        name = data.get("name")
        email = data.get('email').lower()
        password = data.get('password')
        role = data.get('role')

        if user_exists(email):
            return jsonify({'status': 'error', 'message': 'User already has access'}), 400
        else:
            conn = current_app.get_db()
            cursor = conn.cursor(dictionary=True)
            hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            cursor.execute("INSERT INTO users (name, email, password, role) VALUES (%s, %s, %s, %s)", (name, email, hashed_password, role))
            conn.commit()
            return jsonify({'status': 'success', 'message': 'User registered'}), 201
    except Exception as e:
        logging.error(f"Error during signup: {e}")
        return jsonify({'status': 'error', 'message': 'An error occurred during registering.', 'code': 'REGISTER_ERROR'}), 500

@auth.route('/api/check_token', methods=['GET'])
@jwt_required()
def check_token():
    return jsonify({'status': 'success', 'message': 'Token is valid'}), 200

@auth.route('/api/logout', methods=['POST'])
def logout():
    response = jsonify({'status': 'success', 'message': 'logout successful'})
    unset_jwt_cookies(response)
    return response, 200