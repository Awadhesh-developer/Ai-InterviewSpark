# AI-InterviewSpark Implementation Roadmap
**Branch**: `claude/codebase-feature-upgrade-analysis-011CUrWanFkD523YLpf2cXTA`
**Date**: 2025-11-06

This roadmap provides **actionable tasks** with specific file locations and implementation guidance for each upgrade phase.

---

## Quick Reference

| Phase | Duration | Goal | Status |
|-------|----------|------|--------|
| **Phase 1** | Weeks 1-3 | Critical Fixes → Production Ready | 🔴 Not Started |
| **Phase 2** | Weeks 4-7 | Core Feature Completion | 🔴 Not Started |
| **Phase 3** | Weeks 8-11 | UX Enhancement | 🔴 Not Started |
| **Phase 4** | Weeks 12-16 | Scale & Polish | 🔴 Not Started |

---

## PHASE 1: Critical Fixes (Weeks 1-3)
**Goal**: Make platform production-ready
**Priority**: 🔴 CRITICAL

### Week 1: Authentication System Completion

#### Task 1.1: Implement Forgot Password Flow
**File**: `apps/api/src/routes/auth.ts`
**Current Line**: ~50

**Steps**:
```typescript
// 1. Add password reset token schema to database
// File: apps/api/src/database/schema.ts

export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: text('id').primaryKey().notNull(),
  userId: text('user_id').references(() => users.id).notNull(),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  usedAt: timestamp('used_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 2. Create migration
// Run: npm run db:generate

// 3. Implement forgot password endpoint
// File: apps/api/src/routes/auth.ts

import crypto from 'crypto';
import { eq, and, gt } from 'drizzle-orm';
import { passwordResetTokens } from '../database/schema';
import { emailService } from '../services/emailService';

router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;

    // Validate input
    const schema = z.object({
      email: z.string().email()
    });
    const { email: validatedEmail } = schema.parse({ email });

    // Find user
    const user = await db.select().from(users)
      .where(eq(users.email, validatedEmail))
      .limit(1);

    // Always return success (security: don't reveal if email exists)
    if (!user[0]) {
      return res.json({
        success: true,
        message: 'If the email exists, a reset link has been sent.'
      });
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    // Store token
    await db.insert(passwordResetTokens).values({
      id: crypto.randomUUID(),
      userId: user[0].id,
      token,
      expiresAt,
    });

    // Send email
    await emailService.sendPasswordResetEmail(user[0].email, token);

    res.json({
      success: true,
      message: 'If the email exists, a reset link has been sent.'
    });

  } catch (error) {
    next(error);
  }
});

// 4. Create email template
// File: apps/api/src/templates/password-reset.html
```

**Email Template** (`apps/api/src/templates/password-reset.html`):
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Reset Your Password - AI-InterviewSpark</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2>Reset Your Password</h2>
    <p>Hi {{userName}},</p>
    <p>We received a request to reset your password for your AI-InterviewSpark account.</p>
    <p>Click the button below to reset your password:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{resetUrl}}"
         style="background-color: #4F46E5; color: white; padding: 12px 24px;
                text-decoration: none; border-radius: 6px; display: inline-block;">
        Reset Password
      </a>
    </div>
    <p>Or copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #4F46E5;">{{resetUrl}}</p>
    <p><strong>This link will expire in 1 hour.</strong></p>
    <p>If you didn't request a password reset, please ignore this email.</p>
    <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
    <p style="color: #666; font-size: 12px;">
      AI-InterviewSpark | Your AI-Powered Interview Coach
    </p>
  </div>
</body>
</html>
```

**Update Email Service** (`apps/api/src/services/emailService.ts`):
```typescript
import fs from 'fs/promises';
import path from 'path';
import Handlebars from 'handlebars';

class EmailService {
  // ... existing code ...

  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    const resetUrl = `${process.env.WEB_URL}/auth/reset-password?token=${token}`;

    // Load and compile template
    const templatePath = path.join(__dirname, '../templates/password-reset.html');
    const templateSource = await fs.readFile(templatePath, 'utf-8');
    const template = Handlebars.compile(templateSource);

    const html = template({
      resetUrl,
      userName: to.split('@')[0] // Extract name from email
    });

    await this.sendEmail({
      to,
      subject: 'Reset Your Password - AI-InterviewSpark',
      html,
    });
  }
}

