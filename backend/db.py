import os
import psycopg2
from psycopg2 import pool
from psycopg2.extras import RealDictCursor
from contextlib import contextmanager

# Get database URL from environment
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://auto_specs_user:auto_specs_pass@postgres:5432/auto_specs_db')

# Create a connection pool
connection_pool = psycopg2.pool.SimpleConnectionPool(
    1, 20,  # min and max connections
    DATABASE_URL
)

@contextmanager
def get_db_connection():
    """Context manager for database connections"""
    conn = connection_pool.getconn()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        connection_pool.putconn(conn)

@contextmanager
def get_db_cursor(commit=True):
    """Context manager for database cursor with automatic commit/rollback"""
    with get_db_connection() as conn:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        try:
            yield cursor
            if commit:
                conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            cursor.close()

def execute_query(query, params=None, fetchone=False, fetchall=False):
    """Execute a query and return results"""
    with get_db_cursor() as cursor:
        cursor.execute(query, params or ())
        if fetchone:
            return cursor.fetchone()
        elif fetchall:
            return cursor.fetchall()
        return cursor.rowcount

def row_to_dict(row):
    """Convert a database row to a dictionary (already done by RealDictCursor)"""
    if row is None:
        return None
    return dict(row)
