'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { GoalData, Goal } from '@/services/analyticsService'
import {
  Target,
  Plus,
  Calendar,
  CheckCircle,
  Clock,
  TrendingUp,
  Award,
  Flag,
  Edit,
  Trash2,
  Play,
  Pause,
  BarChart3
} from 'lucide-react'

interface GoalsTrackerProps {
  goals: GoalData
}

export function GoalsTracker({ goals }: GoalsTrackerProps) {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null)
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    target: 85,
    deadline: '',
    category: 'Performance',
    priority: 'medium' as 'high' | 'medium' | 'low'
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'active':
        return <Play className="h-4 w-4 text-blue-600" />
      case 'paused':
        return <Pause className="h-4 w-4 text-yellow-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-red-500 bg-red-50 text-red-700'
      case 'medium':
        return 'border-yellow-500 bg-yellow-50 text-yellow-700'
      case 'low':
        return 'border-green-500 bg-green-50 text-green-700'
      default:
        return 'border-gray-500 bg-gray-50 text-gray-700'
    }
  }

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-600'
    if (progress >= 60) return 'bg-yellow-600'
    return 'bg-blue-600'
  }

  const getDaysRemaining = (deadline: Date) => {
    const today = new Date()
    const diffTime = deadline.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const handleCreateGoal = () => {
    // In a real app, this would call an API to create the goal
    console.log('Creating goal:', newGoal)
    setShowCreateForm(false)
    setNewGoal({
      title: '',
      description: '',
      target: 85,
      deadline: '',
      category: 'Performance',
      priority: 'medium'
    })
  }

  const handleUpdateGoal = (goalId: string, updates: Partial<Goal>) => {
    // In a real app, this would call an API to update the goal
    console.log('Updating goal:', goalId, updates)
  }

  const calculateProgress = (goal: Goal) => {
    return Math.round((goal.current / goal.target) * 100)
  }

  return (
    <div className="space-y-6">
      {/* Goals Overview */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-green-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-6 w-6 text-blue-600" />
            <span>Goals Overview</span>
          </CardTitle>
          <CardDescription>
            Track your progress towards interview readiness goals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {goals.progress.overallCompletion}%
              </div>
              <div className="text-sm text-blue-700">Overall Progress</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {goals.progress.onTrackGoals}
              </div>
              <div className="text-sm text-green-700">On Track</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">
                {goals.progress.behindGoals}
              </div>
              <div className="text-sm text-orange-700">Behind Schedule</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {goals.progress.completedThisMonth}
              </div>
              <div className="text-sm text-purple-700">Completed This Month</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Goals */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Flag className="h-5 w-5 text-green-600" />
                <span>Active Goals</span>
              </CardTitle>
              <CardDescription>
                Your current goals and progress
              </CardDescription>
            </div>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Goal
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {goals.current.length === 0 ? (
            <div className="text-center py-12">
              <Target className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Goals</h3>
              <p className="text-gray-500 mb-4">Set your first goal to start tracking your progress</p>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Goal
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {goals.current.map((goal) => {
                const progress = calculateProgress(goal)
                const daysRemaining = getDaysRemaining(goal.deadline)
                
                return (
                  <div key={goal.id} className={`border rounded-lg p-4 ${getPriorityColor(goal.priority).split(' ')[0]}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(goal.status)}
                        <div>
                          <h4 className="font-medium text-gray-900">{goal.title}</h4>
                          <p className="text-sm text-gray-600">{goal.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getPriorityColor(goal.priority)}>
                          {goal.priority} priority
                        </Badge>
                        <Badge variant="outline">{goal.category}</Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span>Progress: {goal.current} / {goal.target}</span>
                        <span className="font-medium">{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${getProgressColor(progress)}`}
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4" />
                          <span>Due: {goal.deadline.toLocaleDateString()}</span>
                        </div>
                        <span className={daysRemaining < 7 ? 'text-red-600 font-medium' : ''}>
                          {daysRemaining > 0 ? `${daysRemaining} days left` : 'Overdue'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button size="sm" variant="outline">
                          <BarChart3 className="h-3 w-3 mr-1" />
                          Details
                        </Button>
                      </div>
                      <Button 
                        size="sm" 
                        variant={goal.status === 'active' ? 'secondary' : 'default'}
                        onClick={() => handleUpdateGoal(goal.id, { 
                          status: goal.status === 'active' ? 'paused' : 'active' 
                        })}
                      >
                        {goal.status === 'active' ? (
                          <>
                            <Pause className="h-3 w-3 mr-1" />
                            Pause
                          </>
                        ) : (
                          <>
                            <Play className="h-3 w-3 mr-1" />
                            Resume
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Goal Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plus className="h-5 w-5 text-blue-600" />
              <span>Create New Goal</span>
            </CardTitle>
            <CardDescription>
              Set a new goal to track your interview preparation progress
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Goal Title</Label>
                <Input
                  id="title"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({...newGoal, title: e.target.value})}
                  placeholder="e.g., Reach 85% average score"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="target">Target Value</Label>
                <Input
                  id="target"
                  type="number"
                  value={newGoal.target}
                  onChange={(e) => setNewGoal({...newGoal, target: Number(e.target.value)})}
                  placeholder="85"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newGoal.description}
                onChange={(e) => setNewGoal({...newGoal, description: e.target.value})}
                placeholder="Describe what you want to achieve..."
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deadline">Deadline</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={newGoal.deadline}
                  onChange={(e) => setNewGoal({...newGoal, deadline: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  value={newGoal.category}
                  onChange={(e) => setNewGoal({...newGoal, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Performance">Performance</option>
                  <option value="Skills">Skills</option>
                  <option value="Practice">Practice</option>
                  <option value="Knowledge">Knowledge</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <select
                  id="priority"
                  value={newGoal.priority}
                  onChange={(e) => setNewGoal({...newGoal, priority: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
            
            <div className="flex space-x-4">
              <Button onClick={handleCreateGoal}>
                Create Goal
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completed Goals */}
      {goals.completed.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Award className="h-5 w-5 text-yellow-600" />
              <span>Completed Goals</span>
            </CardTitle>
            <CardDescription>
              Goals you've successfully achieved
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {goals.completed.map((goal) => (
                <div key={goal.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <h4 className="font-medium text-green-900">{goal.title}</h4>
                      <p className="text-sm text-green-700">
                        Achieved {goal.current} / {goal.target}
                      </p>
                    </div>
                  </div>
                  <Badge variant="default">Completed</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Suggested Goals */}
      {goals.suggested.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <span>Suggested Goals</span>
            </CardTitle>
            <CardDescription>
              AI-recommended goals based on your performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {goals.suggested.map((goal) => (
                <div key={goal.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Target className="h-5 w-5 text-purple-600" />
                    <div>
                      <h4 className="font-medium text-gray-900">{goal.title}</h4>
                      <p className="text-sm text-gray-600">{goal.description}</p>
                    </div>
                  </div>
                  <Button size="sm">
                    <Plus className="h-3 w-3 mr-1" />
                    Add Goal
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
