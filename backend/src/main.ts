import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { WsAdapter } from '@nestjs/platform-ws';
import helmet from 'helmet';
import * as express from 'express';
import { AppModule } from './app.module';
import { EXECUTION_LIMITS } from './security/execution.guard';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // Enforce global request body size limit at HTTP level (128 KB default)
    bodyParser: false, // We'll configure it manually below
  });

  const httpAdapter = app.getHttpAdapter();
  const expressApp = httpAdapter.getInstance() as import('express').Application;

  // ── Request Body Size Limits (Network-level) ───────────────────────────────
  // General API: max 100 KB JSON body
  expressApp.use('/api', express.json({ limit: '100kb' }));
  expressApp.use('/api', express.urlencoded({ extended: true, limit: '100kb' }));

  // Execution endpoints: max 128 KB (source code can be up to 64 KB + overhead)
  expressApp.use('/api/problems/:id/run', express.json({ limit: '128kb' }));
  expressApp.use('/api/problems/:id/submit', express.json({ limit: '128kb' }));

  // Fallback for any other route
  expressApp.use(express.json({ limit: '100kb' }));
  expressApp.use(express.urlencoded({ extended: true, limit: '100kb' }));

  // ── Security Headers (Helmet) ──────────────────────────────────────────────
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: [],
        },
      },
      crossOriginEmbedderPolicy: false,
      hsts: {
        maxAge: 31_536_000,
        includeSubDomains: true,
        preload: true,
      },
      noSniff: true,
      xssFilter: true,
      frameguard: { action: 'deny' },
      hidePoweredBy: true,
    }),
  );

  // ── CORS ───────────────────────────────────────────────────────────────────
  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow mobile app requests, postman, Expo, and web
      callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // ── Global Request Timeout ─────────────────────────────────────────────────
  // Drop connections that take longer than EXEC_MAX_TIMEOUT_MS (default 10s)
  expressApp.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    const timeoutMs = EXECUTION_LIMITS.MAX_TIMEOUT_MS;
    const isExecutionRoute =
      req.path.includes('/run') || req.path.includes('/submit');

    // Apply tighter timeout to execution routes
    const timeout = isExecutionRoute ? timeoutMs : 30_000;

    const timer = setTimeout(() => {
      if (!res.headersSent) {
        res.status(408).json({
          statusCode: 408,
          message: 'Request timeout: code execution took too long.',
          error: 'Request Timeout',
        });
      }
    }, timeout);

    res.on('finish', () => clearTimeout(timer));
    res.on('close', () => clearTimeout(timer));
    next();
  });

  // ── Global Input Validation Pipe ──────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // ── WebSockets Adapter ────────────────────────────────────────────────────
  app.useWebSocketAdapter(new WsAdapter(app));

  const port = process.env.PORT || 4000;
  await app.listen(port);

  console.log(`PSP Lumora Backend running on http://localhost:${port}`);
  console.log(`Security limits: source=${EXECUTION_LIMITS.MAX_SOURCE_CODE_BYTES / 1024}KB, timeout=${EXECUTION_LIMITS.MAX_TIMEOUT_MS}ms, memory=${EXECUTION_LIMITS.MAX_MEMORY_MB}MB, output=${EXECUTION_LIMITS.MAX_OUTPUT_BYTES / 1024}KB`);
  console.log(`Rate limits: run=20/min, submit=10/min, default=100/min`);
}

bootstrap();
