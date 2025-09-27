'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { 
  Shield,
  Users,
  Settings,
  Database,
  BarChart3,
  FileText,
  MessageSquare,
  Calendar,
  CreditCard,
  Eye,
  Edit,
  Trash2,
  Plus,
  Check,
  X,
  AlertTriangle,
  Lock,
  Unlock
} from 'lucide-react'

interface Permission {
  id: string
  name: string
  description: string
  category: string
  icon: React.ReactNode
  critical?: boolean
}

interface PermissionCategory {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  permissions: Permission[]
}

interface UserRole {
  id: string
  name: string
  description: string
  permissions: string[]
  userCount: number
  isSystem: boolean
  color: string
}

const permissionCategories: PermissionCategory[] = [
  {
    id: 'system',
    name: 'System Administration',
    description: 'Core system management and configuration',
    icon: <Settings className="h-5 w-5" />,
    permissions: [
      {
        id: 'all',
        name: 'All Permissions',
        description: 'Complete system access - use with extreme caution',
        category: 'system',
        icon: <Shield className="h-4 w-4" />,
        critical: true
      },
      {
        id: 'system_settings',
        name: 'System Settings',
        description: 'Configure system-wide settings and preferences',
        category: 'system',
        icon: <Settings className="h-4 w-4" />,
        critical: true
      },
      {
        id: 'backup_restore',
        name: 'Backup & Restore',
        description: 'Create backups and restore system data',
        category: 'system',
        icon: <Database className="h-4 w-4" />,
        critical: true
      }
    ]
  },
  {
    id: 'user_management',
    name: 'User Management',
    description: 'Manage users, roles, and permissions',
    icon: <Users className="h-5 w-5" />,
    permissions: [
      {
        id: 'user_create',
        name: 'Create Users',
        description: 'Create new user accounts',
        category: 'user_management',
        icon: <Plus className="h-4 w-4" />
      },
      {
        id: 'user_edit',
        name: 'Edit Users',
        description: 'Modify existing user accounts',
        category: 'user_management',
        icon: <Edit className="h-4 w-4" />
      },
      {
        id: 'user_delete',
        name: 'Delete Users',
        description: 'Remove user accounts from the system',
        category: 'user_management',
        icon: <Trash2 className="h-4 w-4" />,
        critical: true
      },
      {
        id: 'role_management',
        name: 'Role Management',
        description: 'Create and modify user roles and permissions',
        category: 'user_management',
        icon: <Shield className="h-4 w-4" />,
        critical: true
      }
    ]
  },
  {
    id: 'coaching',
    name: 'Coaching & Sessions',
    description: 'Coaching session management and delivery',
    icon: <MessageSquare className="h-5 w-5" />,
    permissions: [
      {
        id: 'coaching_conduct',
        name: 'Conduct Coaching',
        description: 'Lead coaching sessions with users',
        category: 'coaching',
        icon: <MessageSquare className="h-4 w-4" />
      },
      {
        id: 'session_management',
        name: 'Session Management',
        description: 'Schedule and manage coaching sessions',
        category: 'coaching',
        icon: <Calendar className="h-4 w-4" />
      },
      {
        id: 'content_management',
        name: 'Content Management',
        description: 'Create and edit coaching content',
        category: 'coaching',
        icon: <FileText className="h-4 w-4" />
      }
    ]
  },
  {
    id: 'features',
    name: 'Platform Features',
    description: 'Access to core platform functionality',
    icon: <FileText className="h-5 w-5" />,
    permissions: [
      {
        id: 'interviews',
        name: 'Interview Practice',
        description: 'Access interview practice features',
        category: 'features',
        icon: <MessageSquare className="h-4 w-4" />
      },
      {
        id: 'resume_tools',
        name: 'Resume Tools',
        description: 'Access resume building and optimization tools',
        category: 'features',
        icon: <FileText className="h-4 w-4" />
      },
      {
        id: 'ai_coaching',
        name: 'AI Coaching',
        description: 'Access AI-powered coaching features',
        category: 'features',
        icon: <MessageSquare className="h-4 w-4" />
      }
    ]
  },
  {
    id: 'analytics',
    name: 'Analytics & Reporting',
    description: 'Data analysis and reporting capabilities',
    icon: <BarChart3 className="h-5 w-5" />,
    permissions: [
      {
        id: 'analytics_view',
        name: 'View Analytics',
        description: 'Access detailed analytics and performance metrics',
        category: 'analytics',
        icon: <BarChart3 className="h-4 w-4" />
      },
      {
        id: 'analytics_basic',
        name: 'Basic Analytics',
        description: 'View basic performance metrics',
        category: 'analytics',
        icon: <Eye className="h-4 w-4" />
      },
      {
        id: 'reports_generate',
        name: 'Generate Reports',
        description: 'Create and export detailed reports',
        category: 'analytics',
        icon: <FileText className="h-4 w-4" />
      }
    ]
  },
  {
    id: 'billing',
    name: 'Billing & Finance',
    description: 'Financial management and billing operations',
    icon: <CreditCard className="h-5 w-5" />,
    permissions: [
      {
        id: 'billing_view',
        name: 'View Billing',
        description: 'Access billing information and invoices',
        category: 'billing',
        icon: <Eye className="h-4 w-4" />
      },
      {
        id: 'billing_manage',
        name: 'Manage Billing',
        description: 'Modify billing settings and payment methods',
        category: 'billing',
        icon: <CreditCard className="h-4 w-4" />,
        critical: true
      }
    ]
  }
]

