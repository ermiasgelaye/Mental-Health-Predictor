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

engine = create_engine('postgres://hbvrwvuwkcodfm:c7eb18f8d9d20e75348b1c7282058ab8272e92e58c255a9a7c86d57e2e88a3cc@ec2-52-203-165-126.compute-1.amazonaws.com:5432/d5djmd6ii028mk')


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




if __name__ == '__main__':
    app.run(debug=True)
