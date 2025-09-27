import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import DashboardPage from '@/app/dashboard/page'
import { useAuthStore } from '@/stores/auth'
import { useInterviewStore } from '@/stores/interview'
import '@testing-library/jest-dom'

// Mock the stores
jest.mock('@/stores/auth')
jest.mock('@/stores/interview')

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn()
  }),
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams()
}))

const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>
const mockUseInterviewStore = useInterviewStore as jest.MockedFunction<typeof useInterviewStore>

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  avatar: 'https://example.com/avatar.jpg',
  role: 'user' as const,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date(),
  preferences: {
    notifications: true,
    theme: 'light' as const,
    language: 'en'
  }
}

const mockSessions = [
  {
    id: 'session-1',
    userId: 'user-123',
    jobTitle: 'Software Engineer',
    company: 'Google',
    industry: 'Technology',
    status: 'completed' as const,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    config: {
      duration: 45,
      questionTypes: ['technical', 'behavioral'],
      difficulty: 'medium' as const,
      recordingEnabled: true
    },
    questions: [],
    answers: [],
    performanceMetrics: {
      overallScore: 85,
      categoryScores: {
        technical: 82,
        behavioral: 88,
        communication: 85,
        problemSolving: 83
      },
      strengths: ['Clear communication', 'Strong technical knowledge'],
      improvements: ['More specific examples', 'Better structure'],
      recommendations: ['Practice system design', 'Prepare more STAR examples']
    }
  },
  {
    id: 'session-2',
    userId: 'user-123',
    jobTitle: 'Product Manager',
    company: 'Meta',
    industry: 'Technology',
    status: 'in-progress' as const,
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20'),
    config: {
      duration: 60,
      questionTypes: ['behavioral', 'case-study'],
      difficulty: 'hard' as const,
      recordingEnabled: true
    },
    questions: [],
    answers: []
  }
]

describe('Dashboard Integration', () => {
  beforeEach(() => {
    mockUseAuthStore.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn(),
      register: jest.fn(),
      updateProfile: jest.fn(),
      clearError: jest.fn(),
      error: null
    })

    mockUseInterviewStore.mockReturnValue({
      sessions: mockSessions,
      currentSession: null,
      isLoading: false,
      error: null,
      loadSessions: jest.fn(),
      createSession: jest.fn(),
      updateSession: jest.fn(),
      deleteSession: jest.fn(),
      setCurrentSession: jest.fn(),
      clearError: jest.fn()
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('renders dashboard with user data', async () => {
    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText(/welcome back/i)).toBeInTheDocument()
    })

    // Check if user name is displayed
    expect(screen.getByText(/john/i)).toBeInTheDocument()
  })

  it('displays session statistics correctly', async () => {
    render(<DashboardPage />)

    await waitFor(() => {
      // Check total sessions
      expect(screen.getByText('2')).toBeInTheDocument() // Total sessions
      
      // Check completed sessions
      expect(screen.getByText('1')).toBeInTheDocument() // Completed sessions
      
      // Check average score (from completed session)
      expect(screen.getByText('85%')).toBeInTheDocument()
    })
  })

  it('shows recent sessions', async () => {
    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('Software Engineer')).toBeInTheDocument()
      expect(screen.getByText('Product Manager')).toBeInTheDocument()
      expect(screen.getByText('Google')).toBeInTheDocument()
      expect(screen.getByText('Meta')).toBeInTheDocument()
    })
  })

  it('displays session status correctly', async () => {
    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('Completed')).toBeInTheDocument()
      expect(screen.getByText('In Progress')).toBeInTheDocument()
    })
  })

  it('handles loading state', () => {
    mockUseInterviewStore.mockReturnValue({
      sessions: [],
      currentSession: null,
      isLoading: true,
      error: null,
      loadSessions: jest.fn(),
      createSession: jest.fn(),
      updateSession: jest.fn(),
      deleteSession: jest.fn(),
      setCurrentSession: jest.fn(),
      clearError: jest.fn()
    })

    render(<DashboardPage />)

    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('handles error state', () => {
    mockUseInterviewStore.mockReturnValue({
      sessions: [],
      currentSession: null,
      isLoading: false,
      error: 'Failed to load sessions',
      loadSessions: jest.fn(),
      createSession: jest.fn(),
      updateSession: jest.fn(),
      deleteSession: jest.fn(),
      setCurrentSession: jest.fn(),
      clearError: jest.fn()
    })

    render(<DashboardPage />)

    expect(screen.getByText(/failed to load sessions/i)).toBeInTheDocument()
  })

  it('handles empty sessions state', () => {
    mockUseInterviewStore.mockReturnValue({
      sessions: [],
      currentSession: null,
      isLoading: false,
      error: null,
      loadSessions: jest.fn(),
      createSession: jest.fn(),
      updateSession: jest.fn(),
      deleteSession: jest.fn(),
      setCurrentSession: jest.fn(),
      clearError: jest.fn()
    })

    render(<DashboardPage />)

    expect(screen.getByText(/no recent sessions/i)).toBeInTheDocument()
  })

  it('calls loadSessions on mount', () => {
    const mockLoadSessions = jest.fn()
    
    mockUseInterviewStore.mockReturnValue({
      sessions: [],
      currentSession: null,
      isLoading: false,
      error: null,
      loadSessions: mockLoadSessions,
      createSession: jest.fn(),
      updateSession: jest.fn(),
      deleteSession: jest.fn(),
      setCurrentSession: jest.fn(),
      clearError: jest.fn()
    })

    render(<DashboardPage />)

    expect(mockLoadSessions).toHaveBeenCalledTimes(1)
  })

  it('navigates to create interview when button is clicked', async () => {
    const mockPush = jest.fn()
    
    jest.doMock('next/navigation', () => ({
      useRouter: () => ({
        push: mockPush,
        back: jest.fn(),
        forward: jest.fn(),
        refresh: jest.fn(),
        replace: jest.fn(),
        prefetch: jest.fn()
      }),
      usePathname: () => '/dashboard',
      useSearchParams: () => new URLSearchParams()
    }))

    render(<DashboardPage />)

    const createButton = screen.getByText(/start new interview/i)
    fireEvent.click(createButton)

    expect(mockPush).toHaveBeenCalledWith('/dashboard/interviews/new')
  })

  it('displays quick action buttons', async () => {
    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText(/start new interview/i)).toBeInTheDocument()
      expect(screen.getByText(/view analytics/i)).toBeInTheDocument()
      expect(screen.getByText(/upload resume/i)).toBeInTheDocument()
      expect(screen.getByText(/find expert/i)).toBeInTheDocument()
    })
  })

  it('shows performance metrics for completed sessions', async () => {
    render(<DashboardPage />)

    await waitFor(() => {
      // Check if performance score is displayed
      expect(screen.getByText('85')).toBeInTheDocument()
      
      // Check if category scores are shown
      expect(screen.getByText(/technical/i)).toBeInTheDocument()
      expect(screen.getByText(/behavioral/i)).toBeInTheDocument()
      expect(screen.getByText(/communication/i)).toBeInTheDocument()
    })
  })

  it('handles unauthenticated user', () => {
    mockUseAuthStore.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn(),
      register: jest.fn(),
      updateProfile: jest.fn(),
      clearError: jest.fn(),
      error: null
    })

    render(<DashboardPage />)

    // Should show default user name or redirect
    expect(screen.getByText(/user/i)).toBeInTheDocument()
  })
})
