# AI-InterviewSpark 🚀

**Advanced AI-powered mock interview platform with real-time emotional analysis and personalized feedback**

AI-InterviewSpark is a comprehensive platform that transforms interview preparation through AI-powered mock sessions, real-time emotional analysis, and personalized coaching. Built with modern technologies and best practices, it provides job seekers with the tools they need to excel in their interviews.

## ✨ Features

### 🎯 Core Features
- **AI-Powered Mock Interviews**: Dynamic question generation based on job descriptions and resumes
- **Real-Time Emotional Analysis**: Voice and facial emotion detection using Motivel and Moodme APIs
- **Personalized Feedback**: Instant scoring and actionable recommendations for improvement
- **Progress Analytics**: Comprehensive dashboards tracking performance over time
- **Resume/ATS Integration**: AI-powered resume analysis and optimization suggestions
- **Peer & Expert Coaching**: Live sessions with industry professionals

### 🛠 Technical Features
- **Multi-modal Support**: Video, audio, and text-based interview formats
- **Real-time Processing**: WebSocket-based live feedback and emotion tracking
- **Accessibility**: WCAG 2.1 compliant with screen reader support and high contrast mode
- **Multi-language**: Support for multiple global languages
- **Mobile Responsive**: Progressive Web App with native-like experience

## 🏗 Architecture

### Tech Stack
- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript, Drizzle ORM
- **Database**: PostgreSQL with Neon
- **AI Services**: OpenAI GPT-4, Google Gemini AI, Motivel API, Moodme SDK
- **Real-time**: Socket.IO for WebSocket connections
- **Storage**: AWS S3 for media files
- **Authentication**: JWT with Clerk integration
- **Deployment**: Docker, Kubernetes ready

### Project Structure
```
ai-interviewspark/
├── apps/
│   ├── api/                 # Backend API server
│   │   ├── src/
│   │   │   ├── config/      # Configuration management
│   │   │   ├── database/    # Database schema and connection
│   │   │   ├── middleware/  # Express middleware
│   │   │   ├── routes/      # API routes
│   │   │   ├── services/    # Business logic services
│   │   │   └── utils/       # Utility functions
│   │   └── package.json
│   └── web/                 # Frontend Next.js app
│       ├── src/
│       │   ├── app/         # Next.js app router
│       │   ├── components/  # React components
│       │   ├── lib/         # Utility functions
│       │   └── types/       # TypeScript types
│       └── package.json
├── packages/
│   └── shared/              # Shared types and utilities
│       ├── src/
│       │   ├── types/       # Common TypeScript types
│       │   └── utils/       # Shared utility functions
│       └── package.json
├── package.json             # Root package.json
├── turbo.json              # Turbo monorepo config
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm 9+ or yarn
- PostgreSQL database
- Docker (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/ai-interviewspark.git
   cd ai-interviewspark
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy example environment files
   cp apps/api/.env.example apps/api/.env
   cp apps/web/.env.example apps/web/.env
   ```

4. **Configure environment variables**
   ```bash
   # API Server (.env)
   DATABASE_URL=postgresql://user:password@localhost:5432/interviewspark
   JWT_SECRET=your-super-secret-jwt-key
   OPENAI_API_KEY=your-openai-api-key
   GEMINI_API_KEY=your-gemini-api-key
   MOTIVEL_API_KEY=your-motivel-api-key
   MOODME_API_KEY=your-moodme-api-key
   AWS_ACCESS_KEY_ID=your-aws-access-key
   AWS_SECRET_ACCESS_KEY=your-aws-secret-key
   AWS_S3_BUCKET=your-s3-bucket-name

   # Web App (.env.local)
   NEXT_PUBLIC_API_URL=http://localhost:3001
   NEXT_PUBLIC_WS_URL=http://localhost:3002
   ```

5. **Set up the database**
   ```bash
   # Generate database migrations
   npm run db:generate
   
   # Run migrations
   npm run db:migrate
   ```

6. **Start development servers**
   ```bash
   # Start all services
   npm run dev
   
   # Or start individually
   npm run dev:api    # API server on http://localhost:3001
   npm run dev:web    # Web app on http://localhost:3000
   ```

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile

### Interview Endpoints
- `POST /api/interviews` - Create new interview session
- `GET /api/interviews` - List user's interviews
- `GET /api/interviews/:id` - Get interview details
- `PUT /api/interviews/:id/start` - Start interview session
- `POST /api/interviews/:id/answers` - Submit answer

### AI Services Endpoints
- `POST /api/ai/questions` - Generate interview questions
- `POST /api/ai/analyze-answer` - Analyze answer content
- `POST /api/ai/analyze-emotion` - Analyze emotional state
- `POST /api/ai/analyze-resume` - Analyze resume for ATS optimization

### Expert Endpoints
- `GET /api/experts` - List available experts
- `POST /api/experts/sessions` - Book expert session
- `GET /api/experts/sessions` - List expert sessions

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests for specific package
npm run test:api
npm run test:web

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 🏗 Building for Production

```bash
# Build all packages
npm run build

# Build specific package
npm run build:api
npm run build:web

# Start production servers
npm run start:api
npm run start:web
```

## 🐳 Docker Deployment

```bash
# Build Docker images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f
```

## 🔧 Development

### Code Style
- **TypeScript**: Strict mode enabled
- **ESLint**: Configured for React and TypeScript
- **Prettier**: Code formatting
- **Husky**: Git hooks for pre-commit linting

### Git Workflow
1. Create feature branch from `main`
2. Make changes with proper TypeScript types
3. Add tests for new functionality
4. Run linting and tests
5. Submit pull request

### Database Migrations
```bash
# Generate new migration
npm run db:generate

# Apply migrations
npm run db:migrate

# View database in browser
npm run db:studio
```

## 🔐 Security

- **Authentication**: JWT tokens with secure storage
- **Authorization**: Role-based access control
- **Data Encryption**: End-to-end encryption for media files
- **Input Validation**: Comprehensive validation using Zod
- **Rate Limiting**: API rate limiting to prevent abuse
- **CORS**: Properly configured CORS policies

## 📊 Monitoring & Analytics

- **Logging**: Structured logging with Winston
- **Error Tracking**: Comprehensive error handling and reporting
- **Performance**: Real-time performance monitoring
- **Analytics**: User behavior and interview performance analytics

## 🌐 Internationalization

- **Multi-language Support**: UI translations for multiple languages
- **Localization**: Date, time, and number formatting
- **RTL Support**: Right-to-left language support

## ♿ Accessibility

- **WCAG 2.1 Compliance**: AA level accessibility standards
- **Screen Reader Support**: Proper ARIA labels and semantic HTML
- **Keyboard Navigation**: Full keyboard accessibility
- **High Contrast Mode**: Enhanced visibility options
- **Reduced Motion**: Respects user motion preferences

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs.interviewspark.com](https://docs.interviewspark.com)
- **Issues**: [GitHub Issues](https://github.com/your-org/ai-interviewspark/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/ai-interviewspark/discussions)
- **Email**: support@interviewspark.com

## 🙏 Acknowledgments

- OpenAI for GPT-4 integration
- Google for Gemini AI
- Motivel for voice emotion analysis
- Moodme for facial emotion detection
- The open-source community for amazing tools and libraries

---

**Made with ❤️ by the AI-InterviewSpark Team** 