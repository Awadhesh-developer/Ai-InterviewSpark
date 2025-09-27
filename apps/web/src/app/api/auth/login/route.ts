import { NextRequest, NextResponse } from 'next/server'
import { compare } from 'bcryptjs'
import { sign } from 'jsonwebtoken'
import { z } from 'zod'

import { users } from '@/lib/authStore'

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request body
    const validationResult = loginSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        message: validationResult.error.errors[0].message
      }, { status: 400 })
    }

    const { email, password } = validationResult.data

    // Users are held in shared in-memory store for demo

    // Find user by email
    const user = users.find(u => u.email === email)
    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'Invalid email or password'
      }, { status: 401 })
    }

    // Verify password
    const isValidPassword = await compare(password, user.password)
    if (!isValidPassword) {
      return NextResponse.json({
        success: false,
        message: 'Invalid email or password'
      }, { status: 401 })
    }

    // Update last login
    user.lastLoginAt = new Date().toISOString()

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
    const token = sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role
      },
      jwtSecret,
      { expiresIn: '24h' }
    )

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({
      success: true,
      data: {
        user: userWithoutPassword,
        token,
        refreshToken: `refresh-${Date.now()}`
      },
      message: 'Login successful'
    })

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error during login'
    }, { status: 500 })
  }
}