import numpy as np
import os
import json
import requests
import sqlalchemy
from sqlalchemy.ext.automap import automap_base
from sqlalchemy.orm import Session
from sqlalchemy import create_engine
import pandas.io.sql as pdsql
from config import pg_user, pg_password, db_name
from flask import Flask, jsonify, render_template, abort, redirect
from flask_sqlalchemy import SQLAlchemy

#################################################
# Database Setup
##################################################

DATABASE_URL = "postgres://mydatabase_lqyh_user:4JUDsCCcDxE157GVixHZdthqk0RsQ6XO@dpg-cpk3q8qcn0vc73b02140-a.singapore-postgres.render.com/mydatabase_lqyh"
DATABASE_URL = DATABASE_URL.replace(
    'postgres://',
    'postgresql://',
    1
)

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
