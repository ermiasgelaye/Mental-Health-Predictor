import numpy as np
import os
import json
import requests
import sqlalchemy
from sqlalchemy.ext.automap import automap_base
from sqlalchemy.orm import Session
from sqlalchemy import create_engine
import pandas.io.sql as pdsql
from config import pg_user, pg_password, db_name, pg_host  # Corrected import
from flask import Flask, jsonify, render_template, abort, redirect
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import create_engine, MetaData

from flask import Flask, jsonify, render_template
import pandas as pd
import json
from sqlalchemy import create_engine
from dotenv import load_dotenv

load_dotenv()

#################################################
# Database Setup
##################################################

pg_user = os.getenv("PG_USER")
pg_password = os.getenv("PG_PASSWORD")
pg_host = os.getenv("PG_HOST")
pg_port = os.getenv("PG_PORT", "5432")
db_name = os.getenv("DB_NAME")


DATABASE_URL = f"postgresql://{pg_user}:{pg_password}@{pg_host}:{pg_port}/{db_name}?sslmode=require"
DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql://', 1)

engine = create_engine(DATABASE_URL)
meta = sqlalchemy.MetaData()
meta.reflect(bind=engine)
table_names = meta.tables.keys()
print(table_names)  # or use the list of table_names as needed




#################################################
# Flask Setup
#################################################
app = Flask(__name__)

# Fix the typo in the configuration keys
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URI', '') or "sqlite:///db.sqlite"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

#################################################
# Flask Routes
#################################################
@app.route("/")
def index():
    return render_template("index.html")

@app.route("/mental_health")
def mental_health():
    sqlStatement = """
    SELECT * FROM mental_health;
    """
    df = pdsql.read_sql(sqlStatement, engine)
    df.set_index('Timestamp', inplace=True)
    df = df.to_json(orient='table')
    result = json.loads(df)
    return jsonify(result)

@app.route("/indicator")
def indicator():
    sqlStatement = """
    SELECT * FROM development_indicator;
    """
    df = pdsql.read_sql(sqlStatement, engine)
    df.set_index('country_name', inplace=True)
    df = df.to_json(orient='table')
    result = json.loads(df)
    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True)
