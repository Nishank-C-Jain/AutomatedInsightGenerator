"""
Database connection pool for the analytics service.
Reads the same env vars used by the Node.js backend so both services
talk to the same PostgreSQL database.
"""

import os
from psycopg2 import pool as pg_pool

_pool: pg_pool.SimpleConnectionPool | None = None


def get_pool() -> pg_pool.SimpleConnectionPool:
    """Return (and lazily create) the shared connection pool."""
    global _pool
    if _pool is None:
        _pool = pg_pool.SimpleConnectionPool(
            minconn=1,
            maxconn=10,
            host=os.getenv("DB_HOST", "localhost"),
            port=int(os.getenv("DB_PORT", "5432")),
            dbname=os.getenv("DB_NAME", "automated_insights"),
            user=os.getenv("DB_USER", "aig_app"),
            password=os.getenv("DB_PASSWORD", ""),
        )
    return _pool


def get_connection():
    """Borrow a connection from the pool. Caller must call put_connection()."""
    return get_pool().getconn()


def put_connection(conn) -> None:
    """Return a connection to the pool."""
    get_pool().putconn(conn)
