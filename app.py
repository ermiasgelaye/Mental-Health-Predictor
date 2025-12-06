import os
import pandas as pd
from sqlalchemy import create_engine, text
from flask import Flask, jsonify, render_template, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

#################################################
# Database Setup
#################################################
DATABASE_URL = os.environ.get("DATABASE_URL")

if not DATABASE_URL:
    # Fallback to local SQLite for development
    DATABASE_URL = "sqlite:///db.sqlite"

# Fix old-style postgres:// URLs if needed
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Create SQLAlchemy engine
engine = create_engine(DATABASE_URL)

#################################################
# Flask Setup
#################################################
app = Flask(__name__, static_folder='static')

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

# Route to serve static HTML files
@app.route('/static/<path:filename>')
def serve_static(filename):
    return send_from_directory('static', filename)

@app.route("/mental_health")
def mental_health():
    """Return mental health data as JSON"""
    try:
        # Using text() for explicit SQL statement
        sql_statement = text("SELECT * FROM mental_health;")
        df = pd.read_sql(sql_statement, engine)
        
        # Convert to JSON-friendly format
        result = df.to_dict(orient='records')
        return jsonify(result)
    except Exception as e:
        app.logger.error(f"Error in mental_health route: {str(e)}")
        # Try alternative table name
        try:
            sql_statement = text("SELECT * FROM mental_health_data;")
            df = pd.read_sql(sql_statement, engine)
            result = df.to_dict(orient='records')
            return jsonify(result)
        except Exception as e2:
            return jsonify({"error": f"Failed to fetch mental health data: {str(e2)}", "tables": get_table_names()}), 500

@app.route("/indicator")
def indicator():
    """Return development indicator data as JSON"""
    try:
        sql_statement = text("SELECT * FROM development_indicator;")
        df = pd.read_sql(sql_statement, engine)
        result = df.to_dict(orient='records')
        return jsonify(result)
    except Exception as e:
        app.logger.error(f"Error in indicator route: {str(e)}")
        # Try alternative table name
        try:
            sql_statement = text("SELECT * FROM development_indicators;")
            df = pd.read_sql(sql_statement, engine)
            result = df.to_dict(orient='records')
            return jsonify(result)
        except Exception as e2:
            return jsonify({"error": f"Failed to fetch indicator data: {str(e2)}", "available_tables": get_table_names()}), 500

def get_table_names():
    """Helper function to get available table names"""
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT name FROM sqlite_master WHERE type='table';"))
            tables = [row[0] for row in result]
            return tables
    except:
        return []

@app.route("/health")
def health_check():
    """Health check endpoint for deployment monitoring"""
    try:
        # Test database connection
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        # Check if tables exist
        tables = get_table_names()
        return jsonify({
            "status": "healthy", 
            "database": "connected",
            "tables": tables
        })
    except Exception as e:
        return jsonify({
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e)
        }), 500

# Route to serve HTML files from WebVisualizations
@app.route('/eda')
def eda():
    return send_from_directory('static/WebVisualizations', 'main.html')

@app.route('/ml')
def ml():
    return send_from_directory('static/WebVisualizations', 'machine-learning.html')

@app.route('/data')
def data_explorer():
    return send_from_directory('static/WebVisualizations', 'data.html')

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
    app.run(host='0.0.0.0', port=port, debug=True)