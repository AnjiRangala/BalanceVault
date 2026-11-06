import 'dotenv/config';
import app from './app.js';

const port = Number.parseInt(process.env.API_PORT ?? '3001', 10);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('API_PORT must be a valid TCP port');
}

app.listen(port, () => {
  console.log(`BalanceVault API listening on port ${port}`);
});
