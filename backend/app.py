import os
import io
from flask import Flask, request, jsonify, send_file
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash

# ---------------------------------------------------------------------------
# App & CORS
# ---------------------------------------------------------------------------
app = Flask(__name__)

# Allow requests from any configured frontend origin (set CORS_ORIGINS in Render)
# Example: https://your-site.netlify.app
# Multiple origins: https://your-site.netlify.app,https://your-custom-domain.com
_cors_origins = os.environ.get('CORS_ORIGINS', '*')
CORS(app, origins=_cors_origins.split(',') if ',' in _cors_origins else _cors_origins)

# ---------------------------------------------------------------------------
# Database — PostgreSQL on Render, SQLite for local dev
# ---------------------------------------------------------------------------
_base_dir = os.path.abspath(os.path.dirname(__file__))  # ← was __name__ (bug fix!)
_database_url = os.environ.get(
    'DATABASE_URL',
    f'sqlite:///{os.path.join(_base_dir, "app.db")}'
)
# Render supplies postgres:// but SQLAlchemy requires postgresql://
if _database_url.startswith('postgres://'):
    _database_url = _database_url.replace('postgres://', 'postgresql://', 1)

app.config['SQLALCHEMY_DATABASE_URI'] = _database_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-only-change-in-production')
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16 MB max upload

db = SQLAlchemy(app)

# Admin credentials — always read from environment variables
ADMIN_USERNAME = os.environ.get('ADMIN_USERNAME', 'admin')
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'admin123')

# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------
class User(db.Model):
    id           = db.Column(db.String(50),  primary_key=True)
    username     = db.Column(db.String(50),  unique=True, nullable=False)
    passwordHash = db.Column(db.String(256), nullable=False)   # bcrypt hash
    role         = db.Column(db.String(20),  nullable=False)
    fullName     = db.Column(db.String(100), nullable=False)


class StudioSettings(db.Model):
    id         = db.Column(db.String(50),  primary_key=True)
    studioName = db.Column(db.String(100))
    street     = db.Column(db.String(100))
    zipCode    = db.Column(db.String(20))
    city       = db.Column(db.String(50))
    ownerName  = db.Column(db.String(100))
    email      = db.Column(db.String(100))
    phone      = db.Column(db.String(50))
    taxNumber  = db.Column(db.String(50))
    artists    = db.Column(db.JSON)


class ConsentForm(db.Model):
    id                         = db.Column(db.String(50),  primary_key=True)
    submittedAt                = db.Column(db.String(50))
    clientData                 = db.Column(db.JSON)
    tattooDetails              = db.Column(db.JSON)
    healthQuestions            = db.Column(db.JSON)
    ipAddress                  = db.Column(db.String(50))
    deviceInfo                 = db.Column(db.String(500))
    isGdprAccepted             = db.Column(db.Boolean)
    isWaiverAccepted           = db.Column(db.Boolean)
    isCareInstructionsAccepted = db.Column(db.Boolean)
    pdfBlobId                  = db.Column(db.String(50))


class PdfDocument(db.Model):
    id        = db.Column(db.String(50),    primary_key=True)
    blob      = db.Column(db.LargeBinary)
    createdAt = db.Column(db.String(50))

# ---------------------------------------------------------------------------
# Database initialisation
# ---------------------------------------------------------------------------
def init_db():
    with app.app_context():
        db.create_all()

        # ── Admin user ──────────────────────────────────────────────────────
        # Env vars are the single source of truth for credentials.
        # The password hash is synced on every startup so that updating
        # ADMIN_PASSWORD / ADMIN_USERNAME in Render always takes effect.
        admin = User.query.filter_by(id='admin_user').first()
        if not admin:
            admin = User(
                id='admin_user',
                username=ADMIN_USERNAME,
                passwordHash=generate_password_hash(ADMIN_PASSWORD),
                role='ADMIN',
                fullName='Studio Administrator',
            )
            db.session.add(admin)
        else:
            # Sync from env vars so credential changes in Render are applied on redeploy
            admin.username     = ADMIN_USERNAME
            if not check_password_hash(admin.passwordHash, ADMIN_PASSWORD):
                admin.passwordHash = generate_password_hash(ADMIN_PASSWORD)

        # ── Default studio settings ─────────────────────────────────────────
        if not StudioSettings.query.filter_by(id='studio_settings').first():
            db.session.add(StudioSettings(
                id='studio_settings',
                studioName='Siyah Tattoos',
                street='Torstraße 104',
                zipCode='10119',
                city='Berlin',
                ownerName='Can Siyah',
                email='hello@siyahtattoos.com',
                phone='030 2489370',
                taxNumber='DE987654321',
                artists=['Can Siyah', 'Elif Demir (Dark Art)', 'Marek Weber (Blackwork)', 'Guest Artist'],
            ))

        db.session.commit()

# ---------------------------------------------------------------------------
# Health check — Render uses this to verify the service is up
# ---------------------------------------------------------------------------
@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'service': 'siyah-tattoo-backend'}), 200

# ---------------------------------------------------------------------------
# Auth endpoints
# ---------------------------------------------------------------------------
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json(silent=True) or {}
    username = data.get('username', '').strip()
    password = data.get('password', '')

    user = User.query.filter_by(username=username).first()
    if user and check_password_hash(user.passwordHash, password):
        return jsonify({
            'id':       user.id,
            'username': user.username,
            'role':     user.role,
            'fullName': user.fullName,
        }), 200
    return jsonify({'error': 'Invalid credentials'}), 401


