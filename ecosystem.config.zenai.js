module.exports = {
  apps: [
    {
      name: 'zenai-AI-stock-processor',
      script: 'dist/zenai-stock.main.js',
      instances: 1, // Chỉ chạy 1 instance vì đây là cronjob
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        ZENAI_PORT: 4303,
        CHROMA_URL: "http://103.216.119.195:8000"
      },
      env_production: {
        NODE_ENV: 'production',
        ZENAI_PORT: 4303,
        CHROMA_URL: "http://103.216.119.195:8000"
      },
    },
  ],
}; 