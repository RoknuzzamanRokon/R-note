"""Create a login user, or reset the password of an existing one.

    python create_user.py                       (asks for username and password)
    python create_user.py --username rokon      (asks for password)
    python create_user.py --username rokon --password secret
    python create_user.py --username guest --not-superuser
"""

import argparse
import getpass
import sys

from sqlalchemy import select

from app.database import SessionLocal, create_tables
from app.models import User, new_id, utcnow
from app.security import hash_password


def main() -> None:
    parser = argparse.ArgumentParser(description="Create or update a login user")
    parser.add_argument("--username")
    parser.add_argument("--password")
    parser.add_argument(
        "--not-superuser",
        action="store_true",
        help="user can log in but cannot read private posts or write",
    )
    args = parser.parse_args()

    username = (args.username or input("Username: ")).strip()
    if not username:
        sys.exit("Username is required")

    password = args.password
    if password is None:
        password = getpass.getpass("Password: ")
        if password != getpass.getpass("Repeat password: "):
            sys.exit("Passwords do not match")
    if len(password) < 6:
        sys.exit("Password must be at least 6 characters")

    try:
        password_hash = hash_password(password)
    except ValueError as e:
        sys.exit(str(e))

    create_tables()
    with SessionLocal() as db:
        user = db.scalar(select(User).where(User.username == username))
        if user:
            user.password_hash = password_hash
            user.is_superuser = not args.not_superuser
            user.is_active = True
            action = "updated (password reset)"
        else:
            user = User(
                id=new_id(),
                username=username,
                password_hash=password_hash,
                is_superuser=not args.not_superuser,
                is_active=True,
                created_at=utcnow(),
            )
            db.add(user)
            action = "created"
        db.commit()

    role = "superuser" if not args.not_superuser else "normal user"
    print(f'User "{username}" {action} ({role}).')


if __name__ == "__main__":
    main()
