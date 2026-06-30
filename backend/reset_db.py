from app import create_app
from app.models import db

def reset_database():
    app = create_app()
    with app.app_context():
        print("Dropping all tables...")
        db.drop_all()
        print("Creating all tables in PostgreSQL...")
        db.create_all()
        print("Database schema successfully created!")

if __name__ == '__main__':
    reset_database()
