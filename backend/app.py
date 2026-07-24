import os
import json
from flask import Flask, request, jsonify, send_file
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.utils import secure_filename
import io

app = Flask(__name__)
CORS(app)

base_dir = os.path.abspath(os.path.dirname(__name__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(base_dir, 'app.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Models
class User(db.Model):
    id = db.Column(db.String(50), primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    passwordHash = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(20), nullable=False)
    fullName = db.Column(db.String(100), nullable=False)

class StudioSettings(db.Model):
    id = db.Column(db.String(50), primary_key=True)
    studioName = db.Column(db.String(100))
    street = db.Column(db.String(100))
    zipCode = db.Column(db.String(20))
    city = db.Column(db.String(50))
    ownerName = db.Column(db.String(100))
    email = db.Column(db.String(100))
    phone = db.Column(db.String(50))
    taxNumber = db.Column(db.String(50))
    artists = db.Column(db.JSON)

class ConsentForm(db.Model):
    id = db.Column(db.String(50), primary_key=True)
    submittedAt = db.Column(db.String(50))
    clientData = db.Column(db.JSON)
    tattooDetails = db.Column(db.JSON)
    healthQuestions = db.Column(db.JSON)
    ipAddress = db.Column(db.String(50))
    deviceInfo = db.Column(db.String(200))
    isGdprAccepted = db.Column(db.Boolean)
    isWaiverAccepted = db.Column(db.Boolean)
    isCareInstructionsAccepted = db.Column(db.Boolean)
    pdfBlobId = db.Column(db.String(50))

class PdfDocument(db.Model):
    id = db.Column(db.String(50), primary_key=True)
    blob = db.Column(db.LargeBinary)
    createdAt = db.Column(db.String(50))

def init_db():
    with app.app_context():
        db.create_all()
        # Create default admin if not exists
        if not User.query.filter_by(id='admin_user').first():
            admin = User(
                id='admin_user',
                username='admin',
                passwordHash='admin123',
                role='ADMIN',
                fullName='Studio Administrator'
            )
            db.session.add(admin)
        
        # Create default settings if not exists
        if not StudioSettings.query.filter_by(id='studio_settings').first():
            settings = StudioSettings(
                id='studio_settings',
                studioName='Siyah Tattoos',
                street='Torstraße 104',
                zipCode='10119',
                city='Berlin',
                ownerName='Can Siyah',
                email='hello@siyahtattoos.com',
                phone='030 2489370',
                taxNumber='DE987654321',
                artists=['Can Siyah', 'Elif Demir (Dark Art)', 'Marek Weber (Blackwork)', 'Guest Artist']
            )
            db.session.add(settings)
        
        db.session.commit()

# --- API Endpoints ---

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username', '').strip()
    password = data.get('password', '')
    user = User.query.filter_by(username=username, passwordHash=password).first()
    if user:
        return jsonify({
            'id': user.id,
            'username': user.username,
            'role': user.role,
            'fullName': user.fullName
        }), 200
    return jsonify({'error': 'Invalid credentials'}), 401

@app.route('/api/change_credentials', methods=['POST'])
def change_credentials():
    data = request.json
    current_username = data.get('currentUsername', '').strip()
    current_password = data.get('currentPassword', '')
    new_username = data.get('newUsername', '').strip()
    new_password = data.get('newPassword', '')
    
    user = User.query.filter_by(username=current_username).first()
    if not user or user.passwordHash != current_password:
        return jsonify({'error': 'Invalid current credentials'}), 401
        
    if new_username != current_username:
        existing = User.query.filter_by(username=new_username).first()
        if existing:
            return jsonify({'error': 'Username already taken'}), 409
            
    user.username = new_username
    user.passwordHash = new_password
    db.session.commit()
    
    return jsonify({
        'id': user.id,
        'username': user.username,
        'role': user.role,
        'fullName': user.fullName
    }), 200


@app.route('/api/settings', methods=['GET', 'POST'])
def handle_settings():
    if request.method == 'GET':
        settings = StudioSettings.query.filter_by(id='studio_settings').first()
        if not settings:
            return jsonify({}), 404
        return jsonify({
            'id': settings.id,
            'studioName': settings.studioName,
            'street': settings.street,
            'zipCode': settings.zipCode,
            'city': settings.city,
            'ownerName': settings.ownerName,
            'email': settings.email,
            'phone': settings.phone,
            'taxNumber': settings.taxNumber,
            'artists': settings.artists
        }), 200
    else:
        data = request.json
        settings = StudioSettings.query.filter_by(id='studio_settings').first()
        if settings:
            for key, value in data.items():
                if hasattr(settings, key):
                    setattr(settings, key, value)
        else:
            settings = StudioSettings(**data)
            settings.id = 'studio_settings'
            db.session.add(settings)
        db.session.commit()
        return jsonify({'success': True}), 200

@app.route('/api/forms', methods=['GET', 'POST'])
def handle_forms():
    if request.method == 'GET':
        forms = ConsentForm.query.order_by(ConsentForm.submittedAt.desc()).all()
        result = []
        for form in forms:
            result.append({
                'id': form.id,
                'submittedAt': form.submittedAt,
                'clientData': form.clientData,
                'tattooDetails': form.tattooDetails,
                'healthQuestions': form.healthQuestions,
                'ipAddress': form.ipAddress,
                'deviceInfo': form.deviceInfo,
                'isGdprAccepted': form.isGdprAccepted,
                'isWaiverAccepted': form.isWaiverAccepted,
                'isCareInstructionsAccepted': form.isCareInstructionsAccepted,
                'pdfBlobId': form.pdfBlobId
            })
        return jsonify(result), 200
    else:
        data = request.json
        form = ConsentForm(
            id=data.get('id'),
            submittedAt=data.get('submittedAt'),
            clientData=data.get('clientData'),
            tattooDetails=data.get('tattooDetails'),
            healthQuestions=data.get('healthQuestions'),
            ipAddress=data.get('ipAddress'),
            deviceInfo=data.get('deviceInfo'),
            isGdprAccepted=data.get('isGdprAccepted'),
            isWaiverAccepted=data.get('isWaiverAccepted'),
            isCareInstructionsAccepted=data.get('isCareInstructionsAccepted'),
            pdfBlobId=data.get('pdfBlobId')
        )
        db.session.add(form)
        db.session.commit()
        return jsonify({'success': True}), 201

@app.route('/api/forms/<form_id>', methods=['DELETE'])
def delete_form(form_id):
    form = ConsentForm.query.get(form_id)
    if form:
        db.session.delete(form)
        db.session.commit()
    return jsonify({'success': True}), 200

@app.route('/api/pdfs/<pdf_id>', methods=['GET', 'POST', 'DELETE'])
def handle_pdfs(pdf_id):
    if request.method == 'POST':
        file = request.files.get('file')
        if not file:
            return jsonify({'error': 'No file uploaded'}), 400
        created_at = request.form.get('createdAt')
        
        pdf = PdfDocument(
            id=pdf_id,
            blob=file.read(),
            createdAt=created_at
        )
        db.session.add(pdf)
        db.session.commit()
        return jsonify({'success': True}), 201
        
    elif request.method == 'GET':
        pdf = PdfDocument.query.get(pdf_id)
        if not pdf:
            return jsonify({'error': 'Not found'}), 404
        return send_file(
            io.BytesIO(pdf.blob),
            mimetype='application/pdf',
            as_attachment=True,
            download_name=f'{pdf_id}.pdf'
        )
        
    elif request.method == 'DELETE':
        pdf = PdfDocument.query.get(pdf_id)
        if pdf:
            db.session.delete(pdf)
            db.session.commit()
        return jsonify({'success': True}), 200

if __name__ == '__main__':
    init_db()
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
else:
    # Called by gunicorn — initialize DB at import time
    init_db()

