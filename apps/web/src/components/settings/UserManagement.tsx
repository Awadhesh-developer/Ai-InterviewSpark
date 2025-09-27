'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { unifiedApiClient } from '@/lib/unified-api'
import { toast } from 'sonner'
import {
  Users,
  UserPlus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Shield,
  User,
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Settings,
  Download,
  Upload,
  RefreshCw,
  Loader2
} from 'lucide-react'

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
  permissions: string[]
}

interface UserManagementProps {
  onCreateUser: () => void
  onEditUser: (user: User) => void
  onDeleteUser: (userId: string) => void
  onViewUser?: (user: User) => void
}


const roleConfig = {
  admin: { 
    name: 'Administrator', 
    color: 'bg-red-100 dark:bg-red-950/20 text-red-800 dark:text-red-400 border-red-200 dark:border-red-800',
    icon: <Shield className="h-3 w-3" />
  },
  expert: { 
    name: 'Expert Coach', 
    color: 'bg-blue-100 dark:bg-blue-950/20 text-blue-800 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    icon: <Users className="h-3 w-3" />
  },
  manager: { 
    name: 'Manager', 
    color: 'bg-purple-100 dark:bg-purple-950/20 text-purple-800 dark:text-purple-400 border-purple-200 dark:border-purple-800',
    icon: <Settings className="h-3 w-3" />
  },
  user: { 
    name: 'Standard User', 
    color: 'bg-green-100 dark:bg-green-950/20 text-green-800 dark:text-green-400 border-green-200 dark:border-green-800',
    icon: <User className="h-3 w-3" />
  }
}

const statusConfig = {
  active: { 
    name: 'Active', 
    color: 'bg-green-100 dark:bg-green-950/20 text-green-800 dark:text-green-400',
    icon: <CheckCircle className="h-3 w-3" />
  },
  inactive: { 
    name: 'Inactive', 
    color: 'bg-gray-100 dark:bg-gray-950/20 text-gray-800 dark:text-gray-400',
    icon: <XCircle className="h-3 w-3" />
  },
  pending: { 
    name: 'Pending', 
    color: 'bg-yellow-100 dark:bg-yellow-950/20 text-yellow-800 dark:text-yellow-400',
    icon: <AlertTriangle className="h-3 w-3" />
  }
}

export default function UserManagement({ onCreateUser, onEditUser, onDeleteUser, onViewUser }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [stats, setStats] = useState({ total: 0, active: 0, pending: 0, admins: 0 })

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)

      const params: any = {}
      if (searchTerm) params.search = searchTerm
      if (selectedRole !== 'all') params.role = selectedRole
      if (selectedStatus !== 'all') params.status = selectedStatus

      const data = await unifiedApiClient.getUsers(params)

      setUsers(data.users || [])
      setStats(data.stats || { total: 0, active: 0, pending: 0, admins: 0 })
    } catch (error) {
      console.error('Error fetching users:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch users'
      setError(errorMessage)
      setUsers([])
      setStats({ total: 0, active: 0, pending: 0, admins: 0 })
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Fetch users on component mount and when filters change
  useEffect(() => {
    fetchUsers()
  }, [searchTerm, selectedRole, selectedStatus])

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.department.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesRole = selectedRole === 'all' || user.role === selectedRole
    const matchesStatus = selectedStatus === 'all' || user.status === selectedStatus

    return matchesSearch && matchesRole && matchesStatus
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatLastLogin = (dateString: string | null) => {
    if (!dateString) return 'Never'
    
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const selectAllUsers = () => {
    setSelectedUsers(
      selectedUsers.length === filteredUsers.length 
        ? [] 
        : filteredUsers.map(user => user.id)
    )
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">User Management</h2>
          <p className="text-muted-foreground">Manage users, roles, and permissions</p>
        </div>
        <Button onClick={onCreateUser} className="bg-primary hover:bg-primary/90">
          <UserPlus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {stats.active}
                </p>
                <p className="text-sm text-muted-foreground">Active Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {stats.pending}
                </p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-red-600 dark:text-red-400" />
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {stats.admins}
                </p>
                <p className="text-sm text-muted-foreground">Admins</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search users by name, email, or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Role Filter */}
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-3 py-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">All Roles</option>
              <option value="admin">Administrator</option>
              <option value="expert">Expert Coach</option>
              <option value="manager">Manager</option>
              <option value="user">Standard User</option>
            </select>
            
            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>
            
            {/* Actions */}
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchUsers}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Refresh
              </Button>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <Upload className="mr-2 h-4 w-4" />
                Import
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Users ({filteredUsers.length})</CardTitle>
            {selectedUsers.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">
                  {selectedUsers.length} selected
                </span>
                <Button variant="outline" size="sm">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Selected
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span className="text-muted-foreground">Loading users...</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">Error loading users</h3>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button onClick={fetchUsers} variant="outline">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
              </div>
            </div>
          )}

          {/* Users Table */}
          {!loading && !error && (
            <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3">
                    <input
                      type="checkbox"
                      checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                      onChange={selectAllUsers}
                      className="rounded border-border"
                    />
                  </th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">User</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Role</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Department</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Last Login</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Created</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-border hover:bg-muted/50">
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => toggleUserSelection(user.id)}
                        className="rounded border-border"
                      />
                    </td>
                    <td className="p-3">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar} alt={`${user.firstName} ${user.lastName}`} />
                          <AvatarFallback className="text-xs">
                            {getInitials(user.firstName, user.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge className={`${roleConfig[user.role as keyof typeof roleConfig]?.color} border`}>
                        <span className="flex items-center space-x-1">
                          {roleConfig[user.role as keyof typeof roleConfig]?.icon}
                          <span>{roleConfig[user.role as keyof typeof roleConfig]?.name}</span>
                        </span>
                      </Badge>
                    </td>
                    <td className="p-3">
                      <span className="text-sm text-foreground">{user.department}</span>
                    </td>
                    <td className="p-3">
                      <Badge className={`${statusConfig[user.status]?.color} border`}>
                        <span className="flex items-center space-x-1">
                          {statusConfig[user.status]?.icon}
                          <span>{statusConfig[user.status]?.name}</span>
                        </span>
                      </Badge>
                    </td>
                    <td className="p-3">
                      <span className="text-sm text-muted-foreground">
                        {formatLastLogin(user.lastLogin)}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="text-sm text-muted-foreground">
                        {formatDate(user.createdAt)}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEditUser(user)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewUser?.(user)}
                          title="View user details"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDeleteUser(user.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredUsers.length === 0 && (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No users found</h3>
                <p className="text-muted-foreground">
                  {searchTerm || selectedRole !== 'all' || selectedStatus !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'Get started by creating your first user'
                  }
                </p>
              </div>
            )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
