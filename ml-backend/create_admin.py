
from datetime import datetime, timezone
from getpass import getpass

from auth import connect_db, password_hasher

print("=== HealthCare+ Admin Account Setup ===")

full_name = input("Enter admin name: ").strip()
email = input("Enter admin email: ").strip().lower()
password = getpass("Create admin password (minimum 12 characters): ")
confirm_password = getpass("Confirm admin password: ")

if len(full_name) < 2:
    print("Name must contain at least 2 characters.")
elif "@" not in email:
    print("Please enter a valid email address.")
elif len(password) < 12:
    print("Password must contain at least 12 characters.")
elif password != confirm_password:
    print("Passwords do not match.")
else:
    try:
        password_hash = password_hasher.hash(password)

        with connect_db() as db:
            db.execute(
                """
                INSERT INTO admins
                (full_name, email, password_hash, created_at)
                VALUES (?, ?, ?, ?)
                """,
                (
                    full_name,
                    email,
                    password_hash,
                    datetime.now(timezone.utc).isoformat(),
                ),
            )

        print("Admin account created successfully!")

    except Exception as error:
        print("Admin account could not be created:", error)
from getpass import getpass

email = input("Enter admin email to verify: ").strip().lower()
password = getpass("Enter admin password to verify: ")

with connect_db() as db:
    admin = db.execute(
        "SELECT * FROM admins WHERE email = ?",
        (email,)
    ).fetchone()

if admin is None:
    print("Admin account NOT FOUND.")
else:
    print("Admin account FOUND.")

    if password_hasher.verify(password, admin["password_hash"]):
        print("Password is CORRECT.")
    else:
        print("Password is INCORRECT.")
with connect_db() as db:
    existing_user = db.execute(
        "SELECT id, role FROM users WHERE email = ?",
        ("alluharika2007@gmail.com",)
    ).fetchone()

if existing_user:
    print("Same email also exists in users table.")
    print("Role:", existing_user["role"])
else:
    print("No email conflict in users table.")