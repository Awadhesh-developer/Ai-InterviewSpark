import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
  department: string
  status: 'active' | 'inactive' | 'pending'
  avatar?: string
  phoneNumber?: string
  lastLogin?: string
  createdAt: string
  updatedAt: string
  permissions: string[]
  passwordHash?: string
}

interface CreateUserRequest {
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
}

// Helper function to get authorization headers
function getAuthHeaders(request: NextRequest) {
  // First try to get token from Authorization header
  const authHeader = request.headers.get('authorization')
  if (authHeader) {
    return {
      'Content-Type': 'application/json',
      'Authorization': authHeader
    }
  }

  // Then try to get token from cookies
  const cookies = request.headers.get('cookie')
  let authToken = null

  if (cookies) {
    const cookieArray = cookies.split(';').map(c => c.trim())
    const authCookie = cookieArray.find(c => c.startsWith('auth_token='))
    if (authCookie) {
      authToken = authCookie.split('=')[1]
    }
  }

  // If no token found, try localStorage via client-side (this won't work on server-side)
  // For server-side routes, we need to get the token from cookies or headers

  return {
    'Content-Type': 'application/json',
    ...(authToken && { 'Authorization': `Bearer ${authToken}` })
  }
}

// Helper function to transform backend user to frontend format
function transformUser(backendUser: any): User {
  return {
    id: backendUser.id,
    firstName: backendUser.firstName || backendUser.first_name,
    lastName: backendUser.lastName || backendUser.last_name,
    email: backendUser.email,
    role: backendUser.role,
    department: getDepartmentFromRole(backendUser.role),
    status: backendUser.status || 'active',
    avatar: backendUser.avatar || '',
    phoneNumber: backendUser.phoneNumber || backendUser.phone_number || '',
    lastLogin: backendUser.lastLoginAt || backendUser.last_login_at,
    createdAt: backendUser.createdAt || backendUser.created_at,
    updatedAt: backendUser.updatedAt || backendUser.updated_at,
    permissions: getPermissionsFromRole(backendUser.role)
  }
}

// Helper function to get department based on role
function getDepartmentFromRole(role: string): string {
  const departmentMap: { [key: string]: string } = {
    'admin': 'Administration',
    'expert': 'Coaching',
    'job_seeker': 'General',
    'user': 'General'
  }
  return departmentMap[role] || 'General'
}