// Add Handlebars dependency:
// npm install handlebars @types/handlebars --save
```

**Estimated Time**: 1 day

---

#### Task 1.2: Implement Reset Password Flow
**File**: `apps/api/src/routes/auth.ts`

```typescript
router.post('/reset-password', async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    // Validate input
    const schema = z.object({
      token: z.string().min(1),
      newPassword: z.string().min(8)
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    });
    const validated = schema.parse({ token, newPassword });

    // Find and validate token
    const resetToken = await db.select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.token, validated.token),
          gt(passwordResetTokens.expiresAt, new Date()),
          eq(passwordResetTokens.usedAt, null)
        )
      )
      .limit(1);

    if (!resetToken[0]) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(validated.newPassword, 10);

    // Update user password
    await db.update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, resetToken[0].userId));

    // Mark token as used
    await db.update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokens.id, resetToken[0].id));

    // Send confirmation email
    const user = await db.select().from(users)
      .where(eq(users.id, resetToken[0].userId))
      .limit(1);

    await emailService.sendPasswordChangedEmail(user[0].email);

    res.json({
      success: true,
      message: 'Password reset successful. You can now log in with your new password.'
    });

  } catch (error) {
    next(error);
  }
});
```

**Frontend Component** (`apps/web/src/app/auth/reset-password/page.tsx`):
```typescript
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => router.push('/auth/login'), 3000);
      } else {
        setError(data.message || 'Password reset failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold text-green-600">Password Reset Successful!</h2>
        <p className="mt-4">Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-10">
      <h1 className="text-3xl font-bold mb-6">Reset Your Password</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">New Password</label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            placeholder="Enter new password"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Confirm Password</label>
          <Input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            placeholder="Confirm new password"
          />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Resetting...' : 'Reset Password'}
        </Button>
      </form>
    </div>
  );
}
```

**Estimated Time**: 1 day

---

#### Task 1.3: Implement Token Refresh Mechanism
**File**: `apps/api/src/routes/auth.ts`

```typescript
// 1. Update JWT service to generate refresh tokens
// File: apps/api/src/services/jwtService.ts

interface TokenPayload {
  userId: string;
  email: string;
  type: 'access' | 'refresh';
}

class JWTService {
  generateAccessToken(userId: string, email: string): string {
    return jwt.sign(
      { userId, email, type: 'access' },
      process.env.JWT_SECRET!,
      { expiresIn: '15m' } // Short-lived access token
    );
  }

  generateRefreshToken(userId: string, email: string): string {
    return jwt.sign(
      { userId, email, type: 'refresh' },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: '7d' } // Long-lived refresh token
    );
  }

  verifyRefreshToken(token: string): TokenPayload {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as TokenPayload;
  }
}

// 2. Add refresh tokens table to schema
// File: apps/api/src/database/schema.ts

export const refreshTokens = pgTable('refresh_tokens', {
  id: text('id').primaryKey().notNull(),
  userId: text('user_id').references(() => users.id).notNull(),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  revokedAt: timestamp('revoked_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 3. Update login to return both tokens
// File: apps/api/src/routes/auth.ts

router.post('/login', async (req, res, next) => {
  try {
    // ... existing validation ...

    const accessToken = jwtService.generateAccessToken(user.id, user.email);
    const refreshToken = jwtService.generateRefreshToken(user.id, user.email);

    // Store refresh token
    await db.insert(refreshTokens).values({
      id: crypto.randomUUID(),
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    res.json({
      success: true,
      data: {
        user: { id: user.id, email: user.email, name: user.name },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
});

// 4. Implement refresh endpoint
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token required'
      });
    }

    // Verify token
    const payload = jwtService.verifyRefreshToken(refreshToken);

    if (payload.type !== 'refresh') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token type'
      });
    }

    // Check if token exists and is not revoked
    const storedToken = await db.select()
      .from(refreshTokens)
      .where(
        and(
          eq(refreshTokens.token, refreshToken),
          eq(refreshTokens.revokedAt, null),
          gt(refreshTokens.expiresAt, new Date())
        )
      )
      .limit(1);

    if (!storedToken[0]) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token'
      });
    }

    // Generate new access token
    const newAccessToken = jwtService.generateAccessToken(
      payload.userId,
      payload.email
    );

    res.json({
      success: true,
      data: {
        accessToken: newAccessToken,
      },
    });

  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }
    next(error);
  }
});
```

**Frontend Token Management** (`apps/web/src/lib/auth.ts`):
```typescript
// Token refresh utility with automatic retry
let refreshPromise: Promise<string> | null = null;

export async function refreshAccessToken(): Promise<string> {
  // Prevent multiple simultaneous refresh requests
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');

      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error('Token refresh failed');
      }

      localStorage.setItem('accessToken', data.data.accessToken);
      return data.data.accessToken;

    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// Axios interceptor for automatic token refresh
