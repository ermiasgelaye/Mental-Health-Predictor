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

engine = create_engine('postgres://lnhentjbjsyehy:14cc7d8917fc041a5ffee695f88c9bc054f40944f6dfd4000b20d99c0211a31e@ec2-52-86-116-94.compute-1.amazonaws.com:5432/dfvu5tqvp1uonb')


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


@app.route("/Home")
def home():                                                                                                                     
    return render_template("index.html")



@app.route('/searchbyyear')
def searchbyyear():
    sqlStatement = """
   SELECT year, SUM ("Cancer" + "cardiovascular" + "stroke" + "depression" + "rehab" + "vaccine" + "diarrhea" + "obesity" + "diabetes") AS Searches  
   FROM search_condition 
   GROUP BY year
    ORDER BY year;
    """
    df = pdsql.read_sql(sqlStatement, engine)
    df.set_index('year', inplace=True)
    df = df.to_json(orient='table')
    result = json.loads(df)
    return jsonify(result)
@app.route('/searchyearandcondition')
def searchyearandcondition():
    sqlStatement = """
    SELECT year, SUM ("Cancer") AS Cancer,SUM ("cardiovascular") As Cardiovascular,SUM ("stroke") As Stroke,SUM ("depression") As Depression,SUM ("rehab") AS Rehab,SUM ("vaccine") AS Vaccine, SUM ("diarrhea") AS Diarrhea, SUM("obesity") AS Obesity, SUM ("diabetes") AS Diabetes    
    FROM search_condition 
    GROUP BY year
    ORDER BY year;

    """
    df = pdsql.read_sql(sqlStatement, engine)
    df.set_index('year', inplace=True)
    df = df.to_json(orient='table')
    result = json.loads(df)
    return jsonify(result)

@app.route('/searchbycity')
def searchbycity():

    sqlStatement = """
SELECT l.city,l.postal,l.state, l.latitude, l.longitude, SUM (s."Cancer" + s."cardiovascular" + s."stroke" + s."depression" + s."rehab" + s."vaccine" + s."diarrhea" + s."obesity" + s."diabetes") AS Searches  
FROM location l
INNER JOIN search_condition s on s.location_id = l.location_id
GROUP BY l.city,l.state,l.postal, l.latitude, l.longitude
ORDER BY l.city;

    """
    df = pdsql.read_sql(sqlStatement, engine)
    df.set_index('city', inplace=True)
    df = df.to_json(orient='table')
    result = json.loads(df)
    return jsonify(result)

@app.route('/searchbystate')
def searchbystate():
    sqlStatement = """
SELECT l.state,l.postal, SUM (s."Cancer" + s."cardiovascular" + s."stroke" + s."depression" + s."rehab" + s."vaccine" + s."diarrhea" + s."obesity" + s."diabetes") AS Searches  
FROM location l
INNER JOIN search_condition s on s.location_id = l.location_id
GROUP BY l.state,l.postal;
 """
    df = pdsql.read_sql(sqlStatement, engine)
    df.set_index('state', inplace=True)
    df = df.to_json(orient='table')
    result = json.loads(df)
    return jsonify(result)
@app.route('/bystateandyear')
def bylocationandyear():
    sqlStatement = """
 SELECT l.state, l.latitude, l.longitude,s.year, SUM (s."Cancer" + s."cardiovascular" + s."stroke" + s."depression" + s."rehab" + s."vaccine" + s."diarrhea" + s."obesity" + s."diabetes") AS Searches  
FROM location l
INNER JOIN search_condition s on s.location_id = l.location_id
GROUP BY l.state, l.latitude, l.longitude,s.year
ORDER BY year;

    """
    df = pdsql.read_sql(sqlStatement, engine)
    df.set_index('state', inplace=True)
    df = df.to_json(orient='table')
    result = json.loads(df)
    return jsonify(result)


