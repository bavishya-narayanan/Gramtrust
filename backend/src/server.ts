import { createApp } from '@/app';
import { env } from '@/config/env';
import { initDb } from '@/config/init-db';
import { documentService } from '@/services/document.service';

const app = createApp();

async function startServer() {
  try {
    await initDb();

    app.listen(env.PORT, () => {
      console.log(
        `GramTrust backend listening on http://localhost:${env.PORT}`,
      );

      // Remember the previous integrity state.
      // This prevents the same tamper message from
      // being printed every 5 seconds.
      let lastIntegrityState = '';

      // Check document integrity every 5 seconds
      setInterval(async () => {
        try {
          const tampered = await documentService.monitorIntegrity();

          const currentIntegrityState = tampered
            .map(
              (doc) =>
                `${doc.code}:${doc.dbHash}:${doc.blockchainHash}`,
            )
            .sort()
            .join('|');

          // Only print when the integrity state changes
          if (currentIntegrityState !== lastIntegrityState) {
            if (tampered.length > 0) {
              console.log(
                '⚠️ DOCUMENT TAMPERING DETECTED:',
                tampered,
              );
            } else {
              console.log('✅ Document integrity verified');
            }

            lastIntegrityState = currentIntegrityState;
          }
        } catch (error) {
          console.error(
            'Document integrity check failed:',
            error,
          );
        }
      }, 5000);
    });
  } catch (error) {
    console.error(
      'Failed to initialize database or start server:',
      error,
    );

    process.exit(1);
  }
}

startServer();