import 'dotenv/config';

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

export const env = {
  PORT: parseInt(process.env['PORT'] ?? '3000', 10),
  NODE_ENV: process.env['NODE_ENV'] ?? 'development',

  SUPABASE_URL: requireEnv('SUPABASE_URL'),
  SUPABASE_SERVICE_ROLE_KEY: requireEnv('SUPABASE_SERVICE_ROLE_KEY'),

  SMTP_HOST: process.env['SMTP_HOST'] ?? 'smtp.gmail.com',
  SMTP_PORT: parseInt(process.env['SMTP_PORT'] ?? '587', 10),
  SMTP_USER: process.env['SMTP_USER'] ?? '',
  SMTP_PASS: process.env['SMTP_PASS'] ?? '',
  EMAIL_FROM_NAME: process.env['EMAIL_FROM_NAME'] ?? 'WebinarKit',
  EMAIL_FROM_ADDRESS: process.env['EMAIL_FROM_ADDRESS'] ?? 'no-reply@webinarkit.com',

  APP_URL: process.env['APP_URL'] ?? 'http://localhost:3000',
} as const;