import axios from 'axios';

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const newToken = await refreshAccessToken();
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axios(originalRequest);
      } catch (refreshError) {
        // Redirect to login
        window.location.href = '/auth/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
```

**Environment Variables**:
```bash
# Add to apps/api/.env
JWT_SECRET=your-access-token-secret-min-32-chars
JWT_REFRESH_SECRET=your-refresh-token-secret-min-32-chars
```

**Estimated Time**: 1 day

---

#### Task 1.4: Implement Email Verification
**File**: `apps/api/src/routes/auth.ts`

```typescript
// 1. Add email verification tokens table
// File: apps/api/src/database/schema.ts

export const emailVerificationTokens = pgTable('email_verification_tokens', {
  id: text('id').primaryKey().notNull(),
  userId: text('user_id').references(() => users.id).notNull(),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  verifiedAt: timestamp('verified_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 2. Add emailVerified field to users table
// File: apps/api/src/database/schema.ts (modify users table)

export const users = pgTable('users', {
  // ... existing fields ...
  emailVerified: boolean('email_verified').default(false).notNull(),
});

// 3. Send verification email on registration
// File: apps/api/src/routes/auth.ts

router.post('/register', async (req, res, next) => {
  try {
    // ... existing registration logic ...

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await db.insert(emailVerificationTokens).values({
      id: crypto.randomUUID(),
      userId: newUser.id,
      token: verificationToken,
      expiresAt,
    });

    // Send verification email
    await emailService.sendVerificationEmail(email, verificationToken);

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email to verify your account.',
      data: { userId: newUser.id }
    });

  } catch (error) {
    next(error);
  }
});

// 4. Implement verification endpoint
router.post('/verify-email', async (req, res, next) => {
  try {
    const { token } = req.body;

    const verificationToken = await db.select()
      .from(emailVerificationTokens)
      .where(
        and(
          eq(emailVerificationTokens.token, token),
          gt(emailVerificationTokens.expiresAt, new Date()),
          eq(emailVerificationTokens.verifiedAt, null)
        )
      )
      .limit(1);

    if (!verificationToken[0]) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }

    // Mark user as verified
    await db.update(users)
      .set({ emailVerified: true })
      .where(eq(users.id, verificationToken[0].userId));

    // Mark token as used
    await db.update(emailVerificationTokens)
      .set({ verifiedAt: new Date() })
      .where(eq(emailVerificationTokens.id, verificationToken[0].id));

    res.json({
      success: true,
      message: 'Email verified successfully!'
    });

  } catch (error) {
    next(error);
  }
});
```

**Estimated Time**: 1 day

---

### Week 2: Email Service & Testing

#### Task 2.1: Complete Email Service Integration
**Files**: `apps/api/src/services/emailService.ts`, `apps/api/src/templates/`

**Create Email Templates**:
1. `password-reset.html` (done in Task 1.1)
2. `email-verification.html`
3. `password-changed.html`
4. `expert-session-booked.html`
5. `interview-completed.html`

**Email Service Enhancement**:
```typescript
// File: apps/api/src/services/emailService.ts

import nodemailer from 'nodemailer';
import Handlebars from 'handlebars';
import fs from 'fs/promises';
import path from 'path';
import Bull from 'bull';

// Create email queue for async processing
const emailQueue = new Bull('email', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
});

class EmailService {
  private transporter: nodemailer.Transporter;
  private templatesCache: Map<string, HandlebarsTemplateDelegate> = new Map();

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.sendgrid.net',
      port: parseInt(process.env.SMTP_PORT || '587'),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  private async loadTemplate(templateName: string): Promise<HandlebarsTemplateDelegate> {
    if (this.templatesCache.has(templateName)) {
      return this.templatesCache.get(templateName)!;
    }

    const templatePath = path.join(__dirname, `../templates/${templateName}.html`);
    const templateSource = await fs.readFile(templatePath, 'utf-8');
    const template = Handlebars.compile(templateSource);

    this.templatesCache.set(templateName, template);
    return template;
  }

  async queueEmail(options: {
    to: string;
    subject: string;
    template: string;
    data: Record<string, any>;
  }): Promise<void> {
    await emailQueue.add(options, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });
  }

  async sendEmail(options: {
    to: string;
    subject: string;
    html: string;
  }): Promise<void> {
    await this.transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@interviewspark.com',
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
  }

  async sendVerificationEmail(to: string, token: string): Promise<void> {
    const template = await this.loadTemplate('email-verification');
    const verificationUrl = `${process.env.WEB_URL}/auth/verify-email?token=${token}`;

    const html = template({ verificationUrl, email: to });

    await this.queueEmail({
      to,
      subject: 'Verify Your Email - AI-InterviewSpark',
      template: 'email-verification',
      data: { verificationUrl, email: to },
    });
  }

  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    const template = await this.loadTemplate('password-reset');
    const resetUrl = `${process.env.WEB_URL}/auth/reset-password?token=${token}`;

    const html = template({ resetUrl, userName: to.split('@')[0] });

    await this.queueEmail({
      to,
      subject: 'Reset Your Password - AI-InterviewSpark',
      template: 'password-reset',
      data: { resetUrl, userName: to.split('@')[0] },
    });
  }

  async sendPasswordChangedEmail(to: string): Promise<void> {
    const template = await this.loadTemplate('password-changed');
    const html = template({ email: to });

    await this.queueEmail({
      to,
      subject: 'Your Password Has Been Changed - AI-InterviewSpark',
      template: 'password-changed',
      data: { email: to },
    });
  }

  async sendInterviewCompletedEmail(to: string, sessionId: string): Promise<void> {
    const template = await this.loadTemplate('interview-completed');
    const resultsUrl = `${process.env.WEB_URL}/dashboard/interviews/${sessionId}/results`;

    const html = template({ resultsUrl });

    await this.queueEmail({
      to,
      subject: 'Your Interview Results Are Ready! - AI-InterviewSpark',
      template: 'interview-completed',
      data: { resultsUrl },
    });
  }
}

