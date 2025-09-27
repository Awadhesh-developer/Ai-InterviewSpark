'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Upload,
  FileText,
  X,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Loader2,
  File,
  Image,
  FileType
} from 'lucide-react'

interface UploadedFile {
  file: File
  preview?: string
  progress: number
  status: 'uploading' | 'processing' | 'completed' | 'error'
  error?: string
}

export default function ResumeUploadPage() {
  const router = useRouter()
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [resumeName, setResumeName] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      progress: 0,
      status: 'uploading' as const
    }))
    
    setUploadedFiles(prev => [...prev, ...newFiles])
    
    // Simulate upload process
    newFiles.forEach((fileObj, index) => {
      simulateUpload(uploadedFiles.length + index)
    })
  }, [uploadedFiles.length])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    maxFiles: 5,
    maxSize: 10 * 1024 * 1024 // 10MB
  })

  const simulateUpload = (fileIndex: number) => {
    const interval = setInterval(() => {
      setUploadedFiles(prev => {
        const updated = [...prev]
        if (updated[fileIndex]) {
          if (updated[fileIndex].progress < 100) {
            updated[fileIndex].progress += Math.random() * 20
          } else {
            updated[fileIndex].status = 'processing'
            clearInterval(interval)
            
            // Simulate processing
            setTimeout(() => {
              setUploadedFiles(prev => {
                const processed = [...prev]
                if (processed[fileIndex]) {
                  processed[fileIndex].status = 'completed'
                }
                return processed
              })
            }, 2000)
          }
        }
        return updated
      })
    }, 500)
  }

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    switch (extension) {
      case 'pdf':
        return <FileType className="h-8 w-8 text-red-500" />
      case 'doc':
      case 'docx':
        return <FileText className="h-8 w-8 text-blue-500" />
      case 'txt':
        return <File className="h-8 w-8 text-gray-500" />
      default:
        return <FileText className="h-8 w-8 text-gray-500" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploading':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  const handleSaveResume = async () => {
    if (uploadedFiles.length === 0 || !resumeName.trim()) {
      return
    }

    setIsUploading(true)
    try {
      // Upload each file
      for (const fileObj of uploadedFiles) {
        if (fileObj.status === 'completed') {
          // TODO: Implement API call to save resume
          // await apiClient.uploadResume(fileObj.file)
        }
      }

      // Simulate API call for now
      await new Promise(resolve => setTimeout(resolve, 2000))

      router.push('/dashboard/resume')
    } catch (error) {
      console.error('Failed to save resume:', error)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-600">Upload Resume</h1>
          <p className="text-gray-600 mt-1">
            Upload your resume for AI-powered analysis and optimization
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Resume Name */}
          <Card>
            <CardHeader>
              <CardTitle>Resume Details</CardTitle>
              <CardDescription>
                Give your resume a name for easy identification
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="resumeName">Resume Name</Label>
                <Input
                  id="resumeName"
                  placeholder="e.g., Software Engineer Resume 2024"
                  value={resumeName}
                  onChange={(e) => setResumeName(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* File Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Upload Files</CardTitle>
              <CardDescription>
                Drag and drop your resume files or click to browse
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                {isDragActive ? (
                  <p className="text-blue-600">Drop the files here...</p>
                ) : (
                  <div>
                    <p className="text-gray-600 mb-2">
                      Drag and drop your resume files here, or click to select files
                    </p>
                    <p className="text-sm text-gray-500">
                      Supports PDF, DOC, DOCX, TXT (max 10MB each)
                    </p>
                  </div>
                )}
              </div>

              {/* Uploaded Files */}
              {uploadedFiles.length > 0 && (
                <div className="mt-6 space-y-4">
                  <h4 className="font-medium text-gray-600">Uploaded Files</h4>
                  {uploadedFiles.map((fileObj, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          {getFileIcon(fileObj.file.name)}
                          <div>
                            <p className="font-medium text-gray-600">{fileObj.file.name}</p>
                            <p className="text-sm text-gray-500">
                              {(fileObj.file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(fileObj.status)}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {fileObj.status === 'uploading' && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>Uploading...</span>
                            <span>{Math.round(fileObj.progress)}%</span>
                          </div>
                          <Progress value={fileObj.progress} className="h-2" />
                        </div>
                      )}
                      
                      {fileObj.status === 'processing' && (
                        <div className="flex items-center space-x-2 text-sm text-yellow-600">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Processing and analyzing...</span>
                        </div>
                      )}
                      
                      {fileObj.status === 'completed' && (
                        <div className="flex items-center space-x-2 text-sm text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          <span>Upload completed successfully</span>
                        </div>
                      )}
                      
                      {fileObj.status === 'error' && (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            {fileObj.error || 'Upload failed. Please try again.'}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Info Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload Guidelines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium text-gray-600">Supported Formats</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• PDF (.pdf)</li>
                  <li>• Microsoft Word (.doc, .docx)</li>
                  <li>• Plain Text (.txt)</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-gray-600">File Requirements</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Maximum file size: 10MB</li>
                  <li>• Maximum 5 files per upload</li>
                  <li>• Clear, readable text</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-gray-600">What We Analyze</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• ATS compatibility score</li>
                  <li>• Keyword optimization</li>
                  <li>• Format and structure</li>
                  <li>• Content quality</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Privacy & Security</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Your resume data is encrypted and stored securely. We never share your personal information with third parties.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button
          onClick={handleSaveResume}
          disabled={uploadedFiles.length === 0 || !resumeName.trim() || isUploading}
          className="flex items-center space-x-2"
        >
          {isUploading && <Loader2 className="h-4 w-4 animate-spin" />}
          <span>{isUploading ? 'Saving...' : 'Save Resume'}</span>
        </Button>
      </div>
    </div>
  )
}
