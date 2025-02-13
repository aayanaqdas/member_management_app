import logging
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
import mysql.connector
from mysql.connector.errors import IntegrityError
from .decorators import roles_required

api = Blueprint('api_blueprint', __name__)

#Users that cant be deleted through dashboard
UNTOUCHABLE_USERS = ["test@test.no", "test1@test1.no"]

@api.route('/api/members', methods=['GET'])
@jwt_required()
@roles_required('Admin', 'Editor', 'Guest')
def get_members():
    try:
        current_user = get_jwt_identity()
        logging.info(f"Current user: {current_user}")
        conn = current_app.get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM members")
        rows = cursor.fetchall()
        cursor.close()

        members = []
        for row in rows:
            members.append({
                'id': row['id'],
                'name': row['name'],
                'email': row['email'],
                'number': row['number'],
                'address': row['address'],
                'department': row['department'],
                'paid': bool(row['paid']),
                'comment': row['comment']
            })

        return jsonify({'status': 'success', 'message': 'retrieved members', 'members': members}), 200
    except Exception as e:
        logging.error(f"Error retrieving members: {e}")
        return jsonify({'status': 'error', 'message': 'failed to retrieve members', 'error': str(e)}), 500
    
@api.route('/api/add_member', methods=['POST'])
@jwt_required()
@roles_required('Admin', 'Editor')
def add_member():
    try:
        data = request.get_json()
        name = data.get('name')
        email = data.get('email') if data.get('email') else None
        number = data.get('number')
        address = data.get('address')
        department = data.get('department')
        paid = int(data.get('paid'))
        comment = data.get('comment')

        conn = current_app.get_db()
        cursor = conn.cursor()
        cursor.execute("INSERT INTO members (name, email, number, address, department, paid, comment) VALUES (%s, %s, %s, %s, %s, %s, %s)", (name, email, number, address, department, paid, comment))
        conn.commit()
        cursor.close()

        return jsonify({'status': 'success', 'message': 'Member added'}), 201
    except IntegrityError as e:
        if e.errno == mysql.connector.errorcode.ER_DUP_ENTRY:
            return jsonify({'status': 'error', 'message': 'Members already exists in the department', 'error': str(e)}), 409
        else:
            return jsonify({'status': 'error', 'message': 'Database error', 'error': str(e)}), 500
    except Exception as e:
        return jsonify({'status': 'error', 'message': 'Failed to add member', 'error': str(e)}), 500
    

@api.route('/api/delete_members', methods=['DELETE'])
@jwt_required()
@roles_required('Admin', 'Editor')
def delete_members():
    try:
        data = request.get_json()
        member_ids = data.get('ids')

        if not member_ids:
            return jsonify({'status': 'error', 'message': 'No member IDs provided'}), 400

        conn = current_app.get_db()
        cursor = conn.cursor()
        format_strings = ','.join(['%s'] * len(member_ids))
        cursor.execute(f"DELETE FROM members WHERE id IN ({format_strings})", tuple(member_ids))
        conn.commit()
        cursor.close()

        return jsonify({'status': 'success', 'message': 'Member(s) deleted'}), 201
    except Exception as e:
        return jsonify({'status': 'error', 'message': 'Failed to delete members', 'error': str(e)}), 500   


@api.route('/api/filter_table', methods=['POST'])
@jwt_required()
@roles_required('Admin', 'Editor', 'Guest')
def filter_members():
    try:
        data = request.get_json()
        search = data.get('search', '').lower()
        department = data.get('department', '').lower()
        filter_type = data.get('filter', 'all').lower()
        paid_status = data.get('paid', '').lower()

        query = "SELECT * FROM members WHERE 1=1"
        params = []

        if department:
            query += " AND LOWER(department) = %s"
            params.append(department)
        
        if paid_status:
            query += " AND LOWER(paid) = %s"
            params.append('1' if paid_status == 'paid' else '0')

        if filter_type != 'all':
            if filter_type == 'name':
                query += " AND LOWER(name) LIKE %s"
                params.append(f"%{search}%")
            elif filter_type == 'email':
                query += " AND LOWER(email) LIKE %s"
                params.append(f"%{search}%")
            elif filter_type == 'number':
                query += " AND LOWER(number) LIKE %s"
                params.append(f"%{search}%")
        else:
            query += " AND (LOWER(name) LIKE %s OR LOWER(email) LIKE %s OR LOWER(number) LIKE %s)"
            params.extend([f"%{search}%", f"%{search}%", f"%{search}%"])

        conn = current_app.get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(query, tuple(params))
        rows = cursor.fetchall()
        cursor.close()

        members = []
        for row in rows:
            members.append({
                'id': row['id'],
                'name': row['name'],
                'email': row['email'],
                'number': row['number'],
                'address': row['address'],
                'department': row['department'],
                'paid': bool(row['paid']),  # Convert 1/0 to True/False
                'comment': row['comment']
            })

        return jsonify({'status': 'success', 'message': 'Filter success', 'filtered_members': members}), 200
    except Exception as e:
        return jsonify({'status': 'error', 'message': 'Failed to filter table', 'error': str(e)}), 500
    

