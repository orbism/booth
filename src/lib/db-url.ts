// src/lib/db-url.ts

export function constructDatabaseUrl() {
  const {
    DB_HOST,
    DB_PORT,
    DB_USER,
    DB_PASSWORD,
    DB_NAME,
    DATABASE_URL
  } = process.env;

  // First check if DATABASE_URL is already provided
  if (DATABASE_URL) {
    console.log('Using provided DATABASE_URL environment variable');
    return DATABASE_URL;
  }

  // Log available configuration for debugging
  console.log('Database config available:', {
    host: DB_HOST ? '✅' : '❌',
    port: DB_PORT ? '✅' : '❌',
    user: DB_USER ? '✅' : '❌',
    password: DB_PASSWORD ? '✅ (length: ' + (DB_PASSWORD?.length || 0) + ')' : '❌',
    name: DB_NAME ? '✅' : '❌'
  });

  if (!DB_HOST || !DB_USER || !DB_PASSWORD || !DB_NAME) {
    console.error('Missing database configuration parameters. Check your .env file.');
    
    // Instead of throwing error, return a fallback for development
    if (process.env.NODE_ENV === 'development') {
      console.warn('Falling back to in-memory SQLite database for development');
      return 'file:./dev.db';
    }
    
    throw new Error('Missing database configuration parameters. Please check your .env file.');
  }

  const port = DB_PORT || '3306';
  const url = `mysql://${DB_USER}:${encodeURIComponent(DB_PASSWORD)}@${DB_HOST}:${port}/${DB_NAME}`;
  
  console.log(`Database URL constructed successfully for host: ${DB_HOST}`);
  return url;
}