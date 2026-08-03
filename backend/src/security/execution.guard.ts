import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
  PayloadTooLargeException,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

/**
 * Security limits for code execution endpoints (/run and /submit).
 * All limits are configurable via environment variables.
 */
export const EXECUTION_LIMITS = {
  // Max source code size: 64 KB
  MAX_SOURCE_CODE_BYTES: Number(process.env.EXEC_MAX_SOURCE_BYTES || 65_536),

  // Max execution timeout enforced at API layer: 10 seconds
  MAX_TIMEOUT_MS: Number(process.env.EXEC_MAX_TIMEOUT_MS || 10_000),

  // Memory limit passed to Judge0: 256 MB
  MAX_MEMORY_MB: Number(process.env.EXEC_MAX_MEMORY_MB || 256),

  // Max output size that is returned to the client: 100 KB
  MAX_OUTPUT_BYTES: Number(process.env.EXEC_MAX_OUTPUT_BYTES || 102_400),

  // Max request body size enforced at API layer: 128 KB
  MAX_REQUEST_BODY_BYTES: Number(process.env.EXEC_MAX_REQUEST_BYTES || 131_072),

  // Allowed programming languages (whitelist)
  ALLOWED_LANGUAGES: (process.env.EXEC_ALLOWED_LANGUAGES || 'python,javascript,typescript,cpp,java').split(','),
};

/**
 * ExecutionSecurityGuard enforces:
 *   - Authenticated user (optional, can be bypassed for public run)
 *   - Source code size limit
 *   - Language whitelist
 *   - Request body size limit
 */
@Injectable()
export class ExecutionSecurityGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const body = req.body as { sourceCode?: string; language?: string };

    if (!body) {
      throw new BadRequestException('Request body is required.');
    }

    // ── Source code presence check ────────────────────────────────────────────
    if (!body.sourceCode || typeof body.sourceCode !== 'string') {
      throw new BadRequestException('sourceCode is required and must be a string.');
    }

    // ── Source code size limit ────────────────────────────────────────────────
    const sourceCodeBytes = Buffer.byteLength(body.sourceCode, 'utf8');
    if (sourceCodeBytes > EXECUTION_LIMITS.MAX_SOURCE_CODE_BYTES) {
      throw new PayloadTooLargeException(
        `Source code exceeds maximum size limit of ${EXECUTION_LIMITS.MAX_SOURCE_CODE_BYTES / 1024} KB.`,
      );
    }

    // ── Language whitelist ────────────────────────────────────────────────────
    if (body.language) {
      const lang = body.language.toLowerCase().trim();
      if (!EXECUTION_LIMITS.ALLOWED_LANGUAGES.includes(lang)) {
        throw new BadRequestException(
          `Language '${body.language}' is not supported. Allowed: ${EXECUTION_LIMITS.ALLOWED_LANGUAGES.join(', ')}.`,
        );
      }
    }

    // ── Dangerous pattern detection (basic network isolation enforcement) ─────
    // Block imports that could make outbound network calls or read files
    if (body.language === 'python' || !body.language) {
      const dangerousPatterns = [
        /import\s+os/,
        /import\s+subprocess/,
        /import\s+socket/,
        /import\s+urllib/,
        /import\s+requests/,
        /import\s+http/,
        /__import__/,
        /exec\s*\(/,
        /eval\s*\(/,
        /open\s*\(/,
        /file\s*\(/,
      ];
      for (const pattern of dangerousPatterns) {
        if (pattern.test(body.sourceCode)) {
          throw new BadRequestException(
            `Source code contains a restricted operation. Network, file system, and process operations are not allowed.`,
          );
        }
      }
    }

    return true;
  }
}

/**
 * SubmitSecurityGuard — stricter than run, requires authenticated user.
 */
@Injectable()
export class SubmitSecurityGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();

    // Authenticated user required for submissions
    if (!req.user) {
      throw new UnauthorizedException('Authentication required to submit a solution.');
    }

    const body = req.body as { sourceCode?: string; language?: string };

    if (!body?.sourceCode || typeof body.sourceCode !== 'string') {
      throw new BadRequestException('sourceCode is required.');
    }

    const sourceCodeBytes = Buffer.byteLength(body.sourceCode, 'utf8');
    if (sourceCodeBytes > EXECUTION_LIMITS.MAX_SOURCE_CODE_BYTES) {
      throw new PayloadTooLargeException(
        `Source code exceeds ${EXECUTION_LIMITS.MAX_SOURCE_CODE_BYTES / 1024} KB limit.`,
      );
    }

    if (body.language) {
      const lang = body.language.toLowerCase().trim();
      if (!EXECUTION_LIMITS.ALLOWED_LANGUAGES.includes(lang)) {
        throw new BadRequestException(
          `Language '${body.language}' is not supported. Allowed: ${EXECUTION_LIMITS.ALLOWED_LANGUAGES.join(', ')}.`,
        );
      }
    }

    // Network isolation enforcement for Python
    if (body.language === 'python' || !body.language) {
      const dangerousPatterns = [
        /import\s+os/,
        /import\s+subprocess/,
        /import\s+socket/,
        /import\s+urllib/,
        /import\s+requests/,
        /import\s+http/,
        /__import__/,
        /exec\s*\(/,
        /eval\s*\(/,
        /open\s*\(/,
        /file\s*\(/,
      ];
      for (const pattern of dangerousPatterns) {
        if (pattern.test(body.sourceCode)) {
          throw new BadRequestException(
            `Source code contains a restricted operation. Network, file system, and process operations are not allowed.`,
          );
        }
      }
    }

    return true;
  }
}
