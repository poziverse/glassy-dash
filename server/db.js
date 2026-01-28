// server/db.js
// An async wrapper for sqlite3 to mimic the better-sqlite3 API pattern
const sqlite3 = require('sqlite3').verbose()

class Statement {
  constructor(db, sql) {
    this.db = db
    this.sql = sql
  }

  /**
   * The wrapper allows passing an object like { id: 1 } for @id in SQL.
   * sqlite3 requires the key to match exactly: { '@id': 1 }.
   * This helper maps un-prefixed keys to prefixed ones.
   */
  _mapParams(params) {
    if (
      params.length === 1 &&
      typeof params[0] === 'object' &&
      params[0] !== null &&
      !Array.isArray(params[0])
    ) {
      const obj = params[0]
      const mapped = {}
      for (const [key, val] of Object.entries(obj)) {
        // If key already has a prefix, use it as-is
        if (key.startsWith('@') || key.startsWith('$') || key.startsWith(':')) {
          mapped[key] = val
        } else {
          // Map to @ prefix (most common in this codebase)
          mapped['@' + key] = val
        }
      }
      return mapped
    }
    return params
  }

  async run(...params) {
    const actualParams = this._mapParams(params)
    return new Promise((resolve, reject) => {
      this.db.run(this.sql, actualParams, function (err) {
        if (err) return reject(err)
        resolve({
          changes: this.changes,
          lastInsertRowid: this.lastID,
        })
      })
    })
  }

  async get(...params) {
    const actualParams = this._mapParams(params)
    return new Promise((resolve, reject) => {
      this.db.get(this.sql, actualParams, (err, row) => {
        if (err) return reject(err)
        resolve(row)
      })
    })
  }

  async all(...params) {
    const actualParams = this._mapParams(params)
    return new Promise((resolve, reject) => {
      this.db.all(this.sql, actualParams, (err, rows) => {
        if (err) return reject(err)
        resolve(rows || [])
      })
    })
  }
}

class Database {
  constructor(filename, options = {}) {
    this.db = new sqlite3.Database(filename)
    Database.instance = this
  }

  static getDb() {
    if (!Database.instance) {
      throw new Error('Database not initialized. Call new Database() first.')
    }
    return Database.instance
  }

  prepare(sql) {
    return new Statement(this.db, sql)
  }

  async exec(sql) {
    return new Promise((resolve, reject) => {
      this.db.exec(sql, err => {
        if (err) return reject(err)
        resolve()
      })
    })
  }

  async pragma(sql) {
    // PRAGMA results are usually returned via get
    return new Promise((resolve, reject) => {
      this.db.get(`PRAGMA ${sql}`, (err, row) => {
        if (err) return reject(err)
        resolve(row)
      })
    })
  }

  transaction(fn) {
    // Returns an async function that runs the transaction
    return async (...args) => {
      await this.exec('BEGIN TRANSACTION')
      try {
        const result = await fn(...args)
        await this.exec('COMMIT')
        return result
      } catch (err) {
        await this.exec('ROLLBACK')
        throw err
      }
    }
  }

  async close() {
    return new Promise((resolve, reject) => {
      this.db.close(err => {
        if (err) return reject(err)
        resolve()
      })
    })
  }
}

module.exports = Database
