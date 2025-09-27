'use client'

import React, { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  Upload,
  FileText,
  Scan,
  Brain,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Zap,
  Target,
  TrendingUp,
  Clock,
  Download
} from 'lucide-react'

interface ScanResult {
  id: string
  fileName: string
  fileSize: string
  scanDate: string
  atsScore: number
  issues: {
    critical: number
    important: number
    minor: number
  }
  keywords: {
    found: number
    missing: number
    density: number
  }
  formatting: {
    score: number
    issues: string[]
  }
  readability: {
    score: number
    level: string
  }
}

interface ATSScannerProps {
  onScanComplete?: (result: ScanResult) => void
  onFileUpload?: (file: File) => void
  isScanning?: boolean
  jobDescription?: string
}

export default function ATSScanner({ 
  onScanComplete, 
  onFileUpload, 
  isScanning = false,
  jobDescription = ''
}: ATSScannerProps) {
  const [dragActive, setDragActive] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [scanProgress, setScanProgress] = useState(0)
  const [scanStage, setScanStage] = useState('')

  // Mock scan result for demonstration
  const mockScanResult: ScanResult = {
    id: '1',
    fileName: 'resume.pdf',
    fileSize: '245 KB',
    scanDate: new Date().toISOString(),
    atsScore: 78,
    issues: {
      critical: 2,
      important: 4,
      minor: 6
    },
    keywords: {
      found: 12,
      missing: 8,
      density: 3.2
    },
    formatting: {
      score: 85,
      issues: ['Inconsistent bullet points', 'Non-standard section headers']
    },
    readability: {
      score: 76,
      level: 'Professional'
    }
  }

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0])
    }
  }, [])

  const handleFileUpload = (file: File) => {
    setUploadedFile(file)
    if (onFileUpload) {
      onFileUpload(file)
    }
    startScan(file)
  }

  const startScan = async (file: File) => {
    setScanProgress(0)
    setScanStage('Uploading file...')
    
    // Simulate scanning process
    const stages = [
      'Uploading file...',
      'Extracting text content...',
      'Analyzing formatting...',
      'Checking keyword density...',
      'Evaluating ATS compatibility...',
      'Generating recommendations...',
      'Finalizing report...'
    ]

    for (let i = 0; i < stages.length; i++) {
      setScanStage(stages[i])
      setScanProgress((i + 1) * (100 / stages.length))
      await new Promise(resolve => setTimeout(resolve, 800))
    }

    // Complete scan
    if (onScanComplete) {
      onScanComplete({
        ...mockScanResult,
        fileName: file.name,
        fileSize: `${Math.round(file.size / 1024)} KB`
      })
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400'
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 dark:bg-green-950/20 border-green-200 dark:border-green-800'
    if (score >= 60) return 'bg-yellow-100 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800'
    return 'bg-red-100 dark:bg-red-950/20 border-red-200 dark:border-red-800'
  }

  if (isScanning) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center space-y-4">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary mx-auto"></div>
              <Scan className="h-8 w-8 text-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-foreground">Scanning Your Resume</h3>
              <p className="text-muted-foreground">{scanStage}</p>
            </div>
            
            <div className="max-w-md mx-auto space-y-2">
              <Progress value={scanProgress} className="h-3" />
              <p className="text-sm text-muted-foreground">{Math.round(scanProgress)}% complete</p>
            </div>
            
            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mt-6">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <Brain className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">AI Analysis</p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <Target className="h-6 w-6 text-green-600 mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">ATS Check</p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600 mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">Optimization</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* File Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5 text-primary" />
            <span>Upload Resume for ATS Analysis</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-border hover:border-primary/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="p-4 bg-primary/10 rounded-full">
                  <FileText className="h-8 w-8 text-primary" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-foreground">
                  Drop your resume here or click to browse
                </h3>
                <p className="text-muted-foreground">
                  Supports PDF, DOC, DOCX files up to 10MB
                </p>
              </div>
              
              <Button 
                onClick={() => {
                  const input = document.createElement('input')
                  input.type = 'file'
                  input.accept = '.pdf,.doc,.docx'
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0]
                    if (file) handleFileUpload(file)
                  }
                  input.click()
                }}
                className="bg-primary hover:bg-primary/90"
              >
                <Upload className="mr-2 h-4 w-4" />
                Choose File
              </Button>
            </div>
          </div>
          
          {uploadedFile && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg border border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">{uploadedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {Math.round(uploadedFile.size / 1024)} KB
                    </p>
                  </div>
                </div>
                <Badge className="bg-green-100 dark:bg-green-950/20 text-green-800 dark:text-green-400">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Ready to scan
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Scan Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-primary" />
            <span>Quick Scan Options</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
              <div className="flex items-center space-x-3 mb-3">
                <Target className="h-6 w-6 text-blue-600" />
                <h4 className="font-medium text-foreground">Basic ATS Check</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Quick compatibility scan for common ATS systems
              </p>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>~30 seconds</span>
              </div>
            </div>
            
            <div className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
              <div className="flex items-center space-x-3 mb-3">
                <Brain className="h-6 w-6 text-purple-600" />
                <h4 className="font-medium text-foreground">AI-Powered Analysis</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Comprehensive analysis with AI recommendations
              </p>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>~2 minutes</span>
              </div>
            </div>
            
            <div className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
              <div className="flex items-center space-x-3 mb-3">
                <TrendingUp className="h-6 w-6 text-green-600" />
                <h4 className="font-medium text-foreground">Job Match Analysis</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Compare against specific job descriptions
              </p>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>~3 minutes</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Job Description Input */}
      {jobDescription && (
        <Card>
          <CardHeader>
            <CardTitle>Job Description Analysis</CardTitle>
            <p className="text-sm text-muted-foreground">
              Analyzing your resume against the provided job description
            </p>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-muted/50 rounded-lg border border-border">
              <p className="text-sm text-foreground line-clamp-3">
                {jobDescription}
              </p>
              <Button variant="outline" size="sm" className="mt-3">
                <Download className="mr-2 h-3 w-3" />
                View Full Description
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
