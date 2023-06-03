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

DATABASE_URL = "postgres://mydatabase:SOQRkULhTDzL4mWhpS5N15R52oK1m4R1@dpg-chth9oe7avj345fgnfjg-a.oregon-postgres.render.com/mydatabase_yaa1"

DATABASE_URL = DATABASE_URL.replace(
    'postgres://',
    'postgresql://',
    1
)

engine = create_engine(DATABASE_URL)
engine.table_names()



#################################################
# Flask Setup
#################################################
app = Flask(__name__)

app.config['SQLAlCHEMY_DATABASE_URI']=os.environ.get('DATABASE_URI','') or "sqlite:///db.sqlite"

app.config['SQLAlCHEMY_TRACK_MODIFICATION']=False

db=SQLAlchemy(app)

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
