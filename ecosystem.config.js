module.exports = {
  apps: [{
    name: 'dagda-games',
    script: 'npm start',
    cwd: '/home/neondaemon/Documents/code/dagda/dagda-app',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
      NEXT_PUBLIC_FARCASTER_APP_URL: 'http://localhost:3000',
      NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: '81a6feac6aa5ce93a89fc5601ca532f1',
      NEXT_PUBLIC_BASE_SEPOLIA_RPC: 'https://sepolia.base.org'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
