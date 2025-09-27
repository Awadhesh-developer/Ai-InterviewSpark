// Core types for AI-InterviewSpark frontend application

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  avatar?: string
  bio?: string
  location?: string
  timezone?: string
  language: string
  accessibility: AccessibilitySettings
  createdAt: string
  updatedAt: string
}

export enum UserRole {
  JOB_SEEKER = 'job_seeker',
  EXPERT = 'expert',
  ADMIN = 'admin'
}

export interface AccessibilitySettings {
  highContrast: boolean
  screenReader: boolean
  captions: boolean
}

export interface InterviewSession {
  id: string
  userId: string
  jobTitle: string
  company?: string
  jobDescription?: string
  difficulty: Difficulty
  duration: number
  questionTypes: QuestionType[]
  topics?: string[]
  includeEmotionalAnalysis: boolean
  includeResumeAnalysis: boolean
  status: SessionStatus
  startedAt?: string
  completedAt?: string
  createdAt: string
  updatedAt: string
  questions?: Question[]
  answers?: Answer[]
  performanceMetrics?: PerformanceMetrics
}

export enum Difficulty {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced'
}

export enum QuestionType {
  BEHAVIORAL = 'behavioral',
  TECHNICAL = 'technical',
  SITUATIONAL = 'situational',
  STRENGTHS = 'strengths',
  WEAKNESSES = 'weaknesses'
}

export enum SessionStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export interface Question {
  id: string
  sessionId: string
  type: QuestionType
  text: string
  category: string
  difficulty: Difficulty
  expectedKeywords?: string[]
  timeLimit?: number
  order: number
  createdAt: string
}

export interface Answer {
  id: string
  questionId: string
  sessionId: string
  userId: string
  textResponse?: string
  audioUrl?: string
  videoUrl?: string
  duration: number
  submittedAt: string
  feedback?: Feedback
}

export interface Feedback {
  id: string
  answerId: string
  overallScore: number
  contentScore: number
  deliveryScore: number
  confidenceScore: number
  clarityScore: number
  strengths: string[]
  improvements: string[]
  suggestions: string[]
  emotionalAnalysis?: EmotionalAnalysis
  createdAt: string
}

export interface EmotionalAnalysis {
  dominantEmotion: string
  emotions: EmotionData[]
  confidence: number
  trends: EmotionTrend[]
  insights: string[]
}

export interface EmotionData {
  emotion: string
  confidence: number
  timestamp: number
}

export interface EmotionTrend {
  emotion: string
  averageConfidence: number
  frequency: number
}

export interface PerformanceMetrics {
  id: string
  sessionId: string
  userId: string
  overallScore: number
  categoryScores: Record<string, number>
  emotionalTrends: EmotionTrend[]
  improvementAreas: string[]
  strengths: string[]
  recommendations: string[]
  createdAt: string
}

export interface Resume {
  id: string
  userId: string
  fileName: string
  fileUrl: string
  fileSize: number
  uploadDate: string
  parsedData?: ResumeData
  atsScore?: number
  keywords?: string[]
}

export interface ResumeData {
  skills: string[]
  experience: Experience[]
  education: Education[]
}

export interface Experience {
  title: string
  company: string
  duration: string
  description: string
}

export interface Education {
  degree: string
  institution: string
  year: number
}

export interface ExpertProfile {
  id: string
  userId: string
  expertise: string[]
  experience: number
  rating: number
  reviewCount: number
  hourlyRate: number
  availability: AvailabilitySlot[]
  bio: string
  certifications: string[]
  languages: string[]
  createdAt: string
}

export interface AvailabilitySlot {
  dayOfWeek: number
  startTime: string
  endTime: string
  timezone: string
}

export interface ExpertSession {
  id: string
  sessionId: string
  expertId: string
  status: ExpertSessionStatus
  scheduledAt: string
  duration: number
  rate: number
  notes?: string
  rating?: number
  review?: string
  createdAt: string
}

export enum ExpertSessionStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export interface PeerSession {
  id: string
  sessionId: string
  peerUserId: string
  status: PeerSessionStatus
  createdAt: string
}

export enum PeerSessionStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  DECLINED = 'declined'
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Authentication Types
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  firstName: string
  lastName: string
  role?: UserRole
}

export interface AuthResponse {
  user: User
  token: string
  refreshToken: string
}

// Interview Configuration Types
export interface InterviewConfig {
  jobTitle: string
  company?: string
  jobDescription?: string
  difficulty: Difficulty
  duration: number
  questionTypes: QuestionType[]
  topics?: string[]
  includeEmotionalAnalysis?: boolean
  includeResumeAnalysis?: boolean
}

// Real-time Types
export interface SocketEvents {
  'interview:start': { sessionId: string }
  'interview:question': { question: Question }
  'interview:answer': { answer: Answer }
  'interview:feedback': { feedback: Feedback }
  'interview:complete': { sessionId: string }
  'emotion:analysis': { analysis: EmotionalAnalysis }
  'peer:join': { userId: string }
  'peer:leave': { userId: string }
  'expert:join': { expertId: string }
  'expert:leave': { expertId: string }
}

// Media Types
export interface MediaConstraints {
  video: boolean
  audio: boolean
  videoQuality?: 'low' | 'medium' | 'high'
  audioQuality?: 'low' | 'medium' | 'high'
}

export interface RecordingState {
  isRecording: boolean
  isPaused: boolean
  duration: number
  mediaStream?: MediaStream
  mediaRecorder?: MediaRecorder
}

// Analytics Types
export interface AnalyticsData {
  totalSessions: number
  averageScore: number
  improvementRate: number
  completionRate: number
  topSkills: string[]
  weakAreas: string[]
  emotionalTrends: EmotionTrend[]
  progressOverTime: ProgressPoint[]
}

export interface ProgressPoint {
  date: string
  score: number
  category: string
}

// UI Component Types
export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface TabItem {
  id: string
  label: string
  content: React.ReactNode
  disabled?: boolean
}

export interface ChartData {
  name: string
  value: number
  color?: string
}

export interface NotificationData {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  timestamp: string
  read: boolean
}

// Form Types
export interface FormField {
  name: string
  label: string
  type: 'text' | 'email' | 'password' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'file'
  placeholder?: string
  required?: boolean
  options?: SelectOption[]
  validation?: any
}

// Error Types
export interface AppError {
  code: string
  message: string
  details?: any
  timestamp: string
}

// Theme Types
export interface ThemeConfig {
  mode: 'light' | 'dark' | 'system'
  primaryColor: string
  accentColor: string
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  fontFamily: string
}