// Process email queue
emailQueue.process(async (job) => {
  const emailService = new EmailService();
  const { to, subject, template, data } = job.data;

  const templateFunc = await emailService['loadTemplate'](template);
  const html = templateFunc(data);

  await emailService.sendEmail({ to, subject, html });
});

export const emailService = new EmailService();

// Dependencies to install:
// npm install bull @types/bull --save
```

**Environment Variables**:
```bash
# Add to apps/api/.env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
SMTP_FROM=noreply@interviewspark.com
WEB_URL=http://localhost:3000

REDIS_HOST=localhost
REDIS_PORT=6379
```

**Estimated Time**: 2 days

---

#### Task 2.2: Environment Variable Validation
**File**: `apps/api/src/config/env.ts` (create new file)

```typescript
import { z } from 'zod';

const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3001'),

  // Database
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid PostgreSQL URL'),

  // JWT
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),

  // Email
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.string().transform(Number),
  SMTP_USER: z.string().min(1),
  SMTP_PASS: z.string().min(1),
  SMTP_FROM: z.string().email(),

  // Redis
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().transform(Number).default('6379'),

  // AI Services (required)
  OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY is required'),

  // AI Services (optional with fallback)
  GEMINI_API_KEY: z.string().optional(),
  PERPLEXITY_API_KEY: z.string().optional(),
  CLAUDE_API_KEY: z.string().optional(),

  // Emotional Analysis (optional - will use mock data if not provided)
  MOTIVEL_API_KEY: z.string().optional(),
  MOODME_API_KEY: z.string().optional(),

  // AWS S3
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),
  AWS_REGION: z.string().default('us-east-1'),

  // OAuth
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  FACEBOOK_APP_ID: z.string().optional(),
  FACEBOOK_APP_SECRET: z.string().optional(),
  LINKEDIN_CLIENT_ID: z.string().optional(),
  LINKEDIN_CLIENT_SECRET: z.string().optional(),

  // Twilio (optional)
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),

  // Frontend URL
  WEB_URL: z.string().url('WEB_URL must be a valid URL'),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(): Env {
  try {
    const validated = envSchema.parse(process.env);

    console.log('✅ Environment variables validated successfully');

    // Log optional features status
    console.log('\nOptional Features Status:');
    console.log('- Gemini AI:', validated.GEMINI_API_KEY ? '✅' : '❌ (will use OpenAI only)');
    console.log('- Perplexity:', validated.PERPLEXITY_API_KEY ? '✅' : '❌ (disabled)');
    console.log('- Claude AI:', validated.CLAUDE_API_KEY ? '✅' : '❌ (disabled)');
    console.log('- Motivel (Voice Emotion):', validated.MOTIVEL_API_KEY ? '✅' : '⚠️  (using mock data)');
    console.log('- Moodme (Facial Emotion):', validated.MOODME_API_KEY ? '✅' : '⚠️  (using mock data)');
    console.log('- AWS S3:', validated.AWS_ACCESS_KEY_ID ? '✅' : '⚠️  (local storage)');
    console.log('- SMS Notifications:', validated.TWILIO_ACCOUNT_SID ? '✅' : '❌ (disabled)');
    console.log('- Google OAuth:', validated.GOOGLE_CLIENT_ID ? '✅' : '❌ (disabled)');
    console.log('- Facebook OAuth:', validated.FACEBOOK_APP_ID ? '✅' : '❌ (disabled)');
    console.log('- LinkedIn OAuth:', validated.LINKEDIN_CLIENT_ID ? '✅' : '❌ (disabled)');

    return validated;

  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment variable validation failed:\n');
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      console.error('\nPlease check your .env file and ensure all required variables are set.');
      console.error('See .env.example for reference.\n');
    }

    process.exit(1);
  }
}
```

**Update Server Startup** (`apps/api/src/index.ts`):
```typescript
import { validateEnv } from './config/env';

// Validate environment variables before starting server
const env = validateEnv();

// ... rest of server startup code ...
```

**Create `.env.example`** (`apps/api/.env.example`):
```bash
# ===========================================
# AI-InterviewSpark API Environment Variables
# ===========================================

# Server Configuration
NODE_ENV=development
PORT=3001

# Database (REQUIRED)
DATABASE_URL=postgresql://username:password@host:5432/dbname

# JWT Secrets (REQUIRED - Generate with: openssl rand -base64 32)
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long
JWT_REFRESH_SECRET=your-super-secret-refresh-jwt-key-min-32-characters-long

# Email Configuration (REQUIRED for auth flows)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
SMTP_FROM=noreply@interviewspark.com

# Redis (REQUIRED for caching and queues)
REDIS_HOST=localhost
REDIS_PORT=6379

# OpenAI (REQUIRED - Primary AI provider)
OPENAI_API_KEY=sk-...

# AI Providers (OPTIONAL - Fallback providers)
GEMINI_API_KEY=your-gemini-api-key
PERPLEXITY_API_KEY=your-perplexity-api-key
CLAUDE_API_KEY=your-claude-api-key

