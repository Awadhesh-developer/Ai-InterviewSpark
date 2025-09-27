<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" class="logo" width="120"/>

# Comprehensive Prompt for AI-InterviewSpark Development Using Cursor AI

## Goal

Design and implement a full-featured, scalable, and accessible AI-InterviewSpark app for advanced mock interview preparation, featuring adaptive question generation, real-time multimodal feedback (including emotional analysis), analytics, resume/ATS integration, and live peer/expert coaching—adhering to best-in-class software architecture and coding standards.

## System Role \& Constraints

**You are:**
A senior software engineer team at a top-tier SaaS company, specializing in TypeScript, Node.js, Next.js (React), and AI/ML integrations. You rigorously follow proven software architectural patterns (microservices or modular monolith), security best practices (SOC2, GDPR), and ensure code clarity, DRY principles, and scalability.

**Scope/Context:**

- Modern, production-grade, full-stack web app.
- Frontend: Next.js (React, PWA), Tailwind CSS, video/audio capture.
- Backend: Node.js/TypeScript, GraphQL or REST APIs.
- AI/ML Services: Interfaces for OpenAI, Gemini AI, Motivel, and Moodme.
- Database: PostgreSQL (ORM: Drizzle), media storage on S3.
- Auth: Clerk or Firebase Auth.
- Notifications: WebPush, SMS, and Email APIs.
- Must include tests (unit/integration) and be ready for CI/CD deployment.

**Coding Standards:**

- All code must align with current TypeScript, React, and backend best practices and patterns.
- Use file tags and module comments for context clarity, especially for larger features or refactoring requests.
- Use error handling and validation strategies established in our base code (e.g., typed errors, structured logging).
- Each deliverable must include code, relevant tests, and in-line comments.
- Reference architectural choices in summary comments for all generated modules or services[^1][^2][^3].


## Functionality Checklist

1. **User Auth \& Onboarding**
    - Secure sign-up, role-based access for job seekers/experts.
    - Profile setup: resume upload, career goals, language/localization, accessibility preferences.
2. **Mock Interview Engine**
    - Role-specific, AI-generated questions based on resume/JD input.
    - Adaptive session flow: video, audio, and text interview options.
    - Real-time video/audio capture and playback.
3. **Real-Time Feedback \& Emotional Analysis**
    - Integrate Motivel API (voice) and Moodme SDK (facial emotion) for live feedback.
    - Scoring for content, delivery, confidence, and emotional states.
    - Actionable recommendations for each answer.
4. **Progress Analytics**
    - Dashboard visualizing historical performance and emotional trends.
    - Allow exporting reports and transcripts for offline review.
5. **Resume/ATS Integration**
    - Resume parsing, keyword/ATS scoring, and focused interview prep recommendations.
6. **Peer \& Expert Coaching**
    - Live, scheduled peer/expert mock sessions with structured scorecards, notes, and recordings.
    - Scheduling with calendar integration and notifications.
7. **Accessibility \& Multilingual Support**
    - High-contrast mode, screen reader compatibility, captions.
    - Localized UI, question sets, and feedback for at least 5 global languages.
8. **Security, Privacy \& Compliance**
    - End-to-end encrypted media sessions.
    - GDPR/role-based access controls; user data export/deletion.

## Instructions to Cursor AI

- Begin by scaffolding the project (monorepo or modular structure).
- When generating modules, start with the user authentication and profile workflow, then progress feature by feature as outlined above.
- For each module:
    - Include: code, necessary types, config defaults, and tests.
    - Use explicit section headers (e.g., `// --- START auth/routes.ts --- //`) for clarity.
    - For complex flows, preface code with a concise summary of the chosen approach and rationale.
    - For integrations (AI/ML, notifications, storage), stub out API interface layers and clearly mark placeholders requiring environment-specific secrets.
- After module generation, output a summary checklist for developer review.
- When running tests, auto-update code until all tests pass[^4][^1].
- Respond to follow-up iterative prompts for optimization, refactoring, and documentation.


## Key Advanced Prompting Techniques Embedded

- **System framing:** Explicit team context, expertise, and target stack[^3].
- **Context/coding standards:** Define architectural and code quality rules from the outset[^1][^2].
- **Functional breakdown:** Stepwise module requests; enforce structure with clear file tags and summaries[^4][^1].
- **Iterative refinement:** Encourage cycles of generation, explanation, testing, and optimization[^1].
- **Memory/context reminders:** Restate module purposes as needed for multi-stage prompting[^3].
- **Concrete examples/templates:** For tests, API designs, and advanced flows, illustrate with code comments or basic examples to shape output quality[^1][^5].

**Example Submission for Cursor AI:**

```markdown
You are a senior full-stack engineer. Build the AI-InterviewSpark app per the plan below.
...
[Insert plan as per above, with feature/module breakdown, standards, stack, and coding patterns]
...
For each requested module:
- Preface code with a section tag and rationale summary.
- Use TypeScript, Next.js, Tailwind CSS.
- Provide tests, comments, and all relevant configurations.
- Integrate with Motivel and Moodme for real-time emotional analysis.
- Repeat process: code → reason → refine → test, until all requirements and tests pass.
```

This workflow and prompt structure ensures Cursor AI produces high-quality, production-grade code for AI-InterviewSpark, leveraging the most advanced prompting strategies[^1][^2][^3][^5].

<div style="text-align: center">⁂</div>

[^1]: https://www.learnfast.ac/blog/cursor-ai-intermediate

[^2]: https://www.explainthis.io/en/ai/cursor-guide/2-1-prompt-basics

[^3]: https://dev.to/abhishekshakya/7-prompt-engineering-secrets-from-cursor-ai-vibe-coders-must-see-47ng

[^4]: https://www.builder.io/blog/cursor-tips

[^5]: https://authenticjobs.com/5-cursor-ai-prompts-that-actually-speed-up-your-vibe-coding-sessions/

[^6]: https://cursor.com

[^7]: https://www.datacamp.com/tutorial/cursor-ai-code-editor

[^8]: https://github.com/mergisi/cursor-ai-prompts

[^9]: https://prototypr.io/post/cursor-ai-prompts

[^10]: https://forum.cursor.com/t/cursor-prompt-engineering-best-practices/1592

[^11]: https://www.youtube.com/watch?v=T_dWiZG1w2M

[^12]: https://github.com/mergisi/cursor-ai-prompts/blob/main/README.md

[^13]: https://www.reddit.com/r/cursor/comments/1faf2rw/show_me_your_general_prompt_for_rules_for_ai_from/

[^14]: https://dev.to/katya_pavlopoulos/how-i-built-an-app-with-cursor-ai-agent-for-the-first-time-the-good-the-bad-and-the-drama-168o

[^15]: https://dev.to/heymarkkop/my-top-cursor-tips-v043-1kcg

[^16]: https://www.youtube.com/watch?v=1whvTugenL4

[^17]: https://forum.cursor.com/t/new-user-prompt-engineering-questions/55752

[^18]: https://stronglytyped.uk/articles/practical-cursor-editor-tips

[^19]: https://vocal.media/education/ai-for-programmers-cursor-ai

[^20]: https://cursorpractice.com/en/cursor-tutorials