// Helper function to get permissions based on role
function getPermissionsFromRole(role: string): string[] {
  const permissionMap: { [key: string]: string[] } = {
    'admin': ['all'],
    'expert': ['coaching', 'sessions', 'analytics'],
    'job_seeker': ['interviews', 'resume', 'basic_analytics'],
    'user': ['interviews', 'resume', 'basic_analytics']
  }
  return permissionMap[role] || ['interviews', 'resume']
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || 'all'
    const status = searchParams.get('status') || 'all'

    // Try to fetch users from backend API
    const params = new URLSearchParams()
    if (limit) params.set('limit', limit.toString())
    if (page && page > 1) params.set('offset', ((page - 1) * limit).toString())
    if (role !== 'all') params.set('role', role)
    if (search) params.set('search', search)
    if (status !== 'all') params.set('status', status)

    const backendUrl = `${API_BASE_URL}/api/users?${params.toString()}`

    try {
      const response = await fetch(backendUrl, {
        method: 'GET',
        headers: getAuthHeaders(request),
        cache: 'no-store'
      })

      if (response.ok) {
        const backendData = await response.json()

        if (backendData.success && backendData.users) {
          // Use the properly formatted response from backend
          return NextResponse.json(backendData)
        }
      }
    } catch (backendError) {
      console.warn('Backend API unavailable, falling back to mock data:', backendError)
    }

    // Fallback to mock users data if backend is unavailable or authentication fails
    const mockUsers = [
      {
        id: '1',
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@interviewspark.com',
        role: 'admin',
        department: 'Administration',
        status: 'active',
        avatar: '',
        phoneNumber: '+1 (555) 123-4567',
        lastLogin: '2024-01-20T10:30:00Z',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: new Date().toISOString(),
        permissions: ['all']
      },
      {
        id: '2',
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'expert@interviewspark.com',
        role: 'expert',
        department: 'Coaching',
        status: 'active',
        avatar: '',
        phoneNumber: '+1 (555) 234-5678',
        lastLogin: '2024-01-19T15:45:00Z',
        createdAt: '2024-01-05T00:00:00Z',
        updatedAt: new Date().toISOString(),
        permissions: ['coaching', 'sessions', 'analytics']
      },
      {
        id: '3',
        firstName: 'John',
        lastName: 'Doe',
        email: 'user@interviewspark.com',
        role: 'job_seeker',
        department: 'General',
        status: 'active',
        avatar: '',
        phoneNumber: '+1 (555) 345-6789',
        lastLogin: '2024-01-18T09:15:00Z',
        createdAt: '2024-01-10T00:00:00Z',
        updatedAt: new Date().toISOString(),
        permissions: ['interviews', 'resume', 'basic_analytics']
      }
    ]

    // Apply filtering
    let filteredUsers = mockUsers

    if (search) {
      const searchTerm = search.toLowerCase()
      filteredUsers = filteredUsers.filter(user =>
        user.firstName.toLowerCase().includes(searchTerm) ||
        user.lastName.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm) ||
        user.department.toLowerCase().includes(searchTerm)
      )
    }

    if (role !== 'all') {
      filteredUsers = filteredUsers.filter(user => user.role === role)
    }

    if (status !== 'all') {
      filteredUsers = filteredUsers.filter(user => user.status === status)
    }

    // Calculate stats
    const stats = {
      total: filteredUsers.length,
      active: filteredUsers.filter(u => u.status === 'active').length,
      pending: filteredUsers.filter(u => (u.status as any) === 'pending').length,
      inactive: filteredUsers.filter(u => u.status === 'inactive').length,
      admins: filteredUsers.filter(u => u.role === 'admin').length
    }

    return NextResponse.json({
      success: true,
      users: filteredUsers,
      pagination: {
        page,
        limit,
        total: filteredUsers.length,
        totalPages: Math.ceil(filteredUsers.length / limit)
      },
      stats
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateUserRequest = await request.json()

    // Prepare user data for backend API
    const userData = {
      email: body.email,
      password: body.password,
      firstName: body.firstName,
      lastName: body.lastName,
      role: body.role,
      phoneNumber: body.phoneNumber || '',
      bio: body.bio || ''
    }

    // Send request to backend API
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(request)
      },
      body: JSON.stringify(userData)
    })

    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json(
        { error: errorData.error || 'Failed to create user' },
        { status: response.status }
      )
    }

    const result = await response.json()

    if (result.success) {
      // Transform the created user to frontend format
      const transformedUser = transformUser(result.data.user)

      return NextResponse.json({
        success: true,
        user: transformedUser,
        message: 'User created successfully'
      }, { status: 201 })
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to create user' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, ...updates } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Send update request to backend API
    const response = await fetch(`${API_BASE_URL}/api/users/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(request)
      },
      body: JSON.stringify({
        firstName: updates.firstName,
        lastName: updates.lastName,
        bio: updates.bio,
        location: updates.location,
        timezone: updates.timezone,
        language: updates.language,
        accessibility: updates.accessibility,
        phoneNumber: updates.phoneNumber
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json(
        { error: errorData.error || 'Failed to update user' },
        { status: response.status }
      )
    }

    const result = await response.json()

    if (result.success) {
      // Transform the updated user to frontend format
      const transformedUser = transformUser(result.data)

      return NextResponse.json({
        success: true,
        user: transformedUser,
        message: 'User updated successfully'
      })
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to update user' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const userIds = searchParams.get('userIds')?.split(',')

    if (!userId && !userIds) {
      return NextResponse.json(
        { error: 'User ID(s) required' },
        { status: 400 }
      )
    }

    const idsToDelete = userId ? [userId] : userIds || []
    const successfulDeletions: string[] = []
    const failedDeletions: string[] = []

    // Delete each user via backend API
    for (const id of idsToDelete) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/users/${id}`, {
          method: 'DELETE',
          headers: getAuthHeaders(request)
        })

        if (response.ok) {
          successfulDeletions.push(id)
        } else {
          failedDeletions.push(id)
          console.error(`Failed to delete user ${id}:`, await response.text())
        }
      } catch (error) {
        failedDeletions.push(id)
        console.error(`Error deleting user ${id}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      deletedCount: successfulDeletions.length,
      failedCount: failedDeletions.length,
      message: `${successfulDeletions.length} user(s) deleted successfully${failedDeletions.length > 0 ? `, ${failedDeletions.length} failed` : ''}`
    })

  } catch (error) {
    console.error('Error deleting user(s):', error)
    return NextResponse.json(
      { error: 'Failed to delete user(s)' },
      { status: 500 }
    )
  }
}