# Emotional Analysis (OPTIONAL - Will use mock data if not provided)
MOTIVEL_API_KEY=your-motivel-api-key
MOODME_API_KEY=your-moodme-api-key

# AWS S3 (OPTIONAL - For media storage)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_S3_BUCKET=your-bucket-name
AWS_REGION=us-east-1

# OAuth Providers (OPTIONAL)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret

# Twilio (OPTIONAL - For SMS notifications)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Frontend URL (REQUIRED)
WEB_URL=http://localhost:3000
```

**Estimated Time**: 1 day

---

#### Task 2.3: Initial E2E Test Suite
**File**: `apps/api/src/tests/e2e/` (create new directory)

**Install Dependencies**:
```bash
cd apps/api
npm install --save-dev @playwright/test supertest @types/supertest
```

**Test Setup** (`apps/api/src/tests/e2e/setup.ts`):
```typescript
import { beforeAll, afterAll } from 'vitest';
import { db } from '../../database/connection';
import { users, interviewSessions } from '../../database/schema';

export async function setupTestDatabase() {
  // Clean database before tests
  await db.delete(interviewSessions);
  await db.delete(users);
}

export async function teardownTestDatabase() {
  // Clean up after tests
  await db.delete(interviewSessions);
  await db.delete(users);
}

beforeAll(async () => {
  await setupTestDatabase();
});

afterAll(async () => {
  await teardownTestDatabase();
});
```

**Auth Flow Tests** (`apps/api/src/tests/e2e/auth.test.ts`):
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../app';
import { setupTestDatabase } from './setup';

describe('Authentication E2E Tests', () => {
  beforeEach(async () => {
    await setupTestDatabase();
  });

  describe('User Registration Flow', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
          name: 'Test User',
        })
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('verify your email'),
      });
    });

    it('should reject registration with weak password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'weak',
          name: 'Test User',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should prevent duplicate email registration', async () => {
      // First registration
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
          name: 'Test User',
        });

      // Duplicate registration
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
          name: 'Test User 2',
        })
        .expect(400);

      expect(response.body.message).toContain('already exists');
    });
  });

  describe('Login Flow', () => {
    it('should login successfully with valid credentials', async () => {
      // Register user
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
          name: 'Test User',
        });

      // Login
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
          user: {
            email: 'test@example.com',
            name: 'Test User',
          },
        },
      });
    });

    it('should reject login with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword123!',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Password Reset Flow', () => {
    it('should complete full password reset flow', async () => {
      // 1. Register user
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'OldPassword123!',
          name: 'Test User',
        });

      // 2. Request password reset
      const resetResponse = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'test@example.com' })
        .expect(200);

      expect(resetResponse.body.success).toBe(true);

      // 3. Get reset token from database (in real test, you'd intercept email)
      const tokenResult = await db.select()
        .from(passwordResetTokens)
        .where(eq(passwordResetTokens.userId, expect.any(String)))
        .limit(1);

      const resetToken = tokenResult[0].token;

      // 4. Reset password
      const updateResponse = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          newPassword: 'NewPassword123!',
        })
        .expect(200);

      expect(updateResponse.body.success).toBe(true);

      // 5. Login with new password
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'NewPassword123!',
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
    });
  });

  describe('Token Refresh Flow', () => {
    it('should refresh access token successfully', async () => {
      // Register and login
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
          name: 'Test User',
        });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
        });

      const { refreshToken } = loginResponse.body.data;

      // Refresh token
      const refreshResponse = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(refreshResponse.body).toMatchObject({
        success: true,
        data: {
          accessToken: expect.any(String),
        },
      });
    });
  });
});
```

**Interview Flow Tests** (`apps/api/src/tests/e2e/interview.test.ts`):
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../app';
import { setupTestDatabase } from './setup';

describe('Interview Flow E2E Tests', () => {
  let accessToken: string;

  beforeEach(async () => {
    await setupTestDatabase();

    // Register and login to get access token
    await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'Password123!',
        name: 'Test User',
      });

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'Password123!',
      });

    accessToken = loginResponse.body.data.accessToken;
  });

  it('should complete full interview lifecycle', async () => {
    // 1. Create interview session
    const createResponse = await request(app)
      .post('/api/interviews/sessions')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        jobTitle: 'Software Engineer',
        industry: 'Technology',
        difficulty: 'medium',
        sessionType: 'text',
      })
      .expect(201);

    const sessionId = createResponse.body.data.id;

    // 2. Generate questions
    const questionsResponse = await request(app)
      .post('/api/interviews/generate')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        sessionId,
        jobTitle: 'Software Engineer',
        industry: 'Technology',
        difficulty: 'medium',
        count: 5,
      })
      .expect(200);

    expect(questionsResponse.body.data.questions).toHaveLength(5);

    const questionId = questionsResponse.body.data.questions[0].id;

    // 3. Start interview
    await request(app)
      .put(`/api/interviews/sessions/${sessionId}/start`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    // 4. Submit answer
    const answerResponse = await request(app)
      .post(`/api/interviews/sessions/${sessionId}/answers`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        questionId,
        answerText: 'This is my answer to the interview question.',
      })
      .expect(201);

    expect(answerResponse.body.success).toBe(true);

    // 5. Get feedback
    const feedbackResponse = await request(app)
      .post(`/api/interviews/questions/${questionId}/feedback`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        answerId: answerResponse.body.data.id,
      })
      .expect(200);

    expect(feedbackResponse.body.data).toHaveProperty('score');
    expect(feedbackResponse.body.data).toHaveProperty('strengths');
    expect(feedbackResponse.body.data).toHaveProperty('improvements');

    // 6. Complete interview
    await request(app)
      .put(`/api/interviews/sessions/${sessionId}/complete`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    // 7. Get results
    const resultsResponse = await request(app)
      .get(`/api/interviews/sessions/${sessionId}/feedback`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(resultsResponse.body.data).toHaveProperty('overallScore');
  });
});
```

**Run Tests**:
```bash
# Update package.json scripts
{
  "test:e2e": "vitest run src/tests/e2e",
  "test:e2e:watch": "vitest watch src/tests/e2e"
}

