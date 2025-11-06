// --- START api/services/emailService.ts --- //
// Email service for AI-InterviewSpark API
// Handles email notifications using SendGrid and Nodemailer

import nodemailer from 'nodemailer';
import { config } from '../config';
import { createError } from '../types';

// Email template types
interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

// Email data interface
interface EmailData {
  to: string;
  from?: string;
  subject: string;
  html?: string;
  text?: string;
  templateId?: string;
  templateData?: Record<string, any>;
}

export class EmailService {
  private static transporter: nodemailer.Transporter | null = null;

  // Initialize email transporter
  static async initialize(): Promise<void> {
    try {
      if (config.services.sendgrid.enabled) {
        // Use SendGrid SMTP
        this.transporter = nodemailer.createTransport({
          host: 'smtp.sendgrid.net',
          port: 587,
          secure: false,
          auth: {
            user: 'apikey',
            pass: config.services.sendgrid.apiKey,
          },
        });
      } else {
        // Use local SMTP for development
        this.transporter = nodemailer.createTransport({
          host: 'localhost',
          port: 1025,
          secure: false,
        });
      }

      // Verify connection
      await this.transporter.verify();
      console.log('✅ Email service initialized successfully');
    } catch (error) {
      console.warn('⚠️ Email service initialization failed:', error);
      this.transporter = null;
    }
  }

