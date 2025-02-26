interface EnvConfig {
  apiUrl: string;
  nodeEnv: string;
  isDevelopment: boolean;
  isProduction: boolean;
}

// Throw error if VITE_API_URL is not set
if (!import.meta.env.VITE_API_URL) {
  throw new Error('VITE_API_URL environment variable is required');
}

export const envConfig: EnvConfig = {
  apiUrl: import.meta.env.VITE_API_URL,
  nodeEnv: import.meta.env.VITE_NODE_ENV || 'development',
  isDevelopment: (import.meta.env.VITE_NODE_ENV || 'development') === 'development',
  isProduction: (import.meta.env.VITE_NODE_ENV || 'development') === 'production',
}; 