# Run tests
npm run test:e2e
```

**Estimated Time**: 2 days

---

### Week 3: Security & Documentation

#### Task 3.1: Security Hardening
**File**: `apps/api/src/middleware/security.ts`

```typescript
import helmet from 'helmet';
import csrf from 'csurf';
import { rateLimit } from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';

// CSRF Protection
export const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  },
});

// Enhanced Helmet Configuration
export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // Adjust for production
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", process.env.WEB_URL || 'http://localhost:3000'],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
});

// Enhanced Rate Limiting
export const strictRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // More strict for auth endpoints
  skipSuccessfulRequests: true,
});

// NoSQL Injection Protection
export const sanitizeData = mongoSanitize({
  replaceWith: '_',
});

// HTTP Parameter Pollution Protection
export const preventHpp = hpp();

// XSS Prevention Middleware
export function xssProtection(req: Request, res: Response, next: NextFunction) {
  // Additional XSS checks can be added here
  next();
}
```

**Update App Configuration** (`apps/api/src/app.ts` or `index.ts`):
```typescript
import {
  helmetConfig,
  csrfProtection,
  strictRateLimit,
  authRateLimit,
  sanitizeData,
  preventHpp,
} from './middleware/security';

// Apply security middleware
app.use(helmetConfig);
app.use(sanitizeData);
app.use(preventHpp);

// Rate limiting
app.use('/api/', strictRateLimit);
app.use('/api/auth/', authRateLimit);

// CSRF protection (apply to routes that modify data)
app.use('/api/', csrfProtection);

// Add CSRF token endpoint
app.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Dependencies to install:
// npm install csurf express-mongo-sanitize hpp --save
// npm install @types/csurf --save-dev
```

**Estimated Time**: 1 day

---

#### Task 3.2: API Documentation with Swagger
**File**: `apps/api/src/swagger.ts` (create new file)

```bash
# Install dependencies
npm install swagger-jsdoc swagger-ui-express --save
npm install @types/swagger-jsdoc @types/swagger-ui-express --save-dev
```

```typescript
// File: apps/api/src/swagger.ts

import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AI-InterviewSpark API',
      version: '1.0.0',
      description: 'AI-powered mock interview platform API documentation',
      contact: {
        name: 'API Support',
        email: 'support@interviewspark.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server',
      },
      {
        url: 'https://api.interviewspark.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            emailVerified: { type: 'boolean' },
          },
        },
        InterviewSession: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            userId: { type: 'string' },
            jobTitle: { type: 'string' },
            industry: { type: 'string' },
            difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] },
            sessionType: { type: 'string', enum: ['video', 'voice', 'text'] },
            status: { type: 'string', enum: ['pending', 'in_progress', 'completed'] },
            overallScore: { type: 'number', nullable: true },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            errors: { type: 'array', items: { type: 'string' } },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts'], // Path to the API routes
};

const specs = swaggerJsdoc(options);

export function setupSwagger(app: Express): void {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'AI-InterviewSpark API Docs',
  }));

  // Serve raw OpenAPI spec as JSON
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });

  console.log('📚 API Documentation available at /api-docs');
}
```

**Add Swagger Annotations to Routes** (`apps/api/src/routes/auth.ts`):
```typescript
/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: Password123!
 *               name:
 *                 type: string
 *                 example: John Doe
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Registration successful
 *                 data:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/register', async (req, res, next) => {
  // ... implementation ...
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login with email and password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', async (req, res, next) => {
  // ... implementation ...
});

// Add similar annotations to other endpoints...
```

**Update Server** (`apps/api/src/index.ts`):
```typescript
import { setupSwagger } from './swagger';

// ... after app initialization ...
setupSwagger(app);
```

**Estimated Time**: 1.5 days

---

## PHASE 2: Core Feature Completion (Weeks 4-7)
**Goal**: Complete advertised features
**Priority**: 🟠 HIGH

### Week 4: Payment Integration

#### Task 4.1: Stripe Setup & Configuration
**File**: `apps/api/src/services/paymentService.ts` (create new file)

```bash
# Install Stripe SDK
npm install stripe --save
npm install @types/stripe --save-dev
```

```typescript
// File: apps/api/src/services/paymentService.ts