@app.route('/casesleadingdeath')
def casesleadingdeath():
    sqlStatement = """
    SELECT * FROM leading_causes_of_death;

    """
    df = pdsql.read_sql(sqlStatement, engine)
    df.set_index('year', inplace=True)
    df = df.to_json(orient='table')
    result = json.loads(df)
    return jsonify(result)


@app.route('/allsearchrecord')
def allsearchrecord():
    sqlStatement = """
    SELECT *
    FROM location l
    INNER JOIN search_condition s on s.location_id = l.location_id
    ORDER BY year;


    """
    df = pdsql.read_sql(sqlStatement, engine)
    df.set_index('year', inplace=True)
    df = df.to_json(orient='table')
    result = json.loads(df)
    return jsonify(result)

@app.route('/location')
def location():
    sqlStatement = """
    SELECT * FROM location;
    """
    df = pdsql.read_sql(sqlStatement, engine)
    df.set_index('location_id', inplace=True)
    df = df.to_json(orient='table')
    result = json.loads(df)
    return jsonify(result)

@app.route('/conditions')
def conditions():
    sqlStatement = """
    SELECT * FROM search_condition;
    """
    df = pdsql.read_sql(sqlStatement, engine)
    df.set_index('location_id', inplace=True)
    df = df.to_json(orient='table')
    result = json.loads(df)
    return jsonify(result)
@app.route('/mostsserached')
def mostsserached():
    sqlStatement = """
    SELECT l.state, SUM ("Cancer") AS Cancer,SUM ("cardiovascular") As Cardiovascular,SUM ("stroke") As Stroke,SUM ("depression") As Depression,SUM ("rehab") AS Rehab,SUM ("vaccine") AS Vaccine, SUM ("diarrhea") AS Diarrhea, SUM("obesity") AS Obesity, SUM ("diabetes") AS Diabetes 
    FROM location l
    INNER JOIN search_condition s on s.location_id = l.location_id
    GROUP BY state
    order by Cancer desc, Cardiovascular desc,Stroke desc,Depression desc,Rehab desc,Vaccine desc, Diarrhea desc, Diabetes desc, Obesity desc
    LIMIT 10; 
    """
    df = pdsql.read_sql(sqlStatement, engine)
    df.set_index('state', inplace=True)
    df = df.to_json(orient='table')
    result = json.loads(df)
    return jsonify(result)

@app.route('/totalcondition')
def totalcondition():
    sqlStatement = """
    SELECT SUM ("Cancer") AS Cancer,SUM ("cardiovascular") As Cardiovascular,SUM ("stroke") As Stroke,SUM ("depression") As Depression,SUM ("rehab") AS Rehab,SUM ("vaccine") AS Vaccine, SUM ("diarrhea") AS Diarrhea, SUM("obesity") AS Obesity, SUM ("diabetes") AS Diabetes    
    FROM search_condition 
    """
    df = pdsql.read_sql(sqlStatement, engine)
    df.set_index('cancer', inplace=True)
    df = df.to_json(orient='table')
    result = json.loads(df)
    return jsonify(result)


@app.route('/totaldeathcase')
def totaldeathcase():
    sqlStatement = """
    SELECT SUM ("Accidents") AS Accidents,SUM ("Alzheimer") As Alzheimer,SUM ("Cerebrovascular") As Cerebrovascular,SUM ("Diabetes") As Diabetes,SUM ("Diseases_of_heart") AS Diseases_of_Heart, SUM ("Influenza_and_pneumonia") AS Influenza_and_Pneumonia, SUM ("Malignant_neoplasms") AS Malignant_eoplasms, SUM("Nephrosis") AS Nephrosis, SUM ("Suicide") AS Suicide,SUM ("Respiratory") AS Respiratory   
    FROM leading_causes_of_death
    """
    df = pdsql.read_sql(sqlStatement, engine)
    df.set_index('alzheimer', inplace=True)
    df = df.to_json(orient='table')
    result = json.loads(df)
    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True)