const defaultRoles: UserRole[] = [
  {
    id: 'admin',
    name: 'Administrator',
    description: 'Full system access with all permissions',
    permissions: ['all'],
    userCount: 2,
    isSystem: true,
    color: 'bg-red-100 dark:bg-red-950/20 text-red-800 dark:text-red-400 border-red-200 dark:border-red-800'
  },
  {
    id: 'expert',
    name: 'Expert Coach',
    description: 'Can conduct coaching sessions and manage content',
    permissions: ['coaching_conduct', 'session_management', 'content_management', 'analytics_view'],
    userCount: 15,
    isSystem: true,
    color: 'bg-blue-100 dark:bg-blue-950/20 text-blue-800 dark:text-blue-400 border-blue-200 dark:border-blue-800'
  },
  {
    id: 'manager',
    name: 'Manager',
    description: 'Can manage users and view analytics',
    permissions: ['user_create', 'user_edit', 'analytics_view', 'reports_generate'],
    userCount: 8,
    isSystem: true,
    color: 'bg-purple-100 dark:bg-purple-950/20 text-purple-800 dark:text-purple-400 border-purple-200 dark:border-purple-800'
  },
  {
    id: 'user',
    name: 'Standard User',
    description: 'Basic access to interviews and resume features',
    permissions: ['interviews', 'resume_tools', 'ai_coaching', 'analytics_basic'],
    userCount: 1247,
    isSystem: true,
    color: 'bg-green-100 dark:bg-green-950/20 text-green-800 dark:text-green-400 border-green-200 dark:border-green-800'
  }
]

interface PermissionManagerProps {
  selectedRole?: UserRole
  onRoleUpdate?: (role: UserRole) => void
  onCreateRole?: () => void
}

