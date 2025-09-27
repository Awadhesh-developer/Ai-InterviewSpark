import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { toast } from 'sonner'
import {
  ApiResponse,
  PaginatedResponse,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  User,
  InterviewSession,
  InterviewConfig,
  Question,
  Answer,
  Feedback,
  PerformanceMetrics,
  Resume,
  ExpertProfile,
  AnalyticsData
} from '@/types'
// import { getErrorMessage, isTokenExpired } from '@/lib/utils'
import { mockApiClient } from '@/lib/mockApi'

class ApiClient {
  private client: AxiosInstance
  private baseURL: string
  private useMockApi: boolean

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    this.useMockApi = process.env.NEXT_PUBLIC_USE_MOCK_API === 'true' || !process.env.NEXT_PUBLIC_API_URL

    // Debug logging (can be removed in production)
    if (process.env.NODE_ENV === 'development') {
      console.log('API Client: Using Mock API =', this.useMockApi)
    }

    this.client = axios.create({
      baseURL: `${this.baseURL}/api`,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getToken()
        if (token && !this.isTokenExpired(token)) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        return response
      },
      (error) => {
        if (error.response?.status === 401) {
          this.handleUnauthorized()
        } else if (error.response?.status >= 500) {
          toast.error('Server error. Please try again later.')
        } else if (error.code === 'NETWORK_ERROR') {
          toast.error('Network error. Please check your connection.')
        }
        return Promise.reject(error)
      }
    )
  }

  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token')
    }
    return null
  }

  private setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token)
    }
  }

  private removeToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('refresh_token')
    }
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      const currentTime = Date.now() / 1000
      return payload.exp < currentTime
    } catch {
      return true
    }
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message
    }
    if (typeof error === 'string') {
      return error
    }
    return 'An unknown error occurred'
  }

  private handleUnauthorized(): void {
    this.removeToken()
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/login'
    }
  }

  // Generic request method
  private async request<T>(config: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.request<ApiResponse<T>>(config)
      return response.data
    } catch (error: any) {
      const message = error.response?.data?.message || this.getErrorMessage(error)
      throw new Error(message)
    }
  }

  // Authentication methods
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    if (this.useMockApi) {
      const result = await mockApiClient.login(credentials)
      this.setToken(result.token)
      return result
    }

    const response = await this.request<AuthResponse>({
      method: 'POST',
      url: '/auth/login',
      data: credentials,
    })

    if (response.success && response.data) {
      this.setToken(response.data.token)
      return response.data
    }

    throw new Error(response.message || 'Login failed')
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    if (this.useMockApi) {
      const result = await mockApiClient.register(userData)
      this.setToken(result.token)
      return result
    }

    const response = await this.request<AuthResponse>({
      method: 'POST',
      url: '/auth/register',
      data: userData,
    })

    if (response.success && response.data) {
      this.setToken(response.data.token)
      return response.data
    }

    throw new Error(response.message || 'Registration failed')
  }

  async logout(): Promise<void> {
    if (this.useMockApi) {
      await mockApiClient.logout()
      this.removeToken()
      return
    }

    try {
      await this.request({
        method: 'POST',
        url: '/auth/logout',
      })
    } finally {
      this.removeToken()
    }
  }

  async getCurrentUser(): Promise<User> {
    if (this.useMockApi) {
      return await mockApiClient.getCurrentUser()
    }

    const response = await this.request<User>({
      method: 'GET',
      url: '/auth/me',
    })

    if (response.success && response.data) {
      return response.data
    }

    throw new Error(response.message || 'Failed to get user data')
  }

  // User methods
  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await this.request<User>({
      method: 'PUT',
      url: '/users/me',
      data,
    })

    if (response.success && response.data) {
      return response.data
    }

    throw new Error(response.message || 'Failed to update profile')
  }

  async getUserStats(): Promise<AnalyticsData> {
    const response = await this.request<AnalyticsData>({
      method: 'GET',
      url: '/users/me/stats',
    })

    if (response.success && response.data) {
      return response.data
    }

    throw new Error(response.message || 'Failed to get user stats')
  }

  // Interview methods
  async createInterviewSession(config: InterviewConfig): Promise<InterviewSession> {
    if (this.useMockApi) {
      return await mockApiClient.createInterviewSession(config)
    }

    const response = await this.request<InterviewSession>({
      method: 'POST',
      url: '/interviews/sessions',
      data: config,
    })

    if (response.success && response.data) {
      return response.data
    }

    throw new Error(response.message || 'Failed to create interview session')
  }

  async getInterviewSessions(params?: {
    status?: string
    limit?: number
    offset?: number
  }): Promise<InterviewSession[]> {
    if (this.useMockApi) {
      return await mockApiClient.getInterviewSessions()
    }

    const response = await this.request<InterviewSession[]>({
      method: 'GET',
      url: '/interviews/sessions',
      params,
    })

    if (response.success && response.data) {
      return response.data
    }

    throw new Error(response.message || 'Failed to get interview sessions')
  }

  async getInterviewSession(sessionId: string): Promise<InterviewSession> {
    const response = await this.request<InterviewSession>({
      method: 'GET',
      url: `/interviews/sessions/${sessionId}`,
    })

    if (response.success && response.data) {
      return response.data
    }

    throw new Error(response.message || 'Failed to get interview session')
  }

  async startInterviewSession(sessionId: string): Promise<Question> {
    const response = await this.request<Question>({
      method: 'PUT',
      url: `/interviews/sessions/${sessionId}/start`,
    })

    if (response.success && response.data) {
      return response.data
    }

    throw new Error(response.message || 'Failed to start interview session')
  }

  async submitAnswer(sessionId: string, data: {
    questionId: string
    textResponse?: string
    audioBlob?: Blob
    videoBlob?: Blob
    duration: number
  }): Promise<{ feedback: Feedback; nextQuestion?: Question }> {
    const formData = new FormData()
    formData.append('questionId', data.questionId)
    formData.append('duration', data.duration.toString())

    if (data.textResponse) {
      formData.append('textResponse', data.textResponse)
    }

    if (data.audioBlob) {
      formData.append('audio', data.audioBlob, 'answer.webm')
    }

    if (data.videoBlob) {
      formData.append('video', data.videoBlob, 'answer.webm')
    }

    const response = await this.request<{ feedback: Feedback; nextQuestion?: Question }>({
      method: 'POST',
      url: `/interviews/sessions/${sessionId}/answers`,
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    if (response.success && response.data) {
      return response.data
    }

    throw new Error(response.message || 'Failed to submit answer')
  }

  async completeInterviewSession(sessionId: string): Promise<PerformanceMetrics> {
    const response = await this.request<PerformanceMetrics>({
      method: 'PUT',
      url: `/interviews/sessions/${sessionId}/complete`,
    })

    if (response.success && response.data) {
      return response.data
    }

    throw new Error(response.message || 'Failed to complete interview session')
  }

  async getSessionResults(sessionId: string): Promise<{
    session: InterviewSession
    metrics: PerformanceMetrics
    feedback: Feedback[]
  }> {
    const response = await this.request<{
      session: InterviewSession
      metrics: PerformanceMetrics
      feedback: Feedback[]
    }>({
      method: 'GET',
      url: `/interviews/sessions/${sessionId}/results`,
    })

    if (response.success && response.data) {
      return response.data
    }

    throw new Error(response.message || 'Failed to get session results')
  }

  // Resume methods
  async uploadResume(file: File): Promise<Resume> {
    const formData = new FormData()
    formData.append('resume', file)

    const response = await this.request<Resume>({
      method: 'POST',
      url: '/resumes/upload',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    if (response.success && response.data) {
      return response.data
    }

    throw new Error(response.message || 'Failed to upload resume')
  }

  async getResumes(): Promise<Resume[]> {
    const response = await this.request<Resume[]>({
      method: 'GET',
      url: '/resumes',
    })

    if (response.success && response.data) {
      return response.data
    }

    throw new Error(response.message || 'Failed to get resumes')
  }

  async analyzeResume(resumeId: string): Promise<{
    atsScore: number
    keywords: string[]
    suggestions: string[]
  }> {
    const response = await this.request<{
      atsScore: number
      keywords: string[]
      suggestions: string[]
    }>({
      method: 'POST',
      url: `/resumes/${resumeId}/analyze`,
    })

    if (response.success && response.data) {
      return response.data
    }

    throw new Error(response.message || 'Failed to analyze resume')
  }

  // Expert methods
  async getExperts(params?: {
    expertise?: string[]
    minRating?: number
    maxRate?: number
    availability?: string
  }): Promise<ExpertProfile[]> {
    const response = await this.request<ExpertProfile[]>({
      method: 'GET',
      url: '/experts',
      params,
    })

    if (response.success && response.data) {
      return response.data
    }

    throw new Error(response.message || 'Failed to get experts')
  }

  async bookExpertSession(expertId: string, data: {
    sessionId: string
    scheduledAt: string
    duration: number
    notes?: string
  }): Promise<any> {
    const response = await this.request({
      method: 'POST',
      url: `/experts/${expertId}/book`,
      data,
    })

    if (response.success) {
      return response.data
    }

    throw new Error(response.message || 'Failed to book expert session')
  }

  // Analytics methods
  async getAnalytics(params?: {
    startDate?: string
    endDate?: string
    category?: string
  }): Promise<AnalyticsData> {
    const response = await this.request<AnalyticsData>({
      method: 'GET',
      url: '/analytics/user',
      params,
    })

    if (response.success && response.data) {
      return response.data
    }

    throw new Error(response.message || 'Failed to get analytics')
  }

  // AI methods
  async generateQuestions(data: {
    jobTitle: string
    industry?: string
    company?: string
    jobDescription?: string
    questionTypes: string[]
    difficulty: string
    count: number
  }): Promise<Question[]> {
    const response = await this.request<any>({
      method: 'POST',
      url: '/interviews/generate',
      data: {
        jobTitle: data.jobTitle,
        industry: data.industry,
        company: data.company,
        difficulty: data.difficulty === 'easy' ? 'beginner' : data.difficulty === 'hard' ? 'advanced' : 'intermediate',
        count: data.count,
        types: data.questionTypes,
        jobDescription: data.jobDescription,
        llmProvider: 'auto',
        includeIdealAnswers: true
      },
    })

    if (response.success && response.data) {
      const d = response.data
      // Support both legacy array and newer { questions, metadata } shapes
      if (Array.isArray(d)) return d
      if (Array.isArray(d?.questions)) return d.questions
      if (Array.isArray(d?.data?.questions)) return d.data.questions
    }

    throw new Error(response.message || 'Failed to generate questions')
  }

  async analyzeAnswer(data: {
    questionId: string
    answer: string
    audioUrl?: string
  }): Promise<Feedback> {
    const response = await this.request<Feedback>({
      method: 'POST',
      url: '/ai/analyze-answer',
      data,
    })

    if (response.success && response.data) {
      return response.data
    }

    throw new Error(response.message || 'Failed to analyze answer')
  }

  async analyzeEmotion(data: {
    audioUrl?: string
    videoUrl?: string
  }): Promise<any> {
    const response = await this.request({
      method: 'POST',
      url: '/ai/analyze-emotion',
      data,
    })

    if (response.success && response.data) {
      return response.data
    }

    throw new Error(response.message || 'Failed to analyze emotion')
  }

  // Upload methods
  async uploadResumeFile(file: File): Promise<{
    fileUrl: string
    fileName: string
    fileSize: number
  }> {
    const formData = new FormData()
    formData.append('resume', file)

    const response = await this.request<{
      fileUrl: string
      fileName: string
      fileSize: number
    }>({
      method: 'POST',
      url: '/upload/resume',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    if (response.success && response.data) {
      return response.data
    }

    throw new Error(response.message || 'Failed to upload resume')
  }

  async uploadRecording(file: File, sessionId: string, questionId?: string, recordingType: 'audio' | 'video' = 'audio'): Promise<{
    fileUrl: string
    fileName: string
    fileSize: number
    recordingType: string
  }> {
    const formData = new FormData()
    formData.append('recording', file)
    formData.append('sessionId', sessionId)
    formData.append('recordingType', recordingType)
    if (questionId) {
      formData.append('questionId', questionId)
    }

    const response = await this.request<{
      fileUrl: string
      fileName: string
      fileSize: number
      recordingType: string
    }>({
      method: 'POST',
      url: '/upload/recording',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    if (response.success && response.data) {
      return response.data
    }

    throw new Error(response.message || 'Failed to upload recording')
  }

  async uploadAvatar(file: File): Promise<{
    avatarUrl: string
  }> {
    const formData = new FormData()
    formData.append('avatar', file)

    const response = await this.request<{
      avatarUrl: string
    }>({
      method: 'POST',
      url: '/upload/avatar',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    if (response.success && response.data) {
      return response.data
    }

    throw new Error(response.message || 'Failed to upload avatar')
  }

  async generatePresignedUrl(fileName: string, fileType: 'resume' | 'audio' | 'video' | 'image'): Promise<{
    uploadUrl: string
    key: string
    expiresIn: number
  }> {
    const response = await this.request<{
      uploadUrl: string
      key: string
      expiresIn: number
    }>({
      method: 'POST',
      url: '/upload/presigned-url',
      data: { fileName, fileType },
    })

    if (response.success && response.data) {
      return response.data
    }

    throw new Error(response.message || 'Failed to generate presigned URL')
  }

  // Notification methods
  async getNotifications(params?: {
    limit?: number
    offset?: number
    unreadOnly?: boolean
  }): Promise<{
    notifications: any[]
    unreadCount: number
  }> {
    const response = await this.request<{
      notifications: any[]
      unreadCount: number
    }>({
      method: 'GET',
      url: '/notifications',
      params,
    })

    if (response.success && response.data) {
      return response.data
    }

    throw new Error(response.message || 'Failed to get notifications')
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    const response = await this.request({
      method: 'PATCH',
      url: `/notifications/${notificationId}/read`,
    })

    if (!response.success) {
      throw new Error(response.message || 'Failed to mark notification as read')
    }
  }

  async markAllNotificationsAsRead(): Promise<void> {
    const response = await this.request({
      method: 'PATCH',
      url: '/notifications/read-all',
    })

    if (!response.success) {
      throw new Error(response.message || 'Failed to mark all notifications as read')
    }
  }

  // User management methods
  async getUsers(params?: {
    page?: number
    limit?: number
    search?: string
    role?: string
    status?: string
  }): Promise<{
    users: User[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
    stats: {
      total: number
      active: number
      pending: number
      admins: number
    }
  }> {
    const response = await this.request<{
      users: User[]
      pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
      }
      stats: {
        total: number
        active: number
        pending: number
        admins: number
      }
    }>({
      method: 'GET',
      url: '/users',
      params,
    })

    if (response.success && response.data) {
      return response.data
    }

    throw new Error(response.message || 'Failed to get users')
  }

  async createUser(userData: {
    firstName: string
    lastName: string
    email: string
    password: string
    role: string
    department: string
    phoneNumber?: string
    bio?: string
    sendWelcomeEmail: boolean
    requirePasswordChange: boolean
    isActive: boolean
    permissions: string[]
  }): Promise<User> {
    const response = await this.request<User>({
      method: 'POST',
      url: '/users',
      data: userData,
    })

    if (response.success && response.data) {
      return response.data
    }

    throw new Error(response.message || 'Failed to create user')
  }

  async deleteUser(userId: string): Promise<void> {
    const response = await this.request({
      method: 'DELETE',
      url: `/users/${userId}`,
    })

    if (!response.success) {
      throw new Error(response.message || 'Failed to delete user')
    }
  }

  async deleteMultipleUsers(userIds: string[]): Promise<{
    deletedCount: number
    failedCount: number
    message: string
  }> {
    const response = await this.request<{
      deletedCount: number
      failedCount: number
      message: string
    }>({
      method: 'DELETE',
      url: '/users',
      params: { userIds: userIds.join(',') },
    })

    if (response.success && response.data) {
      return response.data
    }

    throw new Error(response.message || 'Failed to delete users')
  }

  async getUnreadNotificationCount(): Promise<number> {
    const response = await this.request<{ unreadCount: number }>({
      method: 'GET',
      url: '/notifications/unread-count',
    })

    if (response.success && response.data) {
      return response.data.unreadCount
    }

    return 0
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient()
export default apiClient