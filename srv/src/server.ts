import { app } from './app.ts';
import { env } from './config/env.ts';
import { testSupabaseConnection } from './config/supabase.ts';

const PORT = env.PORT;

async function bootstrap() {
  console.log('🚀 Starting SCI CUP Multi-Tournament Backend Service...');
  console.log(`[Config] Environment: ${env.NODE_ENV}`);
  console.log(`[Config] Port: ${PORT}`);

  // Test Supabase connection
  const dbHealth = await testSupabaseConnection();
  if (dbHealth.connected) {
    console.log(`✅ Supabase Database Connected (${dbHealth.latencyMs}ms)`);
  } else {
    console.warn(`⚠️ Supabase connection warning: ${dbHealth.error || 'Check network / credentials'}`);
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🏆 [SCI CUP Server] API listening on http://0.0.0.0:${PORT}`);
    console.log(`👉 Health check: http://localhost:${PORT}/api/health`);
    console.log(`👉 Tournaments: http://localhost:${PORT}/api/tournaments`);
    console.log(`👉 Legacy DB endpoint: http://localhost:${PORT}/api/db`);
  });

  // Graceful shutdown
  const shutdown = (signal: string) => {
    console.log(`\nReceived ${signal}. Gracefully shutting down...`);
    server.close(() => {
      console.log('HTTP server closed.');
      process.exit(0);
    });

    // Force shutdown after 5 seconds if lingering
    setTimeout(() => {
      console.error('Forced shutdown due to timeout');
      process.exit(1);
    }, 5000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

bootstrap().catch((err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});
