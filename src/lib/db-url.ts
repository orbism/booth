// src/lib/db-url.ts

export function constructDatabaseUrl() {
    const {
      DB_HOST,
      DB_PORT,
      DB_USER,
      DB_PASSWORD,
      DB_NAME
    } = process.env;
  
    if (!DB_HOST || !DB_USER || !DB_PASSWORD || !DB_NAME) {
      throw new Error('Missing database configuration parameters');
    }
  
    const port = DB_PORT || '3306';
    
    return `mysql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${port}/${DB_NAME}`;
  }