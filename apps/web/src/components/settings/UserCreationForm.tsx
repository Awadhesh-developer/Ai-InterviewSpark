'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { 
  UserPlus,
  Mail,
  User,
  Shield,
  Key,
  Eye,
  EyeOff,
  Check,
  X,
  AlertCircle,
  Users,
  Settings,
  Database,
  BarChart3,
  FileText,
  MessageSquare,
  Calendar,
  CreditCard,
  Edit
} from 'lucide-react'

interface UserRole {
  id: string
  name: string
  description: string
  permissions: string[]
  color: string
  icon: React.ReactNode
}

interface Permission {
  id: string
  name: string
  description: string
  category: string
}

interface UserFormData {
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword: string
  role: string
  department: string
  phoneNumber: string
  bio: string
  sendWelcomeEmail: boolean
  requirePasswordChange: boolean
  isActive: boolean
  permissions: string[]
}

const defaultRoles: UserRole[] = [
  {
    id: 'admin',
    name: 'Administrator',
    description: 'Full system access with all permissions',
    permissions: ['all'],
    color: 'bg-red-100 dark:bg-red-950/20 text-red-800 dark:text-red-400 border-red-200 dark:border-red-800',
    icon: <Shield className="h-4 w-4" />
  },
  {
    id: 'expert',
    name: 'Expert Coach',
    description: 'Can conduct coaching sessions and manage content',
    permissions: ['coaching', 'sessions', 'analytics', 'content_management'],
    color: 'bg-blue-100 dark:bg-blue-950/20 text-blue-800 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    icon: <Users className="h-4 w-4" />
  },
  {
    id: 'manager',
    name: 'Manager',
    description: 'Can manage users and view analytics',
    permissions: ['user_management', 'analytics', 'reports'],
    color: 'bg-purple-100 dark:bg-purple-950/20 text-purple-800 dark:text-purple-400 border-purple-200 dark:border-purple-800',
    icon: <BarChart3 className="h-4 w-4" />
  },
  {
    id: 'user',
    name: 'Standard User',
    description: 'Basic access to interviews and resume features',
    permissions: ['interviews', 'resume', 'basic_analytics'],
    color: 'bg-green-100 dark:bg-green-950/20 text-green-800 dark:text-green-400 border-green-200 dark:border-green-800',
    icon: <User className="h-4 w-4" />
  }
]

const availablePermissions: Permission[] = [
  { id: 'all', name: 'All Permissions', description: 'Complete system access', category: 'System' },
  { id: 'user_management', name: 'User Management', description: 'Create, edit, and delete users', category: 'Administration' },
  { id: 'role_management', name: 'Role Management', description: 'Manage user roles and permissions', category: 'Administration' },
  { id: 'system_settings', name: 'System Settings', description: 'Configure system-wide settings', category: 'Administration' },
  { id: 'coaching', name: 'Coaching', description: 'Conduct coaching sessions', category: 'Coaching' },
  { id: 'sessions', name: 'Session Management', description: 'Manage coaching sessions', category: 'Coaching' },
  { id: 'content_management', name: 'Content Management', description: 'Create and edit content', category: 'Content' },
  { id: 'interviews', name: 'Interviews', description: 'Access interview features', category: 'Features' },
  { id: 'resume', name: 'Resume Tools', description: 'Access resume building tools', category: 'Features' },
  { id: 'analytics', name: 'Analytics', description: 'View detailed analytics', category: 'Analytics' },
  { id: 'basic_analytics', name: 'Basic Analytics', description: 'View basic performance metrics', category: 'Analytics' },
  { id: 'reports', name: 'Reports', description: 'Generate and view reports', category: 'Analytics' },
  { id: 'billing', name: 'Billing', description: 'Manage billing and subscriptions', category: 'Finance' }
]

