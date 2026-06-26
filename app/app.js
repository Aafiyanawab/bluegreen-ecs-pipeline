const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Config from environment variables
const APP_VERSION = process.env.APP_VERSION || 'v1.0.0';
const APP_COLOR = process.env.APP_COLOR || 'blue';
const DEPLOY_TIME = process.env.DEPLOY_TIME || new Date().toISOString();

// Sanitised log — never expose AWS internals
const deploymentLogs = [
  { time: DEPLOY_TIME, message: `Version ${APP_VERSION} deployed successfully`, type: 'success' },
  { time: DEPLOY_TIME, message: `Health checks passing`, type: 'success' },
  { time: DEPLOY_TIME, message: `Traffic switched to ${APP_COLOR} environment`, type: 'info' },
];

// Home page
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>SwapDeploy</title>
      <meta http-equiv="refresh" content="30">
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Segoe UI', sans-serif; background: #0f1117; color: #e2e8f0; padding: 24px; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
        h1 { font-size: 22px; font-weight: 600; }
        .live { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #94a3b8; }
        .dot { width: 8px; height: 8px; border-radius: 50%; background: #22c55e; animation: pulse 1.5s infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; margin-bottom: 24px; }
        .card { background: #1e2333; border-radius: 12px; padding: 18px; border: 1px solid #2d3748; }
        .label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px; }
        .value { font-size: 24px; font-weight: 700; color: ${APP_COLOR === 'blue' ? '#3b82f6' : '#22c55e'}; }
        .sub { font-size: 12px; color: #64748b; margin-top: 4px; }
        .section { background: #1e2333; border-radius: 12px; padding: 18px; border: 1px solid #2d3748; margin-bottom: 16px; }
        .section-title { font-size: 13px; font-weight: 600; color: #94a3b8; margin-bottom: 14px; text-transform: uppercase; }
        .log-line { font-size: 12px; font-family: monospace; padding: 6px 0; border-bottom: 1px solid #1a2030; }
        .log-line:last-child { border-bottom: none; }
        .ts { color: #475569; margin-right: 8px; }
        .success { color: #22c55e; }
        .info { color: #60a5fa; }
        .env-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 600;
          background: ${APP_COLOR === 'blue' ? '#1e3a5f' : '#14532d'};
          color: ${APP_COLOR === 'blue' ? '#3b82f6' : '#22c55e'}; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>⚡ Blue-green swap concept</h1>
        <div class="live"><div class="dot"></div> Live</div>
      </div>

      <div class="grid">
        <div class="card">
          <div class="label">Version</div>
          <div class="value">${APP_VERSION}</div>
          <div class="sub">Current live version</div>
        </div>
        <div class="card">
          <div class="label">Environment</div>
          <div class="value"><span class="env-badge">${APP_COLOR.toUpperCase()}</span></div>
          <div class="sub">Active deployment slot</div>
        </div>
        <div class="card">
          <div class="label">Status</div>
          <div class="value" style="color:#22c55e">Healthy</div>
          <div class="sub">All systems operational</div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Deployment Log</div>
        ${deploymentLogs.map(log => `
          <div class="log-line">
            <span class="ts">${new Date(log.time).toLocaleTimeString()}</span>
            <span class="${log.type}">${log.message}</span>
          </div>
        `).join('')}
      </div>
    </body>
    </html>
  `);
});

// Health check endpoint — ALB uses this
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', version: APP_VERSION, color: APP_COLOR });
});

// Version endpoint
app.get('/version', (req, res) => {
  res.json({ version: APP_VERSION, color: APP_COLOR, deployedAt: DEPLOY_TIME });
});

app.listen(PORT, () => {
  console.log(`App running on port ${PORT} | Version: ${APP_VERSION} | Color: ${APP_COLOR}`);
});