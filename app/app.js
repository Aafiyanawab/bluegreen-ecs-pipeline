const express = require('express');
const app = express();

const APP_VERSION = process.env.APP_VERSION || 'v1.0.0';
const APP_COLOR   = process.env.APP_COLOR   || 'blue';
const DEPLOY_TIME = process.env.DEPLOY_TIME || new Date().toISOString();
const HOSTNAME    = process.env.HOSTNAME    || 'localhost';

// ── HOME PAGE ─────────────────────────────────────────────
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>BlueGreen Pipeline — Status</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: 'Segoe UI', sans-serif;
          background: #0f1117;
          color: #e2e8f0;
          padding: 24px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        h1 { font-size: 22px; font-weight: 600; }
        .live {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #94a3b8;
        }
        .dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: #22c55e;
          animation: pulse 1.5s infinite;
        }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .grid {
          display: grid;
          grid-template-columns: repeat(3,1fr);
          gap: 16px;
          margin-bottom: 24px;
        }
        .card {
          background: #1e2333;
          border-radius: 12px;
          padding: 18px;
          border: 1px solid #2d3748;
        }
        .label {
          font-size: 11px;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 8px;
        }
        .value {
          font-size: 22px;
          font-weight: 700;
          color: ${APP_COLOR === 'blue' ? '#3b82f6' : '#22c55e'};
        }
        .sub { font-size: 12px; color: #64748b; margin-top: 4px; }
        .env-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 600;
          background: ${APP_COLOR === 'blue' ? '#1e3a5f' : '#14532d'};
          color: ${APP_COLOR === 'blue' ? '#3b82f6' : '#22c55e'};
        }
        .meta {
          background: #1e2333;
          border-radius: 12px;
          padding: 18px;
          border: 1px solid #2d3748;
          font-size: 12px;
          font-family: monospace;
          color: #94a3b8;
          line-height: 2;
        }
        .meta span { color: #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>⚡ BlueGreen ECS Pipeline</h1>
        <div class="live"><div class="dot"></div> Live</div>
      </div>

      <div class="grid">
        <div class="card">
          <div class="label">Version</div>
          <div class="value">${APP_VERSION}</div>
          <div class="sub">Current deployed version</div>
        </div>
        <div class="card">
          <div class="label">Environment</div>
          <div class="value">
            <span class="env-badge">${APP_COLOR.toUpperCase()}</span>
          </div>
          <div class="sub">Active deployment slot</div>
        </div>
        <div class="card">
          <div class="label">Health</div>
          <div class="value" style="color:#22c55e">Healthy</div>
          <div class="sub">Application status</div>
        </div>
      </div>

      <div class="meta">
        Deployed At: <span>${DEPLOY_TIME}</span><br>
        Hostname:    <span>${HOSTNAME}</span>
      </div>
    </body>
    </html>
  `);
});

// ── HEALTH CHECK ──────────────────────────────────────────
// ALB and CodeDeploy use this endpoint to verify
// the container is alive before shifting traffic.
// This must return 200 or deployment will be rolled back.
app.get('/health', (req, res) => {
  res.status(200).json({
    status:  'healthy',
    version: APP_VERSION,
    color:   APP_COLOR
  });
});

// ── VERSION ───────────────────────────────────────────────
// Jenkins uses this after deployment to verify
// the correct image version is running.
app.get('/version', (req, res) => {
  res.status(200).json({
    version:    APP_VERSION,
    color:      APP_COLOR,
    deployedAt: DEPLOY_TIME,
    hostname:   HOSTNAME
  });
});

// ── 404 HANDLER ───────────────────────────────────────────
// Any unknown route returns 404.
// Important: this must be LAST — after all routes.
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ── EXPORT ────────────────────────────────────────────────
// Export app separately from server startup.
// This allows Supertest to import the app
// without opening a network port.
module.exports = app;

// Only start the server when this file is run directly.
// When tests import this file, server does NOT start.
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`App running | Port: ${PORT} | Version: ${APP_VERSION} | Color: ${APP_COLOR}`);
  });
}