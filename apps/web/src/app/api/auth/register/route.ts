import { NextRequest, NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { sign } from 'jsonwebtoken'
import { z } from 'zod'

// In-memory storage (temporary). In production, use a database.
import { users } from '@/lib/authStore'

const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.enum(['job_seeker', 'expert', 'admin']).default('job_seeker')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request body
    const validationResult = registerSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        message: validationResult.error.errors[0].message
      }, { status: 400 })
    }

    const { email, password, firstName, lastName, role } = validationResult.data

    // Check if user already exists
    const existingUser = users.find(user => user.email === email)
    if (existingUser) {
      return NextResponse.json({
        success: false,
        message: 'User with this email already exists'
      }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await hash(password, 12)

    // Create new user
    const newUser = {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      email,
      firstName,
      lastName,
      role,
      avatar: `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face`,
      bio: '',
      location: '',
      timezone: 'UTC',
      language: 'en',
      accessibility: {
        highContrast: false,
        screenReader: false,
        captions: true
      },
      password: hashedPassword,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // Add user to in-memory storage
    users.push(newUser)

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
    const token = sign(
      {
        userId: newUser.id,
        email: newUser.email,
        role: newUser.role
      },
      jwtSecret,
      { expiresIn: '24h' }
    )

    // Return user data without password
    const { password: _, ...userWithoutPassword } = newUser

    return NextResponse.json({
      success: true,
      data: {
        user: userWithoutPassword,
        token,
        refreshToken: `refresh-${Date.now()}`
      },
      message: 'User registered successfully'
    })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error during registration'
    }, { status: 500 })
  }
}

// Do not export non-handler values from route files