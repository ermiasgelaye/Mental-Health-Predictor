# Configuration file for database credentials

pg_user = 'avnadmin'
pg_password = 'AVNS_eYXEknDp3jDY0lScacb'
db_name = 'defaultdb'
pg_host = 'mydatabase-ermiasgelaye-d9b4.c.aivencloud.com:26131'

# Create the DATABASE_URL string
DATABASE_URL = f"postgresql://{pg_user}:{pg_password}@{pg_host}/{db_name}"