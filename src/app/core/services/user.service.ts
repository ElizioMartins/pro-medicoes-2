import { Injectable } from '@angular/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { User } from '../models/User';
import { Observable, from, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private sqlite: SQLiteConnection;
  private db!: SQLiteDBConnection;
  private readonly DB_NAME = 'promedicoes.db';

  constructor() {
    this.sqlite = new SQLiteConnection(CapacitorSQLite);
    this.initializeDatabase();
  }

  private async initializeDatabase() {
    try {
      // Criar ou abrir o banco de dados
      this.db = await this.sqlite.createConnection(
        this.DB_NAME,
        false,
        'no-encryption',
        1,
        false
      );
      await this.db.open();

      // Criar tabela de usuários se não existir
      const query = `
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          role TEXT CHECK(role IN ('Admin', 'Manager', 'Reader', 'User')) NOT NULL,
          status TEXT CHECK(status IN ('Active', 'Inactive', 'Pending')) NOT NULL,
          lastAccess TEXT NOT NULL,
          initials TEXT NOT NULL,
          avatarColor TEXT NOT NULL
        )
      `;
      await this.db.execute(query);
    } catch (error) {
      console.error('Erro ao inicializar o banco de dados:', error);
    }
  }

  getUsers(page: number = 1, limit: number = 10): Observable<{ users: User[], total: number }> {
    const offset = (page - 1) * limit;
    const query = `
      SELECT *, (SELECT COUNT(*) FROM users) as total 
      FROM users 
      LIMIT ? OFFSET ?
    `;

    return from(this.db.query(query, [limit, offset])).pipe(
      map(result => {
        const users = result.values?.map(row => ({
          ...row,
          lastAccess: new Date(row.lastAccess)
        })) || [];
        const total = result.values?.[0]?.total || 0;
        return { users, total };
      })
    );
  }

  addUser(user: Omit<User, 'id'>): Observable<void> {
    const query = `
      INSERT INTO users (id, name, email, role, status, lastAccess, initials, avatarColor)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const id = crypto.randomUUID();
    const values = [
      id,
      user.name,
      user.email,
      user.role,
      user.status,
      user.lastAccess.toISOString(),
      user.initials,
      user.avatarColor
    ];

    return from(this.db.run(query, values));
  }

  updateUser(user: User): Observable<void> {
    const query = `
      UPDATE users 
      SET name = ?, email = ?, role = ?, status = ?, lastAccess = ?, initials = ?, avatarColor = ?
      WHERE id = ?
    `;
    const values = [
      user.name,
      user.email,
      user.role,
      user.status,
      user.lastAccess.toISOString(),
      user.initials,
      user.avatarColor,
      user.id
    ];

    return from(this.db.run(query, values));
  }

  deleteUser(id: string): Observable<void> {
    const query = 'DELETE FROM users WHERE id = ?';
    return from(this.db.run(query, [id]));
  }

  searchUsers(searchTerm: string, role?: string): Observable<User[]> {
    let query = `
      SELECT * FROM users 
      WHERE (name LIKE ? OR email LIKE ?)
    `;
    const params = [`%${searchTerm}%`, `%${searchTerm}%`];

    if (role && role !== 'all') {
      query += ' AND role = ?';
      params.push(role);
    }

    return from(this.db.query(query, params)).pipe(
      map(result => 
        result.values?.map(row => ({
          ...row,
          lastAccess: new Date(row.lastAccess)
        })) || []
      )
    );
  }
}
