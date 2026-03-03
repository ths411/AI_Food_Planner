import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default("gpt-4.1-mini"),
  MAIL_FROM: z.string().email().default("noreply@example.com"),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(1025),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SENDGRID_API_KEY: z.string().optional(),
  SENDGRID_API_URL: z.string().url().default("https://api.sendgrid.com/v3/mail/send"),
  APP_BASE_URL: z.string().url().default("http://localhost:3000"),
  PLAN_RATE_LIMIT_PER_HOUR: z.coerce.number().default(5),
  CRON_REFRESH: z.string().default("0 6 * * *"),
  SALLING_API_KEY: z.string().optional(),
  SALLING_API_BASE_URL: z.string().url().default("https://api.sallinggroup.com/v1-beta")
});

export const env = envSchema.parse(process.env);