import Stripe from 'stripe';
import { db } from '../database/connection';
import {
  subscriptionPlans,
  userSubscriptions,
  payments,
  expertSessions,
} from '../database/schema';
import { eq } from 'drizzle-orm';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

export class PaymentService {
  async createCheckoutSession(options: {
    userId: string;
    planId?: string;
    expertSessionId?: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<Stripe.Checkout.Session> {
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

    if (options.planId) {
      // Subscription plan
      const plan = await db.select().from(subscriptionPlans)
        .where(eq(subscriptionPlans.id, options.planId))
        .limit(1);

      if (!plan[0]) {
        throw new Error('Plan not found');
      }

      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: plan[0].name,
            description: plan[0].description || undefined,
          },
          recurring: {
            interval: plan[0].billingInterval as 'month' | 'year',
          },
          unit_amount: Math.round(plan[0].price * 100), // Convert to cents
        },
        quantity: 1,
      });
    }

    if (options.expertSessionId) {
      // Expert session
      const session = await db.select().from(expertSessions)
        .where(eq(expertSessions.id, options.expertSessionId))
        .limit(1);

      if (!session[0]) {
        throw new Error('Expert session not found');
      }

      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Expert Coaching Session',
            description: `1:1 session with expert`,
          },
          unit_amount: Math.round(session[0].price * 100),
        },
        quantity: 1,
      });
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      customer_email: options.userId, // You'd typically fetch user email
      line_items: lineItems,
      mode: options.planId ? 'subscription' : 'payment',
      success_url: options.successUrl,
      cancel_url: options.cancelUrl,
      metadata: {
        userId: options.userId,
        planId: options.planId || '',
        expertSessionId: options.expertSessionId || '',
      },
    });

    return checkoutSession;
  }

  async handleWebhook(
    payload: string | Buffer,
    signature: string
  ): Promise<void> {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutComplete(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionCancel(event.data.object as Stripe.Subscription);
        break;
      case 'invoice.payment_succeeded':
        await this.handlePaymentSuccess(event.data.object as Stripe.Invoice);
        break;
      case 'invoice.payment_failed':
        await this.handlePaymentFailure(event.data.object as Stripe.Invoice);
        break;
    }
  }

  private async handleCheckoutComplete(session: Stripe.Checkout.Session): Promise<void> {
    const { userId, planId, expertSessionId } = session.metadata!;

    // Record payment
    await db.insert(payments).values({
      id: crypto.randomUUID(),
      userId,
      stripePaymentId: session.payment_intent as string,
      amount: session.amount_total! / 100,
      currency: session.currency!,
      status: 'succeeded',
      paymentType: planId ? 'subscription' : 'expert_session',
    });

    if (planId) {
      // Create subscription
      await db.insert(userSubscriptions).values({
        id: crypto.randomUUID(),
        userId,
        planId,
        stripeSubscriptionId: session.subscription as string,
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      });
    }

    if (expertSessionId) {
      // Update expert session status
      await db.update(expertSessions)
        .set({ paymentStatus: 'paid' })
        .where(eq(expertSessions.id, expertSessionId));
    }
  }

  private async handleSubscriptionUpdate(subscription: Stripe.Subscription): Promise<void> {
    await db.update(userSubscriptions)
      .set({
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      })
      .where(eq(userSubscriptions.stripeSubscriptionId, subscription.id));
  }

  private async handleSubscriptionCancel(subscription: Stripe.Subscription): Promise<void> {
    await db.update(userSubscriptions)
      .set({
        status: 'canceled',
        canceledAt: new Date(),
      })
      .where(eq(userSubscriptions.stripeSubscriptionId, subscription.id));
  }

  private async handlePaymentSuccess(invoice: Stripe.Invoice): Promise<void> {
    // Record successful payment
    await db.insert(payments).values({
      id: crypto.randomUUID(),
      userId: invoice.metadata?.userId || '',
      stripePaymentId: invoice.payment_intent as string,
      amount: invoice.amount_paid / 100,
      currency: invoice.currency,
      status: 'succeeded',
      paymentType: 'subscription',
    });
  }

  private async handlePaymentFailure(invoice: Stripe.Invoice): Promise<void> {
    // Handle failed payment
    await db.update(userSubscriptions)
      .set({ status: 'past_due' })
      .where(eq(userSubscriptions.stripeSubscriptionId, invoice.subscription as string));
  }

  async cancelSubscription(subscriptionId: string): Promise<void> {
    const subscription = await db.select().from(userSubscriptions)
      .where(eq(userSubscriptions.id, subscriptionId))
      .limit(1);

    if (!subscription[0]) {
      throw new Error('Subscription not found');
    }

    await stripe.subscriptions.cancel(subscription[0].stripeSubscriptionId);
  }
}