@api.route('/api/member_info', methods=['POST'])
@jwt_required()
@roles_required('Admin', 'Editor')
def get_member_info():
    try:
        data = request.get_json()
        member_id = data.get('memberId')
        
        conn = current_app.get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM members WHERE id = (%s)", (member_id,))
        row = cursor.fetchone()
        cursor.close()

        member_info = {
                'id': row['id'],
                'name': row['name'],
                'email': row['email'],
                'number': row['number'],
                'address': row['address'],
                'department': row['department'],
                'paid': bool(row['paid']),  # Convert 1/0 to True/False
                'comment': row['comment']
        }

        return jsonify({'status': 'success', 'message': 'Retrieved member info', 'memberInfo': member_info}), 200
    except Exception as e:
        return jsonify({'status': 'error', 'message': 'Failed to retrieve member info', 'error': str(e)}), 500

@api.route('/api/update_member_info', methods=['PUT'])
@jwt_required()
@roles_required('Admin', 'Editor')
def update_member_info():
    try:
        data = request.get_json()
        member_id = data.get('id')
        name = data.get('name')
        email = data.get('email') if data.get('email') else None
        number = data.get('number')
        address = data.get('address')
        department = data.get('department')
        paid = int(data.get('paid'))
        comment = data.get('comment')

        conn = current_app.get_db()
        cursor = conn.cursor()
        cursor.execute("UPDATE members SET name = %s, email = %s, number = %s, address = %s, department = %s, paid = %s, comment = %s WHERE id = %s", (name, email, number, address, department, paid, comment, member_id))
        conn.commit()
        cursor.close()

        return jsonify({'status': 'success', 'message': 'Updated member info'}), 201
    except IntegrityError as e:
        if e.errno == mysql.connector.errorcode.ER_DUP_ENTRY:
            return jsonify({'status': 'error', 'message': 'Member already exists in this department', 'error': str(e)}), 409
        else:
            return jsonify({'status': 'error', 'message': 'Database error', 'error': str(e)}), 500
    except Exception as e:
        return jsonify({'status': 'error', 'message': 'Failed to update member', 'error': str(e)}), 500


@api.route('/api/dashboard/users', methods=['GET'])
@jwt_required()
@roles_required('Admin')
def admin_dashboard_route():
    try:
        conn = current_app.get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM users")
        rows = cursor.fetchall()
        cursor.close()

        users = []
        for row in rows:
            users.append({
                'id': row['user_id'],
                'name': row['name'],
                'email': row['email'],
                'role': row['role'],
                'untouchable': row['email'] in UNTOUCHABLE_USERS
            })

        return jsonify({'status': 'success', 'message': 'Retrieved users', 'users': users}), 200
    except Exception as e:
        logging.error(f"Error retrieving members: {e}")
        return jsonify({'status': 'error', 'message': 'Failed to retrieve users', 'error': str(e)}), 500
    

@api.route('/api/dashboard/users/change_role', methods=['PUT'])
@jwt_required()
@roles_required('Admin')
def change_user_role():
    try:
        data = request.get_json()
        user_id = data.get('userId')
        role = data.get('role')

        conn = current_app.get_db()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT email FROM users WHERE user_id = %s", (user_id,))
        user = cursor.fetchone()
        if user['email'] in UNTOUCHABLE_USERS:
            return jsonify({'status': 'error', 'message': 'Cannot change the role of this user'}), 403
        
        cursor.execute("UPDATE users SET role = %s WHERE user_id = %s", (role, user_id))
        conn.commit()
        cursor.close()

        return jsonify({'status': 'success', 'message': 'User role updated'}), 201
    except Exception as e:
        return jsonify({'status': 'error', 'message': 'Failed to update user role', 'error': str(e)}), 500
    

@api.route('/api/dashboard/users/delete', methods=['DELETE'])
@jwt_required()
@roles_required('Admin')
def delete_user():
    try:
        data = request.get_json()
        user_id = data.get('userId')

        if not user_id:
            return jsonify({'status': 'error', 'message': 'No user ID provided'}), 400

        conn = current_app.get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT email FROM users WHERE user_id = %s", (user_id,))
        user = cursor.fetchone()
        if user['email'] in UNTOUCHABLE_USERS:
            return jsonify({'status': 'error', 'message': 'Cannot delete this user'}), 403

        cursor.execute("DELETE FROM users WHERE user_id = %s", (user_id,))
        conn.commit()
        cursor.close()

        return jsonify({'status': 'success', 'message': 'User deleted'}), 200
    except Exception as e:
        return jsonify({'status': 'error', 'message': 'Failed to delete user', 'error': str(e)}), 500   
