/**
 * server.js — Express bridge entre el frontend React y el servidor Python Flask.
 * Puerto: 3001
 * Ejecutar con: node server.js
 */

const express = require('express');
const cors = require('cors');
const http = require('http');

const app = express();
const PORT = 3001;
const PYTHON_HOST = 'localhost';
const PYTHON_PORT = 5050;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', bridge: 'Express → Python:5050' });
});

// ─── POST /predict ────────────────────────────────────────────────────────────
app.post('/predict', (req, res) => {
  const body = JSON.stringify(req.body);

  const options = {
    hostname: PYTHON_HOST,
    port: PYTHON_PORT,
    path: '/predict',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
    },
  };

  const pyReq = http.request(options, (pyRes) => {
    let data = '';
    pyRes.on('data', (chunk) => (data += chunk));
    pyRes.on('end', () => {
      try {
        res.status(pyRes.statusCode).json(JSON.parse(data));
      } catch {
        res.status(500).json({ error: 'Invalid response from Python server' });
      }
    });
  });

  pyReq.on('error', (err) => {
    console.error('❌ Python server unreachable:', err.message);
    res.status(503).json({
      error: 'Python prediction server not available. Run: python predict_server.py',
    });
  });

  pyReq.write(body);
  pyReq.end();
});

app.listen(PORT, () => {
  console.log(`✅ Express bridge running at http://localhost:${PORT}`);
  console.log(`🔗 Forwarding /predict → http://${PYTHON_HOST}:${PYTHON_PORT}/predict`);
});