export default function PermissionManager({ selectedRole, onRoleUpdate, onCreateRole }: PermissionManagerProps) {
  const [roles, setRoles] = useState<UserRole[]>(defaultRoles)
  const [activeRole, setActiveRole] = useState<UserRole | null>(selectedRole || roles[0])
  const [isEditing, setIsEditing] = useState(false)

  const getAllPermissions = (): Permission[] => {
    return permissionCategories.flatMap(category => category.permissions)
  }

  const hasPermission = (permissionId: string): boolean => {
    if (!activeRole) return false
    return activeRole.permissions.includes('all') || activeRole.permissions.includes(permissionId)
  }

  const togglePermission = (permissionId: string) => {
    if (!activeRole || activeRole.isSystem) return

    const newPermissions = hasPermission(permissionId)
      ? activeRole.permissions.filter(p => p !== permissionId)
      : [...activeRole.permissions, permissionId]

    const updatedRole = { ...activeRole, permissions: newPermissions }
    setActiveRole(updatedRole)
    
    if (onRoleUpdate) {
      onRoleUpdate(updatedRole)
    }
  }

  const getPermissionIcon = (permission: Permission) => {
    if (permission.critical) {
      return <AlertTriangle className="h-3 w-3 text-red-500" />
    }
    return permission.icon
  }

  const getPermissionBadgeColor = (permission: Permission) => {
    if (permission.critical) {
      return 'bg-red-100 dark:bg-red-950/20 text-red-800 dark:text-red-400 border-red-200 dark:border-red-800'
    }
    return 'bg-blue-100 dark:bg-blue-950/20 text-blue-800 dark:text-blue-400 border-blue-200 dark:border-blue-800'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Permission Management</h2>
          <p className="text-muted-foreground">Manage roles and permissions for system access</p>
        </div>
        <Button onClick={onCreateRole} className="bg-primary hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" />
          Create Role
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Roles List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-primary" />
              <span>User Roles</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {roles.map((role) => (
              <div
                key={role.id}
                onClick={() => setActiveRole(role)}
                className={`p-3 rounded-lg cursor-pointer transition-all border ${
                  activeRole?.id === role.id
                    ? `${role.color} border-2`
                    : 'border-border bg-card hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-foreground">{role.name}</h4>
                    <p className="text-sm text-muted-foreground">{role.userCount} users</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {role.isSystem && (
                      <Lock className="h-3 w-3 text-muted-foreground" />
                    )}
                    {activeRole?.id === role.id && (
                      <Check className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Permission Categories */}
        <div className="lg:col-span-2 space-y-4">
          {activeRole && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <Users className="h-5 w-5 text-primary" />
                      <span>{activeRole.name} Permissions</span>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{activeRole.description}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={activeRole.color}>
                      {activeRole.permissions.includes('all') ? 'All Permissions' : `${activeRole.permissions.length} permissions`}
                    </Badge>
                    {activeRole.isSystem && (
                      <Badge variant="outline" className="text-muted-foreground">
                        <Lock className="mr-1 h-3 w-3" />
                        System Role
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {activeRole.permissions.includes('all') ? (
                  <div className="text-center py-8">
                    <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">Administrator Access</h3>
                    <p className="text-muted-foreground">
                      This role has complete system access with all permissions enabled.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {permissionCategories.map((category) => (
                      <div key={category.id} className="space-y-3">
                        <div className="flex items-center space-x-2 pb-2 border-b border-border">
                          {category.icon}
                          <h3 className="font-medium text-foreground">{category.name}</h3>
                          <span className="text-sm text-muted-foreground">({category.description})</span>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-3">
                          {category.permissions.map((permission) => (
                            <div
                              key={permission.id}
                              className="flex items-center justify-between p-3 border border-border rounded-lg bg-card"
                            >
                              <div className="flex items-center space-x-3">
                                <div className="flex items-center space-x-2">
                                  {getPermissionIcon(permission)}
                                  <span className="font-medium text-foreground">{permission.name}</span>
                                  {permission.critical && (
                                    <Badge className={getPermissionBadgeColor(permission)}>
                                      Critical
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">{permission.description}</p>
                              </div>
                              
                              <Switch
                                checked={hasPermission(permission.id)}
                                onCheckedChange={() => togglePermission(permission.id)}
                                disabled={activeRole.isSystem}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Permission Summary */}
      {activeRole && !activeRole.permissions.includes('all') && (
        <Card>
          <CardHeader>
            <CardTitle>Permission Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {permissionCategories.map((category) => {
                const categoryPermissions = category.permissions.filter(p => 
                  activeRole.permissions.includes(p.id)
                )
                const totalPermissions = category.permissions.length
                const percentage = Math.round((categoryPermissions.length / totalPermissions) * 100)
                
                return (
                  <div key={category.id} className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-center mb-2">
                      {category.icon}
                    </div>
                    <h4 className="font-medium text-foreground text-sm">{category.name}</h4>
                    <p className="text-2xl font-bold text-primary">{categoryPermissions.length}/{totalPermissions}</p>
                    <p className="text-xs text-muted-foreground">{percentage}% access</p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
