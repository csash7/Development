// API configuration for the scraper backend
// Change this to your server's IP/domain when deploying

const isDevelopment = process.env.NODE_ENV === 'development';

// Use remote server in production, localhost in development
export const API_BASE = isDevelopment
    ? 'http://localhost:8080/api'
    : 'http://31.97.212.67:8080/api';

// For local development, you can override this:
// export const API_BASE = 'http://31.97.212.67:8080/api';
