const app = require('./app');
const env = require('./config/env');
const { connectDB } = require('./config/db');
const { startWorker } = require('./jobs/queue');
const { registerJobHandlers } = require('./jobs/handlers');

async function main() {
  await connectDB();
  registerJobHandlers();
  startWorker();

  app.listen(env.port, () => {
    console.log(`[server] AI Study Companion API listening on port ${env.port} (${env.nodeEnv})`);
  });
}

main().catch((err) => {
  console.error('[server] Fatal startup error:', err);
  process.exit(1);
});
