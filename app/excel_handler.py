import io
import logging
import pandas as pd
from flask import Blueprint, request, jsonify, current_app, send_file
from flask_jwt_extended import jwt_required
from app.decorators import roles_required

excel_handler = Blueprint('excel_handler', __name__)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@excel_handler.route('/api/import_members', methods=['POST'])
@jwt_required()
@roles_required('Admin', 'Editor')
def import_members():
    try:
        file = request.files['file']
        department = request.form.get('department')
        replace_option = request.form.get('replace_option')
        df = pd.read_excel(file)

        # Check for required columns
        required_columns = ['name', 'email', 'address', 'number', 'paid']
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            return jsonify({'status': 'error', 'message': f'Missing columns in the Excel file: {", ".join(missing_columns)}'}), 400

        # Convert 'paid' column to boolean
        df['paid'] = df['paid'].str.strip().str.lower().map({'yes': 1, 'no': 0})

        # Fill NaN values with empty strings or appropriate default values
        df.fillna({
            'name': '',
            'email': '',
            'address': '',
            'number': '',
            'paid': 0
        }, inplace=True)

        conn = current_app.get_db()
        cursor = conn.cursor()

        if replace_option == 'replace_all':
            cursor.execute("DELETE FROM members")

        # Batch processing
        batch_size = 100
        total_rows = len(df)
        logger.info(f"Total rows to process: {total_rows}")

        for start in range(0, total_rows, batch_size):
            batch = df.iloc[start:start + batch_size]
            logger.info(f"Processing batch from row {start} to {start + len(batch)}")
            for _, row in batch.iterrows():
                try:
                    cursor.execute(
                        "INSERT INTO members (name, email, number, address, department, paid, comment) VALUES (%s, %s, %s, %s, %s, %s, %s) "
                        "ON DUPLICATE KEY UPDATE name=VALUES(name), email=VALUES(email), number=VALUES(number), address=VALUES(address), department=VALUES(department), paid=VALUES(paid), comment=VALUES(comment)",
                        (row['name'], row['email'], row['number'], row['address'], department, row['paid'], '') #Department doesnt have to be in the excel file because you select it in the website when importing
                    )
                except Exception as e:
                    logger.error(f"Failed to insert row: {row.to_dict()}, error: {str(e)}")

        conn.commit()
        cursor.close()

        return jsonify({'status': 'success', 'message': 'Members imported successfully'}), 201
    except Exception as e:
        logger.error(f"Failed to import members: {str(e)}")
        return jsonify({'status': 'error', 'message': 'Failed to import members', 'error': str(e)}), 500

@excel_handler.route('/api/export_members', methods=['GET'])
@jwt_required()
@roles_required('Admin', 'Editor')
def export_members():
    try:
        conn = current_app.get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT name, email, address, number, department, paid, comment FROM members")
        rows = cursor.fetchall()
        cursor.close()
        if not rows:
            return jsonify({'status': 'error', 'message': 'No members found'}), 404
        
        df = pd.DataFrame(rows)
        df['paid'] = df['paid'].map({1: 'Yes', 0: 'No'})
        output = io.BytesIO()
        writer = pd.ExcelWriter(output, engine='openpyxl')
        df.to_excel(writer, index=False, sheet_name='Members')
        writer.close()  # Correct method to save the Excel file
        output.seek(0)

        return send_file(output, download_name='members.xlsx', as_attachment=True)
    except Exception as e:
        logger.error(f"Failed to export members: {str(e)}")
        return jsonify({'status': 'error', 'message': 'Failed to export members', 'error': str(e)}), 500
