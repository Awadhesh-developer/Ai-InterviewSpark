'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { X, Play } from 'lucide-react'

interface DemoModalProps {
  isOpen: boolean
  onClose: () => void
}

export function DemoModal({ isOpen, onClose }: DemoModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-75"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">
            AI-InterviewSpark Demo
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center mb-6">
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Play className="h-8 w-8 text-white ml-1" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Interactive Demo Coming Soon!
              </h3>
              <p className="text-gray-600 mb-6">
                Experience our AI-powered interview platform with a live demonstration.
              </p>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">🎯 Smart Questions</h4>
                    <p className="text-blue-700 text-sm">AI generates personalized questions based on your role and experience</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-purple-900 mb-2">📊 Real-time Analysis</h4>
                    <p className="text-purple-700 text-sm">Get instant feedback on your performance and body language</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-900 mb-2">🎥 Video Practice</h4>
                    <p className="text-green-700 text-sm">Practice with realistic video interviews and voice sessions</p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-orange-900 mb-2">📈 Progress Tracking</h4>
                    <p className="text-orange-700 text-sm">Monitor improvement with detailed analytics and insights</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={onClose}>
              Start Free Trial
            </Button>
            <Button variant="outline" size="lg" onClick={onClose}>
              Learn More
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
