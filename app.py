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

engine = create_engine('postgres://laygmcuioflmey:0b00a874ef3af945d6032f1fe94dacfaa533c8420cc70e6ca187ab388884f65b@ec2-52-72-99-110.compute-1.amazonaws.com:5432/d46i9drfnagf6m')


# checking the table names
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
