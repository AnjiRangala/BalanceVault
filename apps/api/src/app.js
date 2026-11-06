import cors from 'cors';
import express from 'express';

const app = express();

const allowedOrigins = (process.env.WEB_ORIGIN ?? 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (_request, response) => {
  response.json({ application: 'BalanceVault', status: 'healthy' });
});

app.use('/api', (_request, response) => {
  response.status(404).json({ error: 'API route not found' });
});

app.use((error, _request, response, _next) => {
  const status = Number.isInteger(error.status) && error.status >= 400 && error.status < 600
    ? error.status
    : 500;

  if (status >= 500) {
    console.error('Unhandled request error:', error.message);
  }

  response.status(status).json({
    error: status >= 500 ? 'Internal server error' : error.message,
  });
});

export default app;
