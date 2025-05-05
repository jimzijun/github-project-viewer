import sqlalchemy
from sqlalchemy import create_engine, text

# Connection string from start-postgres.sh
DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/github_projects"

print(f"Attempting to connect to: {DATABASE_URL}")

try:
    # Create engine
    engine = create_engine(DATABASE_URL)
    
    # Test connection
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1 as test"))
        for row in result:
            print(f"Connection successful! Result: {row.test}")
        
        # Get list of tables
        print("\nListing tables in database:")
        tables_result = connection.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema='public'"))
        for table in tables_result:
            print(f"- {table.table_name}")
    
    print("\nConnection and query executed successfully.")
except Exception as e:
    print(f"Error connecting to the database: {e}") 