export const paymentService = new PaymentService();
```

**Database Schema Updates** (`apps/api/src/database/schema.ts`):
```typescript
export const subscriptionPlans = pgTable('subscription_plans', {
  id: text('id').primaryKey().notNull(),
  name: text('name').notNull(),
  description: text('description'),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  billingInterval: text('billing_interval').notNull(), // 'month' or 'year'
  features: json('features').$type<string[]>(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const userSubscriptions = pgTable('user_subscriptions', {
  id: text('id').primaryKey().notNull(),
  userId: text('user_id').references(() => users.id).notNull(),
  planId: text('plan_id').references(() => subscriptionPlans.id).notNull(),
  stripeSubscriptionId: text('stripe_subscription_id').notNull(),
  status: text('status').notNull(), // active, past_due, canceled, etc.
  currentPeriodStart: timestamp('current_period_start').notNull(),
  currentPeriodEnd: timestamp('current_period_end').notNull(),
  canceledAt: timestamp('canceled_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const payments = pgTable('payments', {
  id: text('id').primaryKey().notNull(),
  userId: text('user_id').references(() => users.id).notNull(),
  stripePaymentId: text('stripe_payment_id').notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').notNull(),
  status: text('status').notNull(), // succeeded, failed, pending
  paymentType: text('payment_type').notNull(), // subscription, expert_session
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Add price and paymentStatus to expertSessions table
export const expertSessions = pgTable('expert_sessions', {
  // ... existing fields ...
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  paymentStatus: text('payment_status').default('pending').notNull(),
});
```

**Payment Routes** (`apps/api/src/routes/payment.ts`):
```typescript
import express from 'express';
import { paymentService } from '../services/paymentService';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

/**
 * @swagger
 * /api/payment/create-checkout-session:
 *   post:
 *     summary: Create Stripe checkout session
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               planId:
 *                 type: string
 *               expertSessionId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Checkout session created
 */
router.post('/create-checkout-session', authenticateToken, async (req, res, next) => {
  try {
    const { planId, expertSessionId } = req.body;
    const userId = req.user!.userId;

    const session = await paymentService.createCheckoutSession({
      userId,
      planId,
      expertSessionId,
      successUrl: `${process.env.WEB_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${process.env.WEB_URL}/payment/cancel`,
    });

    res.json({
      success: true,
      data: {
        sessionId: session.id,
        url: session.url,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/payment/webhook:
 *   post:
 *     summary: Stripe webhook endpoint
 *     tags: [Payment]
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res, next) => {
  try {
    const signature = req.headers['stripe-signature'] as string;

    await paymentService.handleWebhook(req.body, signature);

    res.json({ received: true });
  } catch (error) {
    next(error);
  }
});

export default router;
```

**Environment Variables**:
```bash
# Add to apps/api/.env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

**Frontend Checkout Component** (`apps/web/src/components/payment/CheckoutButton.tsx`):
```typescript
'use client';

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from '@/components/ui/button';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface CheckoutButtonProps {
  planId?: string;
  expertSessionId?: string;
  children: React.ReactNode;
}

export function CheckoutButton({ planId, expertSessionId, children }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/payment/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({ planId, expertSessionId }),
      });

      const data = await response.json();

      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe not loaded');
      }

      const { error } = await stripe.redirectToCheckout({
        sessionId: data.data.sessionId,
      });

      if (error) {
        console.error('Checkout error:', error);
      }
    } catch (error) {
      console.error('Payment error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleCheckout} disabled={loading}>
      {loading ? 'Loading...' : children}
    </Button>
  );
}

// Dependencies to install:
// cd apps/web && npm install @stripe/stripe-js --save
```

**Estimated Time**: 3 days

---

### Weeks 5-6: Expert Sessions Completion
(Due to length constraints, I'll provide a summary)

**Tasks**:
1. Google Calendar API integration for scheduling
2. Expert availability management
3. Session booking flow completion
4. Agora/Twilio Video integration for live sessions
5. Session reminder system (email/SMS)
6. Rating and review system

**Estimated Time**: 2 weeks

---

### Week 7: Enhanced Test Coverage & Phase 2 Review

**Tasks**:
1. Increase test coverage to 70%+
2. Integration tests for payment flows
3. Expert session booking tests
4. Performance testing with k6/Artillery
5. Code review and refactoring
6. Documentation updates

**Estimated Time**: 1 week

---

## PHASE 3 & 4: Implementation Details

(See FEATURE_UPGRADE_ANALYSIS.md for detailed task breakdown)

---

## Conclusion

This roadmap provides detailed implementation guidance for Phase 1 (Weeks 1-3). Each task includes:
- ✅ Specific file locations
- ✅ Code examples
- ✅ Dependencies to install
- ✅ Time estimates
- ✅ Testing approaches

**Total Phase 1 Estimated Time**: 15 working days (3 weeks)

**Next Steps**:
1. Review and approve roadmap
2. Set up project board with tasks
3. Begin Task 1.1 (Forgot Password Flow)
4. Daily standups to track progress
5. Weekly demos to stakeholders

**Questions or need clarification on any task? Ready to begin implementation!**
