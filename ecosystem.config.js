module.exports = {
  apps: [
    {
      name: 'zenai.chatbot.api.dev',
      script: 'dist/main.js',
      cwd: './',
      env: {
        NODE_ENV: 'development',
        PORT: 4301
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 4301
      },
      env_file: '.env',
      watch: false,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '1G',
      error_file: 'logs/zenai-api-error.log',
      out_file: 'logs/zenai-api-out.log',
      time: true
    },
    {
      name: 'zenai.chatbot.client.dev',
      script: 'serve',
      cwd: './web-client',
      env: {
        NODE_ENV: 'development',
        PM2_SERVE_PATH: './dist',
        PM2_SERVE_PORT: 4302,
        PM2_SERVE_SPA: 'true',
        PM2_SERVE_HOMEPAGE: '/index.html'
      },
      env_production: {
        NODE_ENV: 'production',
        PM2_SERVE_PATH: './dist',
        PM2_SERVE_PORT: 4302,
        PM2_SERVE_SPA: 'true',
        PM2_SERVE_HOMEPAGE: '/index.html'
      },
      watch: false,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '1G',
      error_file: 'logs/zenai-client-error.log',
      out_file: 'logs/zenai-client-out.log',
      time: true
    }
  ]
} 