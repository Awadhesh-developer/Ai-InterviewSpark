// --- START api/tests/services/emailService.test.ts --- //
// Tests for email service functionality

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EmailService } from '../../services/emailService';
import nodemailer from 'nodemailer';

// Mock nodemailer
vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn(),
  },
}));

describe('EmailService', () => {
  let mockTransporter: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock transporter
    mockTransporter = {
      verify: vi.fn().mockResolvedValue(true),
      sendMail: vi.fn().mockResolvedValue({
        messageId: 'mock-message-id',
        response: '250 OK',
      }),
    };

    (nodemailer.createTransport as any).mockReturnValue(mockTransporter);
  });

  describe('initialize', () => {
    it('should initialize email service successfully', async () => {
      await EmailService.initialize();

      expect(nodemailer.createTransport).toHaveBeenCalled();
      expect(mockTransporter.verify).toHaveBeenCalled();
    });

    it('should handle initialization failure gracefully', async () => {
      mockTransporter.verify.mockRejectedValue(new Error('Connection failed'));

      await EmailService.initialize();

      expect(EmailService.isAvailable()).toBe(false);
    });
  });

  describe('sendEmail', () => {
    beforeEach(async () => {
      await EmailService.initialize();
    });

    it('should send email successfully', async () => {
      const result = await EmailService.sendEmail({
        to: 'test@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>',
        text: 'Test content',
      });

      expect(result).toBe(true);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: 'Test Email',
        })
      );
    });

    it('should use default from address', async () => {
      await EmailService.sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        text: 'Test',
      });

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'noreply@interviewspark.com',
        })
      );
    });

    it('should allow custom from address', async () => {
      await EmailService.sendEmail({
        to: 'test@example.com',
        from: 'custom@example.com',
        subject: 'Test',
        text: 'Test',
      });

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'custom@example.com',
        })
      );
    });

    it('should handle send failure gracefully', async () => {
      mockTransporter.sendMail.mockRejectedValue(new Error('Send failed'));

      const result = await EmailService.sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        text: 'Test',
      });

      expect(result).toBe(false);
    });
  });

  describe('sendWelcomeEmail', () => {
    beforeEach(async () => {
      await EmailService.initialize();
    });

    it('should send welcome email with correct template', async () => {
      await EmailService.sendWelcomeEmail('test@example.com', 'John');

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: expect.stringContaining('Welcome'),
          html: expect.stringContaining('John'),
        })
      );
    });

    it('should include user first name in email', async () => {
      await EmailService.sendWelcomeEmail('test@example.com', 'Jane');

      const call = mockTransporter.sendMail.mock.calls[0][0];
      expect(call.html).toContain('Jane');
    });
  });

  describe('sendPasswordResetEmail', () => {
    beforeEach(async () => {
      await EmailService.initialize();
    });

    it('should send password reset email with token', async () => {
      const resetToken = 'test-reset-token-123';

      await EmailService.sendPasswordResetEmail('test@example.com', 'John', resetToken);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: expect.stringContaining('Password'),
          html: expect.stringContaining(resetToken),
        })
      );
    });

    it('should include reset link in email', async () => {
      const resetToken = 'test-reset-token-123';

      await EmailService.sendPasswordResetEmail('test@example.com', 'John', resetToken);

      const call = mockTransporter.sendMail.mock.calls[0][0];
      expect(call.html).toContain('reset-password');
      expect(call.html).toContain(resetToken);
    });
  });

  describe('sendVerificationEmail', () => {
    beforeEach(async () => {
      await EmailService.initialize();
    });

    it('should send verification email with token', async () => {
      const verificationToken = 'test-verification-token-123';

      await EmailService.sendVerificationEmail('test@example.com', 'John', verificationToken);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: expect.stringContaining('Verify'),
          html: expect.stringContaining(verificationToken),
        })
      );
    });

    it('should include verification link in email', async () => {
      const verificationToken = 'test-verification-token-123';

      await EmailService.sendVerificationEmail('test@example.com', 'John', verificationToken);

      const call = mockTransporter.sendMail.mock.calls[0][0];
      expect(call.html).toContain('verify-email');
      expect(call.html).toContain(verificationToken);
    });
  });

  describe('sendInterviewReminder', () => {
    beforeEach(async () => {
      await EmailService.initialize();
    });

    it('should send interview reminder with details', async () => {
      const scheduledTime = new Date('2025-11-15T10:00:00Z');

      await EmailService.sendInterviewReminder(
        'test@example.com',
        'John',
        'Software Engineer Interview',
        scheduledTime
      );

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: expect.stringContaining('Interview Reminder'),
          html: expect.stringContaining('Software Engineer Interview'),
        })
      );
    });
  });

  describe('sendFeedbackReady', () => {
    beforeEach(async () => {
      await EmailService.initialize();
    });

    it('should send feedback ready notification', async () => {
      await EmailService.sendFeedbackReady(
        'test@example.com',
        'John',
        'Software Engineer Interview'
      );

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: expect.stringContaining('Feedback'),
          html: expect.stringContaining('Software Engineer Interview'),
        })
      );
    });
  });

  describe('sendPasswordChangedEmail', () => {
    beforeEach(async () => {
      await EmailService.initialize();
    });

    it('should send password changed confirmation', async () => {
      await EmailService.sendPasswordChangedEmail('test@example.com');

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: expect.stringContaining('Password'),
          html: expect.stringContaining('changed'),
        })
      );
    });

    it('should include security warning', async () => {
      await EmailService.sendPasswordChangedEmail('test@example.com');

      const call = mockTransporter.sendMail.mock.calls[0][0];
      expect(call.html).toContain('didn\'t');
    });
  });

  describe('Email Templates', () => {
    it('should generate welcome template with user name', () => {
      const template = EmailService.getWelcomeTemplate('Alice');

      expect(template.subject).toBeTruthy();
      expect(template.html).toContain('Alice');
      expect(template.text).toContain('Alice');
    });

    it('should generate password reset template with token', () => {
      const token = 'test-token-123';
      const template = EmailService.getPasswordResetTemplate('Bob', token);

      expect(template.subject).toContain('Password');
      expect(template.html).toContain(token);
      expect(template.text).toContain(token);
    });

    it('should generate verification template with token', () => {
      const token = 'verify-token-456';
      const template = EmailService.getEmailVerificationTemplate('Charlie', token);

      expect(template.subject).toContain('Verify');
      expect(template.html).toContain(token);
      expect(template.text).toContain(token);
    });

    it('should generate password changed template', () => {
      const template = EmailService.getPasswordChangedTemplate('test@example.com');

      expect(template.subject).toContain('Password');
      expect(template.html).toContain('changed');
      expect(template.html).toContain('test@example.com');
    });

    it('should include both HTML and text versions', () => {
      const template = EmailService.getWelcomeTemplate('David');

      expect(template.html).toBeTruthy();
      expect(template.text).toBeTruthy();
      expect(template.html.length).toBeGreaterThan(template.text.length);
    });
  });

  describe('isAvailable', () => {
    it('should return true when transporter is initialized', async () => {
      await EmailService.initialize();

      expect(EmailService.isAvailable()).toBe(true);
    });

    it('should return false when initialization fails', async () => {
      mockTransporter.verify.mockRejectedValue(new Error('Failed'));

      await EmailService.initialize();

      expect(EmailService.isAvailable()).toBe(false);
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await EmailService.initialize();
    });

    it('should not throw error on send failure', async () => {
      mockTransporter.sendMail.mockRejectedValue(new Error('SMTP error'));

      await expect(
        EmailService.sendEmail({
          to: 'test@example.com',
          subject: 'Test',
          text: 'Test',
        })
      ).resolves.toBe(false);
    });

    it('should return false when service not available', async () => {
      // Force transporter to null
      (EmailService as any).transporter = null;

      const result = await EmailService.sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        text: 'Test',
      });

      expect(result).toBe(false);
    });
  });
});
