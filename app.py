import os
import pandas as pd
from sqlalchemy import create_engine, text
from flask import Flask, jsonify, render_template
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

#################################################
# Database Setup
#################################################
DATABASE_URL = os.environ.get("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL environment variable not set")

# Fix old-style postgres:// URLs if needed
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Create SQLAlchemy engine
engine = create_engine(DATABASE_URL)

#################################################
# Flask Setup
#################################################
app = Flask(__name__)

# Use DATABASE_URL for SQLAlchemy configuration
app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    'pool_recycle': 300,
    'pool_pre_ping': True
}

# Initialize SQLAlchemy
db = SQLAlchemy(app)

#################################################
# Flask Routes
#################################################
@app.route("/")
def index():
    """Render the main page"""
    return render_template("index.html")

@app.route("/mental_health")
def mental_health():
    """Return mental health data as JSON"""
    try:
        # Using text() for explicit SQL statement
        sql_statement = text("SELECT * FROM mental_health;")
        df = pd.read_sql(sql_statement, engine)
        
        # Check if 'Timestamp' column exists before setting as index
        if 'Timestamp' in df.columns:
            df.set_index('Timestamp', inplace=True)
            result = df.to_dict(orient='index')
        else:
            # If no Timestamp, return as is
            result = df.to_dict(orient='records')
            
        return jsonify(result)
    except Exception as e:
        app.logger.error(f"Error in mental_health route: {str(e)}")
        return jsonify({"error": "Failed to fetch mental health data"}), 500

@app.route("/indicator")
def indicator():
    """Return development indicator data as JSON"""
    try:
        sql_statement = text("SELECT * FROM development_indicator;")
        df = pd.read_sql(sql_statement, engine)
        
        # Check if 'country_name' column exists before setting as index
        if 'country_name' in df.columns:
            df.set_index('country_name', inplace=True)
            result = df.to_dict(orient='index')
        else:
            result = df.to_dict(orient='records')
            
        return jsonify(result)
    except Exception as e:
        app.logger.error(f"Error in indicator route: {str(e)}")
        return jsonify({"error": "Failed to fetch indicator data"}), 500

@app.route("/health")
def health_check():
    """Health check endpoint for deployment monitoring"""
    try:
        # Test database connection
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return jsonify({
            "status": "healthy", 
            "database": "connected"
        })
    except Exception as e:
        return jsonify({
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e)
        }), 500

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Resource not found"}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    # Get port from environment variable or default to 5000
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
