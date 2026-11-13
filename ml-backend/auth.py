
import os
import sqlite3
import secrets
from pathlib import Path
from datetime import datetime, timedelta, timezone

import jwt
from pwdlib import PasswordHash
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field, EmailStr

# Files are stored beside app.py
BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "accounts.db"
SECRET_PATH = BASE_DIR / "auth_secret.txt"

# Generate a persistent random signing secret for local development.
# Keep auth_secret.txt private and never upload it publicly.
if not SECRET_PATH.exists():
    SECRET_PATH.write_text(secrets.token_urlsafe(48), encoding="utf-8")

SECRET_KEY = SECRET_PATH.read_text(encoding="utf-8").strip()
ALGORITHM = "HS256"
TOKEN_MINUTES = 30

password_hasher = PasswordHash.recommended()
bearer = HTTPBearer()
router = APIRouter(prefix="/auth", tags=["Authentication"])


def connect_db():
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def initialize_accounts_db():
    with connect_db() as db:
        db.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                full_name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL CHECK(role IN ('patient', 'doctor')),
                doctor_status TEXT NOT NULL DEFAULT 'not_applicable',
                created_at TEXT NOT NULL
            )
        """)

        db.execute("""
            CREATE TABLE IF NOT EXISTS admins (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                full_name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
        """)

initialize_accounts_db()
class RegisterRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=12, max_length=128)
    role: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


def public_user(user):
    return {
        "id": user["id"],
        "full_name": user["full_name"],
        "email": user["email"],
        "role": user["role"],
        "doctor_status": user["doctor_status"],
    }

def create_token(user):
    subject = (
        f"admin:{user['id']}"
        if user["role"] == "admin"
        else str(user["id"])
    )

    now = datetime.now(timezone.utc)

    payload = {
        "sub": subject,
        "iat": now,
        "exp": now + timedelta(minutes=TOKEN_MINUTES),
    }

    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)



def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
):
    try:
        payload = jwt.decode(
            credentials.credentials,
            SECRET_KEY,
            algorithms=[ALGORITHM],
        )
        subject = payload["sub"]
    except (jwt.InvalidTokenError, ValueError, KeyError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired login token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    with connect_db() as db:
        # Check whether the token belongs to an admin
        if subject.startswith("admin:"):
            admin_id = int(subject.split(":")[1])

            admin = db.execute(
                "SELECT * FROM admins WHERE id = ?",
                (admin_id,)
            ).fetchone()

            if admin is None:
                raise HTTPException(
                    status_code=401,
                    detail="Admin account not found"
                )

            user = dict(admin)
            user["role"] = "admin"
            user["doctor_status"] = "not_applicable"

            return user

        # Otherwise, check the normal users table
        user_id = int(subject)
        user = db.execute(
            "SELECT * FROM users WHERE id = ?",
            (user_id,),
        ).fetchone()

    if user is None:
        raise HTTPException(status_code=401, detail="Account not found")

    return dict(user)


def require_patient(user=Depends(get_current_user)):
    if user["role"] != "patient":
        raise HTTPException(status_code=403, detail="Patient account required")
    return user


def require_approved_doctor(user=Depends(get_current_user)):
    if user["role"] != "doctor":
        raise HTTPException(status_code=403, detail="Doctor account required")
    if user["doctor_status"] != "approved":
        raise HTTPException(
            status_code=403,
            detail="Doctor account is pending verification",
        )
    return user

def require_admin(user=Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(
            status_code=403,
            detail="Administrator access required"
        )
    return user



@router.post("/register", status_code=201)
def register(data: RegisterRequest):
    role = data.role.strip().lower()

    if role not in ("patient", "doctor"):
        raise HTTPException(status_code=400, detail="Role must be patient or doctor")

    email = str(data.email).strip().lower()
    doctor_status = "pending" if role == "doctor" else "not_applicable"
    password_hash = password_hasher.hash(data.password)

    try:
        with connect_db() as db:
            db.execute(
                """
                INSERT INTO users
                (full_name, email, password_hash, role, doctor_status, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    data.full_name.strip(),
                    email,
                    password_hash,
                    role,
                    doctor_status,
                    datetime.now(timezone.utc).isoformat(),
                ),
            )
            user = db.execute(
                "SELECT * FROM users WHERE email = ?",
                (email,),
            ).fetchone()
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=409, detail="Email is already registered")

    return {
        "message": (
            "Registration successful. Doctor verification is pending."
            if role == "doctor"
            else "Patient registration successful. Please log in."
        ),
        "user": public_user(user),
    }