  // Send email
  static async sendEmail(emailData: EmailData): Promise<boolean> {
    try {
      if (!this.transporter) {
        console.warn('Email service not initialized, skipping email send');
        return false;
      }

      const mailOptions = {
        from: emailData.from || 'noreply@interviewspark.com',
        to: emailData.to,
        subject: emailData.subject,
        text: emailData.text,
        html: emailData.html,
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Email sent successfully to ${emailData.to}`);
      return true;
    } catch (error) {
      console.error('❌ Email send failed:', error);
      return false;
    }
  }

  // Email templates
  static getWelcomeTemplate(firstName: string): EmailTemplate {
    return {
      subject: 'Welcome to AI-InterviewSpark! 🚀',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Welcome to AI-InterviewSpark!</h1>
          <p>Hi ${firstName},</p>
          <p>Welcome to AI-InterviewSpark! We're excited to help you ace your next interview with our AI-powered mock interview platform.</p>
          
          <h2>What you can do:</h2>
          <ul>
            <li>🎯 Practice with AI-generated interview questions</li>
            <li>📊 Get real-time feedback on your performance</li>
            <li>🎭 Analyze your emotional responses during interviews</li>
            <li>📈 Track your progress over time</li>
            <li>👥 Connect with expert coaches</li>
          </ul>
          
          <p>Ready to get started? <a href="http://localhost:3000/dashboard" style="color: #2563eb;">Visit your dashboard</a></p>
          
          <p>Best of luck with your interview preparation!</p>
          <p>The AI-InterviewSpark Team</p>
        </div>
      `,
      text: `Welcome to AI-InterviewSpark!

Hi ${firstName},

Welcome to AI-InterviewSpark! We're excited to help you ace your next interview with our AI-powered mock interview platform.

What you can do:
- Practice with AI-generated interview questions
- Get real-time feedback on your performance
- Analyze your emotional responses during interviews
- Track your progress over time
- Connect with expert coaches

Ready to get started? Visit your dashboard at http://localhost:3000/dashboard

Best of luck with your interview preparation!
The AI-InterviewSpark Team`,
    };
  }

  static getInterviewReminderTemplate(firstName: string, interviewTitle: string, scheduledTime: Date): EmailTemplate {
    return {
      subject: `Interview Reminder: ${interviewTitle} 📅`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Interview Reminder</h1>
          <p>Hi ${firstName},</p>
          <p>This is a friendly reminder about your upcoming mock interview:</p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0; color: #1f2937;">${interviewTitle}</h3>
            <p style="margin: 10px 0 0 0; color: #6b7280;">Scheduled for: ${scheduledTime.toLocaleString()}</p>
          </div>
          
          <p>Make sure you're ready:</p>
          <ul>
            <li>✅ Test your camera and microphone</li>
            <li>✅ Find a quiet, well-lit space</li>
            <li>✅ Review your resume and job description</li>
            <li>✅ Prepare your STAR method examples</li>
          </ul>
          
          <p><a href="http://localhost:3000/dashboard/interviews" style="color: #2563eb;">Join your interview session</a></p>
          
          <p>Good luck!</p>
          <p>The AI-InterviewSpark Team</p>
        </div>
      `,
      text: `Interview Reminder: ${interviewTitle}

Hi ${firstName},

This is a friendly reminder about your upcoming mock interview:

${interviewTitle}
Scheduled for: ${scheduledTime.toLocaleString()}

Make sure you're ready:
- Test your camera and microphone
- Find a quiet, well-lit space
- Review your resume and job description
- Prepare your STAR method examples

Join your interview session at: http://localhost:3000/dashboard/interviews

Good luck!
The AI-InterviewSpark Team`,
    };
  }

  static getFeedbackReadyTemplate(firstName: string, interviewTitle: string): EmailTemplate {
    return {
      subject: `Your Interview Feedback is Ready! 📊`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Your Interview Feedback is Ready!</h1>
          <p>Hi ${firstName},</p>
          <p>Great job completing your mock interview: <strong>${interviewTitle}</strong></p>
          
          <p>Your detailed feedback and performance analysis are now available, including:</p>
          <ul>
            <li>📈 Overall performance score</li>
            <li>💬 Detailed answer analysis</li>
            <li>🎭 Emotional intelligence insights</li>
            <li>💡 Personalized improvement suggestions</li>
            <li>📊 Progress tracking</li>
          </ul>
          
          <p><a href="http://localhost:3000/dashboard/analytics" style="color: #2563eb;">View your feedback</a></p>
          
          <p>Keep practicing to improve your interview skills!</p>
          <p>The AI-InterviewSpark Team</p>
        </div>
      `,
      text: `Your Interview Feedback is Ready!

Hi ${firstName},

Great job completing your mock interview: ${interviewTitle}

Your detailed feedback and performance analysis are now available, including:
- Overall performance score
- Detailed answer analysis
- Emotional intelligence insights
- Personalized improvement suggestions
- Progress tracking

View your feedback at: http://localhost:3000/dashboard/analytics

Keep practicing to improve your interview skills!
The AI-InterviewSpark Team`,
    };
  }

  static getPasswordResetTemplate(firstName: string, resetToken: string): EmailTemplate {
    const webUrl = process.env.WEB_URL || 'http://localhost:3000';
    return {
      subject: 'Reset Your AI-InterviewSpark Password 🔐',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Password Reset Request</h1>
          <p>Hi ${firstName},</p>
          <p>We received a request to reset your AI-InterviewSpark password.</p>

          <p>Click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${webUrl}/auth/reset-password?token=${resetToken}"
               style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Reset Password
            </a>
          </div>

          <p>This link will expire in 1 hour for security reasons.</p>
          <p>If you didn't request this password reset, please ignore this email.</p>

          <p>The AI-InterviewSpark Team</p>
        </div>
      `,
      text: `Password Reset Request

Hi ${firstName},

We received a request to reset your AI-InterviewSpark password.

Click the link below to reset your password:
${webUrl}/auth/reset-password?token=${resetToken}

This link will expire in 1 hour for security reasons.
If you didn't request this password reset, please ignore this email.

The AI-InterviewSpark Team`,
    };
  }

  static getEmailVerificationTemplate(firstName: string, verificationToken: string): EmailTemplate {
    const webUrl = process.env.WEB_URL || 'http://localhost:3000';
    return {
      subject: 'Verify Your AI-InterviewSpark Email ✉️',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Welcome to AI-InterviewSpark!</h1>
          <p>Hi ${firstName},</p>
          <p>Thank you for registering with AI-InterviewSpark. Please verify your email address to get started.</p>

          <p>Click the button below to verify your email:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${webUrl}/auth/verify-email?token=${verificationToken}"
               style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Verify Email
            </a>
          </div>

          <p>Once verified, you'll have access to all our features:</p>
          <ul>
            <li>🎯 AI-powered mock interviews</li>
            <li>📊 Real-time feedback and analytics</li>
            <li>🎭 Emotional analysis</li>
            <li>👥 Expert coaching sessions</li>
          </ul>

          <p>If you didn't create this account, please ignore this email.</p>

          <p>The AI-InterviewSpark Team</p>
        </div>
      `,
      text: `Welcome to AI-InterviewSpark!

Hi ${firstName},

Thank you for registering with AI-InterviewSpark. Please verify your email address to get started.

Click the link below to verify your email:
${webUrl}/auth/verify-email?token=${verificationToken}

Once verified, you'll have access to all our features:
- AI-powered mock interviews
- Real-time feedback and analytics
- Emotional analysis
- Expert coaching sessions

If you didn't create this account, please ignore this email.

The AI-InterviewSpark Team`,
    };
  }

  static getPasswordChangedTemplate(email: string): EmailTemplate {
    return {
      subject: 'Your Password Has Been Changed 🔐',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Password Changed Successfully</h1>
          <p>Hi there,</p>
          <p>Your AI-InterviewSpark password has been successfully changed.</p>

          <p>If you made this change, no further action is needed.</p>

          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e;"><strong>⚠️ Didn't make this change?</strong></p>
            <p style="margin: 10px 0 0 0; color: #92400e;">If you didn't request this password change, please contact us immediately at support@interviewspark.com</p>
          </div>

          <p>Account: ${email}</p>
          <p>Changed on: ${new Date().toLocaleString()}</p>

          <p>The AI-InterviewSpark Team</p>
        </div>
      `,
      text: `Password Changed Successfully

Hi there,

Your AI-InterviewSpark password has been successfully changed.

If you made this change, no further action is needed.

⚠️ Didn't make this change?
If you didn't request this password change, please contact us immediately at support@interviewspark.com

Account: ${email}
Changed on: ${new Date().toLocaleString()}

The AI-InterviewSpark Team`,
    };
  }

  // Send welcome email
  static async sendWelcomeEmail(email: string, firstName: string): Promise<boolean> {
    const template = this.getWelcomeTemplate(firstName);
    return this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  // Send interview reminder
  static async sendInterviewReminder(
    email: string,
    firstName: string,
    interviewTitle: string,
    scheduledTime: Date
  ): Promise<boolean> {
    const template = this.getInterviewReminderTemplate(firstName, interviewTitle, scheduledTime);
    return this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  // Send feedback ready notification
  static async sendFeedbackReady(
    email: string,
    firstName: string,
    interviewTitle: string
  ): Promise<boolean> {
    const template = this.getFeedbackReadyTemplate(firstName, interviewTitle);
    return this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  // Send password reset email
  static async sendPasswordReset(
    email: string,
    firstName: string,
    resetToken: string
  ): Promise<boolean> {
    const template = this.getPasswordResetTemplate(firstName, resetToken);
    return this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  // Alias for sendPasswordReset to match auth route expectations
  static async sendPasswordResetEmail(
    email: string,
    firstName: string,
    resetToken: string
  ): Promise<boolean> {
    return this.sendPasswordReset(email, firstName, resetToken);
  }

  // Send email verification
  static async sendVerificationEmail(
    email: string,
    firstName: string,
    verificationToken: string
  ): Promise<boolean> {
    const template = this.getEmailVerificationTemplate(firstName, verificationToken);
    return this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  // Send password changed confirmation
  static async sendPasswordChangedEmail(email: string): Promise<boolean> {
    const template = this.getPasswordChangedTemplate(email);
    return this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  // Check if email service is available
  static isAvailable(): boolean {
    return this.transporter !== null;
  }
}

export default EmailService;

// Initialize email service on module load
EmailService.initialize().catch(console.error);
