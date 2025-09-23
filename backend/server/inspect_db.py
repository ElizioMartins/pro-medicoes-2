import sqlite3

DB_PATH = 'medicoes.db'

def print_table_counts(conn):
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [row[0] for row in cursor.fetchall()]
    print("Tabelas encontradas:", tables)
    for table in tables:
        cursor.execute(f"SELECT COUNT(*) FROM {table}")
        count = cursor.fetchone()[0]
        print(f"Tabela {table}: {count} registros")

def print_some_rows(conn, limit=5):
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [row[0] for row in cursor.fetchall()]
    for table in tables:
        print(f"\nPrimeiros registros da tabela {table}:")
        try:
            cursor.execute(f"SELECT * FROM {table} LIMIT {limit}")
            rows = cursor.fetchall()
            for row in rows:
                print(row)
        except Exception as e:
            print(f"Erro ao consultar {table}: {e}")

def main():
    conn = sqlite3.connect(DB_PATH)
    print_table_counts(conn)
    print_some_rows(conn)
    conn.close()

if __name__ == "__main__":
    main()
