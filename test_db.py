from run import create_app  # or wherever your create_app function is
from app import db
from sqlalchemy import text  # Import the text() function

# Create the app context
app = create_app()

with app.app_context():
    try:
        # Test the connection by executing a simple query
        db.session.execute(text('SELECT 1'))  # Use text() to wrap raw SQL
        print("✅ Connected to the database!")
    except Exception as e:
        print("❌ Not connected:", e)
