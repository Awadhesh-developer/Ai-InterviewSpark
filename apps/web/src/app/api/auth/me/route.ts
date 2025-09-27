import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { users } from '@/lib/authStore'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

// Uses shared in-memory users store for demo purposes

export async function GET(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        success: false,
        message: 'No token provided'
      }, { status: 401 })
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    // Verify JWT token
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
    let decoded: any
    try {
      decoded = verify(token, jwtSecret)
    } catch (error) {
      return NextResponse.json({
        success: false,
        message: 'Invalid or expired token'
      }, { status: 401 })
    }

    // If no users registered yet, create a mock user for development
    if (!users || users.length === 0) {
      const mockUser = {
        id: decoded.userId,
        email: decoded.email,
        firstName: 'Demo',
        lastName: 'User',
        role: decoded.role || 'job_seeker',
        avatar: `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face`,
        bio: 'Demo user for development',
        location: 'San Francisco, CA',
        timezone: 'America/Los_Angeles',
        language: 'en',
        accessibility: {
          highContrast: false,
          screenReader: false,
          captions: true
        },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: new Date().toISOString()
      }

      return NextResponse.json({
        success: true,
        data: mockUser,
        message: 'User data retrieved successfully'
      })
    }

    // Find user by ID
    const user = users.find(u => u.id === decoded.userId)
    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'User not found'
      }, { status: 404 })
    }

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({
      success: true,
      data: userWithoutPassword,
      message: 'User data retrieved successfully'
    })

  } catch (error) {
    console.error('Get current user error:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 })
  }
}