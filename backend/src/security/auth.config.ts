const DEV_ACCESS_SECRET = 'local-development-access-secret-change-me-32';
const DEV_REFRESH_SECRET = 'local-development-refresh-secret-change-me-32';

export function getAuthSecret(name: 'JWT_ACCESS_SECRET' | 'JWT_REFRESH_SECRET') {
  const configured = process.env[name];
  if (configured && configured.length >= 32) return configured;

  if (process.env.NODE_ENV === 'production') {
    throw new Error(`${name} must be configured with at least 32 characters in production.`);
  }

  return name === 'JWT_ACCESS_SECRET' ? DEV_ACCESS_SECRET : DEV_REFRESH_SECRET;
}
