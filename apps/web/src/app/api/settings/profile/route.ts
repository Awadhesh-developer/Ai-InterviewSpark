import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Get user ID from auth context (implement based on your auth system)
    const userId = 'current-user' // Replace with actual user ID from auth

    // Mock user profile data - replace with actual database query
    const userProfile = {
      id: userId,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      role: 'Administrator',
      avatar: '',
      bio: 'Experienced software engineer and interview coach',
      timezone: 'UTC-8',
      language: 'en',
      notifications: {
        email: true,
        push: true,
        sms: false,
        marketing: false
      },
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      profile: userProfile
    })
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = 'current-user' // Replace with actual user ID from auth
    const body = await request.json()

    // Validate required fields
    const { firstName, lastName, email } = body
    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: firstName, lastName, email' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Update user profile in database
    // This is a mock implementation - replace with actual database update
    const updatedProfile = {
      id: userId,
      firstName,
      lastName,
      email,
      bio: body.bio || '',
      timezone: body.timezone || 'UTC',
      language: body.language || 'en',
      notifications: body.notifications || {
        email: true,
        push: true,
        sms: false,
        marketing: false
      },
      updatedAt: new Date().toISOString()
    }

    // Log the update for audit purposes
    console.log(`User profile updated for ${userId}:`, {
      fields: Object.keys(body),
      timestamp: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      profile: updatedProfile,
      message: 'Profile updated successfully'
    })
  } catch (error) {
    console.error('Error updating user profile:', error)
    return NextResponse.json(
      { error: 'Failed to update user profile' },
      { status: 500 }
    )
  }
}