@app.route('/api/change_credentials', methods=['POST'])
def change_credentials():
    data             = request.get_json(silent=True) or {}
    current_username = data.get('currentUsername', '').strip()
    current_password = data.get('currentPassword', '')
    new_username     = data.get('newUsername', '').strip()
    new_password     = data.get('newPassword', '')

    if not new_username or not new_password:
        return jsonify({'error': 'New username and password are required'}), 400

    user = User.query.filter_by(username=current_username).first()
    if not user or not check_password_hash(user.passwordHash, current_password):
        return jsonify({'error': 'Invalid current credentials'}), 401

    if new_username != current_username:
        if User.query.filter_by(username=new_username).first():
            return jsonify({'error': 'Username already taken'}), 409

    user.username     = new_username
    user.passwordHash = generate_password_hash(new_password)
    db.session.commit()

    return jsonify({
        'id':       user.id,
        'username': user.username,
        'role':     user.role,
        'fullName': user.fullName,
    }), 200

# ---------------------------------------------------------------------------
# Studio settings
# ---------------------------------------------------------------------------
@app.route('/api/settings', methods=['GET', 'POST'])
def handle_settings():
    if request.method == 'GET':
        s = StudioSettings.query.filter_by(id='studio_settings').first()
        if not s:
            return jsonify({}), 404
        return jsonify({
            'id':        s.id,
            'studioName': s.studioName,
            'street':    s.street,
            'zipCode':   s.zipCode,
            'city':      s.city,
            'ownerName': s.ownerName,
            'email':     s.email,
            'phone':     s.phone,
            'taxNumber': s.taxNumber,
            'artists':   s.artists,
        }), 200

    data = request.get_json(silent=True) or {}
    s = StudioSettings.query.filter_by(id='studio_settings').first()
    if s:
        for key, value in data.items():
            if hasattr(s, key) and key != 'id':
                setattr(s, key, value)
    else:
        filtered = {k: v for k, v in data.items() if k != 'id'}
        s = StudioSettings(id='studio_settings', **filtered)
        db.session.add(s)
    db.session.commit()
    return jsonify({'success': True}), 200

# ---------------------------------------------------------------------------
# Consent forms
# ---------------------------------------------------------------------------
@app.route('/api/forms', methods=['GET', 'POST'])
def handle_forms():
    if request.method == 'GET':
        forms = ConsentForm.query.order_by(ConsentForm.submittedAt.desc()).all()
        return jsonify([{
            'id':                         f.id,
            'submittedAt':                f.submittedAt,
            'clientData':                 f.clientData,
            'tattooDetails':              f.tattooDetails,
            'healthQuestions':            f.healthQuestions,
            'ipAddress':                  f.ipAddress,
            'deviceInfo':                 f.deviceInfo,
            'isGdprAccepted':             f.isGdprAccepted,
            'isWaiverAccepted':           f.isWaiverAccepted,
            'isCareInstructionsAccepted': f.isCareInstructionsAccepted,
            'pdfBlobId':                  f.pdfBlobId,
        } for f in forms]), 200

    data = request.get_json(silent=True) or {}
    db.session.add(ConsentForm(
        id                         = data.get('id'),
        submittedAt                = data.get('submittedAt'),
        clientData                 = data.get('clientData'),
        tattooDetails              = data.get('tattooDetails'),
        healthQuestions            = data.get('healthQuestions'),
        ipAddress                  = data.get('ipAddress'),
        deviceInfo                 = data.get('deviceInfo'),
        isGdprAccepted             = data.get('isGdprAccepted'),
        isWaiverAccepted           = data.get('isWaiverAccepted'),
        isCareInstructionsAccepted = data.get('isCareInstructionsAccepted'),
        pdfBlobId                  = data.get('pdfBlobId'),
    ))
    db.session.commit()
    return jsonify({'success': True}), 201


@app.route('/api/forms/<form_id>', methods=['DELETE'])
def delete_form(form_id):
    form = db.session.get(ConsentForm, form_id)
    if form:
        db.session.delete(form)
        db.session.commit()
    return jsonify({'success': True}), 200

# ---------------------------------------------------------------------------
# PDF documents
# ---------------------------------------------------------------------------
@app.route('/api/pdfs/<pdf_id>', methods=['GET', 'POST', 'DELETE'])
def handle_pdfs(pdf_id):
    if request.method == 'POST':
        file = request.files.get('file')
        if not file:
            return jsonify({'error': 'No file uploaded'}), 400
        db.session.add(PdfDocument(
            id        = pdf_id,
            blob      = file.read(),
            createdAt = request.form.get('createdAt'),
        ))
        db.session.commit()
        return jsonify({'success': True}), 201

    if request.method == 'GET':
        pdf = db.session.get(PdfDocument, pdf_id)
        if not pdf:
            return jsonify({'error': 'Not found'}), 404
        return send_file(
            io.BytesIO(pdf.blob),
            mimetype='application/pdf',
            as_attachment=True,
            download_name=f'{pdf_id}.pdf',
        )

    # DELETE
    pdf = db.session.get(PdfDocument, pdf_id)
    if pdf:
        db.session.delete(pdf)
        db.session.commit()
    return jsonify({'success': True}), 200

# ---------------------------------------------------------------------------
# Startup
# ---------------------------------------------------------------------------
# init_db() is called regardless of whether we are run via `python app.py`
# or via gunicorn, so the database is always ready when the first request arrives.
init_db()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
