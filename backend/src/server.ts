import { createApp } from '@/app';
import { env } from '@/config/env';
import { initDb } from '@/config/init-db';

const app = createApp();

async function startServer() {
  try {
    await initDb();
    app.listen(env.PORT, () => {
      console.log(`GramTrust backend listening on http://localhost:${env.PORT}`);
    });
  } catch (error) {
    console.error('Failed to initialize database or start server:', error);
    process.exit(1);
  }
}

startServer();

