'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Target,
  Plus,
  Calendar,
  TrendingUp,
  CheckCircle,
  Clock,
  Star,
  Zap,
  Award,
  AlertTriangle,
  Edit,
  Trash2,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react'

interface SmartGoal {
  id: string
  title: string
  description: string
  category: 'technical' | 'behavioral' | 'communication' | 'confidence' | 'overall'
  type: 'score' | 'sessions' | 'streak' | 'skill' | 'time'
  target: number
  current: number
  unit: string
  deadline: Date
  priority: 'high' | 'medium' | 'low'
  status: 'active' | 'paused' | 'completed' | 'overdue'
  milestones: GoalMilestone[]
  createdAt: Date
  completedAt?: Date
}

interface GoalMilestone {
  id: string
  title: string
  target: number
  completed: boolean
  completedAt?: Date
}

interface SmartGoalsProps {
  userId: string
}

export default function SmartGoals({ userId }: SmartGoalsProps) {
  const [goals, setGoals] = useState<SmartGoal[]>([
    {
      id: '1',
      title: 'Improve Technical Interview Score',
      description: 'Reach 85% average score in technical interviews',
      category: 'technical',
      type: 'score',
      target: 85,
      current: 78,
      unit: '%',
      deadline: new Date('2024-03-15'),
      priority: 'high',
      status: 'active',
      milestones: [
        { id: '1a', title: 'Reach 80%', target: 80, completed: false },
        { id: '1b', title: 'Reach 82%', target: 82, completed: false },
        { id: '1c', title: 'Reach 85%', target: 85, completed: false }
      ],
      createdAt: new Date('2024-01-15')
    },
    {
      id: '2',
      title: 'Practice Consistency',
      description: 'Complete 30 practice sessions this month',
      category: 'overall',
      type: 'sessions',
      target: 30,
      current: 18,
      unit: 'sessions',
      deadline: new Date('2024-02-29'),
      priority: 'medium',
      status: 'active',
      milestones: [
        { id: '2a', title: '10 sessions', target: 10, completed: true, completedAt: new Date('2024-02-05') },
        { id: '2b', title: '20 sessions', target: 20, completed: false },
        { id: '2c', title: '30 sessions', target: 30, completed: false }
      ],
      createdAt: new Date('2024-02-01')
    },
    {
      id: '3',
      title: 'Reduce Filler Words',
      description: 'Reduce filler words to under 2 per minute',
      category: 'communication',
      type: 'skill',
      target: 2,
      current: 4.2,
      unit: 'per min',
      deadline: new Date('2024-02-20'),
      priority: 'high',
      status: 'active',
      milestones: [
        { id: '3a', title: 'Under 4 per min', target: 4, completed: true, completedAt: new Date('2024-02-08') },
        { id: '3b', title: 'Under 3 per min', target: 3, completed: false },
        { id: '3c', title: 'Under 2 per min', target: 2, completed: false }
      ],
      createdAt: new Date('2024-01-20')
    }
  ])

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    category: 'overall' as SmartGoal['category'],
    type: 'score' as SmartGoal['type'],
    target: 0,
    unit: '%',
    deadline: '',
    priority: 'medium' as SmartGoal['priority']
  })

  const getStatusColor = (status: SmartGoal['status']) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'paused': return 'bg-yellow-100 text-yellow-800'
      case 'overdue': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: SmartGoal['priority']) => {
    switch (priority) {
      case 'high': return 'border-red-500 bg-red-50'
      case 'medium': return 'border-yellow-500 bg-yellow-50'
      case 'low': return 'border-green-500 bg-green-50'
      default: return 'border-gray-500 bg-gray-50'
    }
  }

  const getCategoryIcon = (category: SmartGoal['category']) => {
    switch (category) {
      case 'technical': return <Zap className="h-4 w-4" />
      case 'behavioral': return <Star className="h-4 w-4" />
      case 'communication': return <Target className="h-4 w-4" />
      case 'confidence': return <TrendingUp className="h-4 w-4" />
      default: return <Award className="h-4 w-4" />
    }
  }

  const calculateProgress = (goal: SmartGoal) => {
    if (goal.type === 'skill' && goal.target < goal.current) {
      // For goals where lower is better (like filler words)
      const maxValue = goal.current * 2 // Assume starting point is twice the target
      return Math.max(0, Math.min(100, ((maxValue - goal.current) / (maxValue - goal.target)) * 100))
    }
    return Math.min(100, (goal.current / goal.target) * 100)
  }

  const getDaysRemaining = (deadline: Date) => {
    const today = new Date()
    const diffTime = deadline.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const createGoal = () => {
    const goal: SmartGoal = {
      id: Date.now().toString(),
      ...newGoal,
      current: 0,
      deadline: new Date(newGoal.deadline),
      status: 'active',
      milestones: [],
      createdAt: new Date()
    }
    
    setGoals([...goals, goal])
    setIsCreateDialogOpen(false)
    setNewGoal({
      title: '',
      description: '',
      category: 'overall',
      type: 'score',
      target: 0,
      unit: '%',
      deadline: '',
      priority: 'medium'
    })
  }

  const toggleGoalStatus = (goalId: string) => {
    setGoals(goals.map(goal => {
      if (goal.id === goalId) {
        const newStatus = goal.status === 'active' ? 'paused' : 'active'
        return { ...goal, status: newStatus }
      }
      return goal
    }))
  }

  const deleteGoal = (goalId: string) => {
    setGoals(goals.filter(goal => goal.id !== goalId))
  }

  const activeGoals = goals.filter(goal => goal.status === 'active')
  const completedGoals = goals.filter(goal => goal.status === 'completed')
  const overdueGoals = goals.filter(goal => {
    const daysRemaining = getDaysRemaining(goal.deadline)
    return daysRemaining < 0 && goal.status === 'active'
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Smart Goals</h2>
          <p className="text-muted-foreground">Set and track your interview improvement goals</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Goal</DialogTitle>
              <DialogDescription>
                Set a specific, measurable goal to improve your interview performance
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                  placeholder="e.g., Improve technical interview score"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={newGoal.description}
                  onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                  placeholder="Describe your goal in detail"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <Select value={newGoal.category} onValueChange={(value: any) => setNewGoal({ ...newGoal, category: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="behavioral">Behavioral</SelectItem>
                      <SelectItem value="communication">Communication</SelectItem>
                      <SelectItem value="confidence">Confidence</SelectItem>
                      <SelectItem value="overall">Overall</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <Select value={newGoal.type} onValueChange={(value: any) => setNewGoal({ ...newGoal, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="score">Score</SelectItem>
                      <SelectItem value="sessions">Sessions</SelectItem>
                      <SelectItem value="streak">Streak</SelectItem>
                      <SelectItem value="skill">Skill Metric</SelectItem>
                      <SelectItem value="time">Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Target</label>
                  <Input
                    type="number"
                    value={newGoal.target}
                    onChange={(e) => setNewGoal({ ...newGoal, target: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Unit</label>
                  <Input
                    value={newGoal.unit}
                    onChange={(e) => setNewGoal({ ...newGoal, unit: e.target.value })}
                    placeholder="%, sessions, days"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Deadline</label>
                <Input
                  type="date"
                  value={newGoal.deadline}
                  onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Priority</label>
                <Select value={newGoal.priority} onValueChange={(value: any) => setNewGoal({ ...newGoal, priority: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={createGoal} className="w-full">
                Create Goal
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Goals Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{activeGoals.length}</p>
                <p className="text-sm text-muted-foreground">Active Goals</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{completedGoals.length}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{overdueGoals.length}</p>
                <p className="text-sm text-muted-foreground">Overdue</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">
                  {Math.round(goals.reduce((sum, goal) => sum + calculateProgress(goal), 0) / goals.length)}%
                </p>
                <p className="text-sm text-muted-foreground">Avg Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Goals */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Active Goals</h3>
        {activeGoals.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No active goals</h3>
              <p className="text-muted-foreground mb-4">
                Create your first goal to start tracking your interview improvement
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Goal
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {activeGoals.map((goal) => {
              const progress = calculateProgress(goal)
              const daysRemaining = getDaysRemaining(goal.deadline)
              const isOverdue = daysRemaining < 0
              
              return (
                <Card key={goal.id} className={`border-l-4 ${getPriorityColor(goal.priority)}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        {getCategoryIcon(goal.category)}
                        <CardTitle className="text-lg">{goal.title}</CardTitle>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(goal.status)}>
                          {goal.status}
                        </Badge>
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleGoalStatus(goal.id)}
                          >
                            {goal.status === 'active' ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteGoal(goal.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    <CardDescription>{goal.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{goal.current} / {goal.target} {goal.unit}</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                      <div className="text-xs text-muted-foreground">
                        {Math.round(progress)}% complete
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center space-x-2 text-sm">
                        <Calendar className="h-3 w-3" />
                        <span className={isOverdue ? 'text-red-600' : 'text-muted-foreground'}>
                          {isOverdue ? `${Math.abs(daysRemaining)} days overdue` : `${daysRemaining} days left`}
                        </span>
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {goal.priority} priority
                      </Badge>
                    </div>
                    
                    {goal.milestones.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Milestones</h4>
                        <div className="space-y-1">
                          {goal.milestones.map((milestone) => (
                            <div key={milestone.id} className="flex items-center space-x-2 text-sm">
                              <CheckCircle className={`h-3 w-3 ${milestone.completed ? 'text-green-500' : 'text-gray-300'}`} />
                              <span className={milestone.completed ? 'line-through text-muted-foreground' : ''}>
                                {milestone.title}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
