from functools import wraps
from flask import request, jsonify
from flask_jwt_extended import get_jwt_identity
import json

def roles_required(*required_roles):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            current_user = get_jwt_identity()
            if isinstance(current_user, str):
                current_user = json.loads(current_user)  # Parse the JSON string back into a dictionary
            if current_user['role'] not in required_roles:
                return jsonify({'status': 'error', 'message': 'Access forbidden: You do not have permission to perform this action'}), 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator