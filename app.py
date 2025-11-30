import os
import json
import pandas as pd
from sqlalchemy import create_engine
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

engine = create_engine(DATABASE_URL)

#################################################
# Flask Setup
#################################################
app = Flask(__name__)

# Use DATABASE_URL consistently
app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

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
        sql_statement = "SELECT * FROM mental_health;"
        df = pd.read_sql(sql_statement, engine)
        df.set_index('Timestamp', inplace=True)
        result = df.to_dict(orient='index')
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/indicator")
def indicator():
    """Return development indicator data as JSON"""
    try:
        sql_statement = "SELECT * FROM development_indicator;"
        df = pd.read_sql(sql_statement, engine)
        df.set_index('country_name', inplace=True)
        result = df.to_dict(orient='index')
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Optional: Add a health check endpoint for deployment
@app.route("/health")
def health_check():
    """Health check endpoint for deployment monitoring"""
    return jsonify({"status": "healthy"})

if __name__ == '__main__':
    app.run(debug=False)  # Set debug=False for production