@router.post("/login")
def login(data: LoginRequest):
    email = str(data.email).strip().lower()

    with connect_db() as db:
        user = db.execute(
            "SELECT * FROM users WHERE email = ?",
            (email,),
        ).fetchone()

        admin = db.execute(
            "SELECT * FROM admins WHERE email = ?",
            (email,),
        ).fetchone()

    # Check admin credentials first
    if admin is not None and password_hasher.verify(
        data.password, admin["password_hash"]
    ):
        user = dict(admin)
        user["role"] = "admin"
        user["doctor_status"] = "not_applicable"

    # Otherwise, check patient or doctor credentials
    elif user is not None and password_hasher.verify(
        data.password, user["password_hash"]
    ):
        user = dict(user)

    else:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    return {
        "access_token": create_token(user),
        "token_type": "bearer",
        "expires_in_minutes": TOKEN_MINUTES,
        "user": public_user(user),
    }




@router.get("/me")
def my_account(user=Depends(get_current_user)):
    return public_user(user)


@router.get("/patient-only")
def patient_account(user=Depends(require_patient)):
    return {"message": "Patient access verified", "user": public_user(user)}


@router.get("/doctor-only")
def doctor_account(user=Depends(require_approved_doctor)):
    return {"message": "Approved doctor access verified", "user": public_user(user)}
@router.get("/admin/doctors")
def get_all_doctors(user=Depends(require_admin)):
    with connect_db() as db:
        doctors = db.execute(
            """
            SELECT id, full_name, email, doctor_status, created_at
            FROM users
            WHERE role = 'doctor'
            ORDER BY created_at DESC
            """
        ).fetchall()

    return {
        "total_doctors": len(doctors),
        "doctors": [dict(doctor) for doctor in doctors]
    }
@router.patch("/admin/doctors/{doctor_id}/approve")
def approve_doctor(
    doctor_id: int,
    user=Depends(require_admin)
):
    with connect_db() as db:
        doctor = db.execute(
            "SELECT * FROM users WHERE id = ? AND role = 'doctor'",
            (doctor_id,)
        ).fetchone()

        if doctor is None:
            raise HTTPException(
                status_code=404,
                detail="Doctor not found"
            )

        db.execute(
            "UPDATE users SET doctor_status = 'approved' WHERE id = ?",
            (doctor_id,)
        )

    return {"message": "Doctor approved successfully"}


@router.patch("/admin/doctors/{doctor_id}/reject")
def reject_doctor(
    doctor_id: int,
    user=Depends(require_admin)
):
    with connect_db() as db:
        doctor = db.execute(
            "SELECT * FROM users WHERE id = ? AND role = 'doctor'",
            (doctor_id,)
        ).fetchone()

        if doctor is None:
            raise HTTPException(
                status_code=404,
                detail="Doctor not found"
            )

        db.execute(
            "UPDATE users SET doctor_status = 'rejected' WHERE id = ?",
            (doctor_id,)
        )

    return {"message": "Doctor rejected successfully"}

@router.get("/doctor/patients")
def get_patients(user=Depends(require_approved_doctor)):
    with connect_db() as db:
        patients = db.execute(
            """
            SELECT id, full_name, email, created_at
            FROM users
            WHERE role = 'patient'
            ORDER BY created_at DESC
            """
        ).fetchall()

    return {
        "total_patients": len(patients),
        "patients": [dict(patient) for patient in patients]
    }
