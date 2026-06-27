from app import create_app
from app.models import db, Doctor

app = create_app()

# Seed database with sample doctors if empty
with app.app_context():
    if Doctor.query.count() == 0:
        seed_doctors = [
            # Priority 1
            Doctor(name="Aiko", priority=1),
            Doctor(name="Manjunath", priority=1),
            Doctor(name="Mareena", priority=1),
            Doctor(name="Ravikiran", priority=1),
            Doctor(name="Sainath", priority=1),
            Doctor(name="Srivas", priority=1),
            # Priority 2
            Doctor(name="Amita", priority=2),
            Doctor(name="Anup", priority=2),
            Doctor(name="Arjun", priority=2),
            Doctor(name="Ashith", priority=2),
            Doctor(name="Pavan", priority=2),
            Doctor(name="Ramesh", priority=2),
            Doctor(name="Sinju", priority=2),
            # Priority 3
            Doctor(name="Arun", priority=3),
            Doctor(name="Parvathy", priority=3),
            Doctor(name="Shrish", priority=3),
            Doctor(name="Siddarth", priority=3),
            Doctor(name="Varun", priority=3),
            Doctor(name="Vinay", priority=3),
            Doctor(name="Vishal", priority=3),
        ]
        db.session.bulk_save_objects(seed_doctors)
        db.session.commit()
        print("Database seeded with sample doctors!")

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)