interface UserCreationFormProps {
  onSubmit: (userData: UserFormData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
  editingUser?: any // User data when editing
  isEditMode?: boolean // Whether we're editing or creating
}

export default function UserCreationForm({ onSubmit, onCancel, isLoading = false, editingUser, isEditMode = false }: UserCreationFormProps) {
  const [formData, setFormData] = useState<UserFormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    department: '',
    phoneNumber: '',
    bio: '',
    sendWelcomeEmail: true,
    requirePasswordChange: true,
    isActive: true,
    permissions: []
  })

  // Pre-populate form data when editing
  useEffect(() => {
    if (isEditMode && editingUser) {
      setFormData({
        firstName: editingUser.firstName || '',
        lastName: editingUser.lastName || '',
        email: editingUser.email || '',
        password: '', // Don't pre-fill password for security
        confirmPassword: '',
        role: editingUser.role || '',
        department: editingUser.department || '',
        phoneNumber: editingUser.phoneNumber || '',
        bio: editingUser.bio || '',
        sendWelcomeEmail: false, // Don't send welcome email when editing
        requirePasswordChange: false,
        isActive: editingUser.status === 'active',
        permissions: editingUser.permissions || []
      })
      
      // Set selected role for permissions
      const role = defaultRoles.find(r => r.id === editingUser.role)
      setSelectedRole(role || null)
    }
  }, [isEditMode, editingUser])

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Required fields
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required'
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required'
    if (!formData.email.trim()) newErrors.email = 'Email is required'
    if (!isEditMode && !formData.password) newErrors.password = 'Password is required' // Password only required when creating
    if (!formData.role) newErrors.role = 'Role is required'

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    // Password validation - match backend requirements exactly
    if (formData.password) {
      if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters long'
      } else {
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/
        if (!passwordRegex.test(formData.password)) {
          newErrors.password = 'Password must contain uppercase, lowercase, number, and special character (@$!%*?&)'
        }
      }
    }

    // Password confirmation (only validate if password is entered)
    if (formData.password && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }


    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    try {
      await onSubmit(formData)
    } catch (error) {
      console.error('Error creating user:', error)
    }
  }

  const handleRoleChange = (roleId: string) => {
    const role = defaultRoles.find(r => r.id === roleId)
    setSelectedRole(role || null)
    setFormData(prev => ({
      ...prev,
      role: roleId,
      permissions: role?.permissions || []
    }))
  }

  const togglePermission = (permissionId: string) => {
    if (selectedRole?.permissions.includes('all')) return // Can't modify admin permissions

    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(p => p !== permissionId)
        : [...prev.permissions, permissionId]
    }))
  }

  const getPermissionsByCategory = () => {
    const categories: Record<string, Permission[]> = {}
    availablePermissions.forEach(permission => {
      if (!categories[permission.category]) {
        categories[permission.category] = []
      }
      categories[permission.category].push(permission)
    })
    return categories
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {isEditMode ? (
              <>
                <Edit className="h-5 w-5 text-primary" />
                <span>Edit User</span>
              </>
            ) : (
              <>
                <UserPlus className="h-5 w-5 text-primary" />
                <span>Create New User</span>
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground">Basic Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    className={errors.firstName ? 'border-red-500' : ''}
                  />
                  {errors.firstName && (
                    <p className="text-sm text-red-500 mt-1 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.firstName}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    className={errors.lastName ? 'border-red-500' : ''}
                  />
                  {errors.lastName && (
                    <p className="text-sm text-red-500 mt-1 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.lastName}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email Address *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                    placeholder="user@example.com"
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-500 mt-1 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {errors.email}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="password">Password *</Label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      className={`pl-10 pr-10 ${errors.password ? 'border-red-500' : ''}`}
                      placeholder="Minimum 8 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-red-500 mt-1 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.password}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className={`pl-10 pr-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                      placeholder="Confirm password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-sm text-red-500 mt-1 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Role Assignment */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground">Role Assignment</h3>
              
              <div>
                <Label>Select Role *</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                  {defaultRoles.map((role) => (
                    <div
                      key={role.id}
                      onClick={() => handleRoleChange(role.id)}
                      className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                        formData.role === role.id
                          ? `${role.color} border-2`
                          : 'border-border bg-card hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="mt-1">{role.icon}</div>
                        <div className="flex-1">
                          <h4 className="font-medium">{role.name}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{role.description}</p>
                          <div className="flex items-center mt-2">
                            <Badge variant="outline" className="text-xs">
                              {role.permissions.includes('all') ? 'All Permissions' : `${role.permissions.length} permissions`}
                            </Badge>
                          </div>
                        </div>
                        {formData.role === role.id && (
                          <Check className="h-5 w-5 text-green-600" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {errors.role && (
                  <p className="text-sm text-red-500 mt-1 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {errors.role}
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-6 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-primary hover:bg-primary/90"
              >
                {isLoading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                    {isEditMode ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    {isEditMode ? (
                      <>
                        <Edit className="mr-2 h-4 w-4" />
                        Update User
                      </>
                    ) : (
                      <>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Create User
                      </>
                    )}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
