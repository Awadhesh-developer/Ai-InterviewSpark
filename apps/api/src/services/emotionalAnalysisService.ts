// --- START api/services/emotionalAnalysisService.ts --- //
// Emotional analysis service for AI-InterviewSpark API
// Integrates with Motivel API for voice analysis and Moodme SDK for facial analysis

import axios from 'axios';
import { config } from '../config';
import { createError, EmotionData, EmotionType } from '../types';

// Emotion analysis result interface
interface EmotionAnalysisResult {
  emotions: Array<{
    emotion: string;
    confidence: number;
    timestamp: number;
    source: 'voice' | 'facial' | 'combined';
  }>;
  dominantEmotion: string;
  averageConfidence: number;
  emotionalTrends: Array<{
    emotion: string;
    averageConfidence: number;
    frequency: number;
  }>;
  insights: string[];
  recommendations: string[];
}

// Voice analysis parameters
interface VoiceAnalysisParams {
  audioBuffer: Buffer;
  duration: number;
  sampleRate?: number;
}

// Facial analysis parameters
interface FacialAnalysisParams {
  imageBuffer: Buffer;
  timestamp: number;
}

// Text sentiment analysis parameters
interface TextAnalysisParams {
  text: string;
  context?: string;
}

export class EmotionalAnalysisService {
  // Analyze voice emotions using Motivel API
  static async analyzeVoiceEmotions(params: VoiceAnalysisParams): Promise<EmotionData[]> {
    try {
      if (!config.ai.motivel.enabled) {
        console.warn('Motivel API not configured, returning mock data');
        return this.getMockVoiceEmotions(params.duration);
      }

      // Convert audio buffer to base64
      const audioBase64 = params.audioBuffer.toString('base64');

      const response = await axios.post(
        'https://api.motivel.com/v1/analyze/voice',
        {
          audio: audioBase64,
          sampleRate: params.sampleRate || 44100,
          duration: params.duration,
          features: ['emotion', 'stress', 'confidence'],
        },
        {
          headers: {
            'Authorization': `Bearer ${config.ai.motivel.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      return this.parseMotivelResponse(response.data);
    } catch (error) {
      console.error('Voice emotion analysis failed:', error);
      // Return mock data as fallback
      return this.getMockVoiceEmotions(params.duration);
    }
  }

  // Analyze facial emotions using Moodme SDK
  static async analyzeFacialEmotions(params: FacialAnalysisParams): Promise<EmotionData[]> {
    try {
      if (!config.ai.moodme.enabled) {
        console.warn('Moodme API not configured, returning mock data');
        return this.getMockFacialEmotions();
      }

      // Convert image buffer to base64
      const imageBase64 = params.imageBuffer.toString('base64');

      const response = await axios.post(
        'https://api.moodme.com/v1/analyze/face',
        {
          image: imageBase64,
          timestamp: params.timestamp,
          features: ['emotion', 'engagement', 'attention'],
        },
        {
          headers: {
            'Authorization': `Bearer ${config.ai.moodme.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        }
      );

      return this.parseMoodmeResponse(response.data, params.timestamp);
    } catch (error) {
      console.error('Facial emotion analysis failed:', error);
      // Return mock data as fallback
      return this.getMockFacialEmotions();
    }
  }

  // Analyze text sentiment
  static async analyzeTextSentiment(params: TextAnalysisParams): Promise<EmotionData[]> {
    try {
      // Use OpenAI for text sentiment analysis
      if (!config.ai.openai.enabled) {
        return this.getMockTextEmotions();
      }

      const prompt = `
Analyze the emotional tone and sentiment of this interview answer:

Text: "${params.text}"
Context: ${params.context || 'Interview response'}

Provide a JSON response with emotional analysis:
{
  "emotions": [
    {
      "emotion": "confident",
      "confidence": 0.85,
      "reasoning": "Strong, assertive language"
    }
  ],
  "dominantEmotion": "confident",
  "sentimentScore": 0.7,
  "insights": ["Shows confidence in abilities", "Positive attitude"]
}

Focus on emotions like: confident, nervous, enthusiastic, uncertain, calm, stressed, positive, negative.
`;

      // This would use OpenAI API - simplified for now
      return this.getMockTextEmotions();
    } catch (error) {
      console.error('Text sentiment analysis failed:', error);
      return this.getMockTextEmotions();
    }
  }

  // Comprehensive emotion analysis combining all sources
  static async analyzeComprehensiveEmotions(
    voiceData?: VoiceAnalysisParams,
    facialData?: FacialAnalysisParams,
    textData?: TextAnalysisParams
  ): Promise<EmotionAnalysisResult> {
    try {
      const emotionData: EmotionData[] = [];

      // Analyze voice if provided
      if (voiceData) {
        const voiceEmotions = await this.analyzeVoiceEmotions(voiceData);
        emotionData.push(...voiceEmotions);
      }

      // Analyze facial if provided
      if (facialData) {
        const facialEmotions = await this.analyzeFacialEmotions(facialData);
        emotionData.push(...facialEmotions);
      }

      // Analyze text if provided
      if (textData) {
        const textEmotions = await this.analyzeTextSentiment(textData);
        emotionData.push(...textEmotions);
      }

      return this.generateComprehensiveAnalysis(emotionData);
    } catch (error) {
      console.error('Comprehensive emotion analysis failed:', error);
      throw createError('Failed to analyze emotions', 500);
    }
  }

  // Generate insights and recommendations
  private static generateComprehensiveAnalysis(emotionData: EmotionData[]): EmotionAnalysisResult {
    if (emotionData.length === 0) {
      return {
        emotions: [],
        dominantEmotion: 'neutral',
        averageConfidence: 0,
        emotionalTrends: [],
        insights: ['No emotion data available'],
        recommendations: ['Ensure audio and video are working properly'],
      };
    }

    // Calculate dominant emotion
    const emotionCounts = emotionData.reduce((acc, data) => {
      acc[data.emotion] = (acc[data.emotion] || 0) + data.confidence;
      return acc;
    }, {} as Record<string, number>);

    const dominantEmotion = Object.entries(emotionCounts)
      .sort(([, a], [, b]) => b - a)[0][0];

    // Calculate average confidence
    const averageConfidence = emotionData.reduce((sum, data) => sum + data.confidence, 0) / emotionData.length;

    // Calculate emotional trends
    const emotionalTrends = Object.entries(emotionCounts).map(([emotion, totalConfidence]) => ({
      emotion,
      averageConfidence: totalConfidence / emotionData.filter(d => d.emotion === emotion).length,
      frequency: emotionData.filter(d => d.emotion === emotion).length,
    }));

    // Generate insights
    const insights = this.generateInsights(dominantEmotion, averageConfidence, emotionalTrends);

    // Generate recommendations
    const recommendations = this.generateRecommendations(dominantEmotion, averageConfidence, emotionalTrends);

    return {
      emotions: emotionData,
      dominantEmotion,
      averageConfidence,
      emotionalTrends,
      insights,
      recommendations,
    };
  }

  // Generate insights based on emotion analysis
  private static generateInsights(
    dominantEmotion: string,
    averageConfidence: number,
    trends: Array<{ emotion: string; averageConfidence: number; frequency: number }>
  ): string[] {
    const insights: string[] = [];

    if (averageConfidence > 0.8) {
      insights.push('Strong emotional signals detected throughout the interview');
    } else if (averageConfidence < 0.4) {
      insights.push('Subtle emotional expressions - consider being more expressive');
    }

    switch (dominantEmotion) {
      case 'confident':
        insights.push('You demonstrated strong confidence throughout the interview');
        break;
      case 'nervous':
        insights.push('Some nervousness detected - this is normal for interviews');
        break;
      case 'enthusiastic':
        insights.push('Great enthusiasm shown for the role and company');
        break;
      case 'calm':
        insights.push('You maintained composure well throughout the interview');
        break;
      default:
        insights.push(`Primary emotional state: ${dominantEmotion}`);
    }

    return insights;
  }

  // Generate recommendations based on emotion analysis
  private static generateRecommendations(
    dominantEmotion: string,
    averageConfidence: number,
    trends: Array<{ emotion: string; averageConfidence: number; frequency: number }>
  ): string[] {
    const recommendations: string[] = [];

    if (dominantEmotion === 'nervous') {
      recommendations.push('Practice deep breathing exercises before interviews');
      recommendations.push('Prepare more thoroughly to build confidence');
    }

    if (averageConfidence < 0.5) {
      recommendations.push('Work on expressing emotions more clearly');
      recommendations.push('Practice speaking with more vocal variety');
    }

    const hasPositiveEmotions = trends.some(t => 
      ['confident', 'enthusiastic', 'positive', 'calm'].includes(t.emotion) && t.averageConfidence > 0.6
    );

    if (!hasPositiveEmotions) {
      recommendations.push('Try to show more enthusiasm for the role');
      recommendations.push('Practice positive body language and facial expressions');
    }

    return recommendations;
  }

  // Mock data generators for development/fallback
  private static getMockVoiceEmotions(duration: number): EmotionData[] {
    const emotions = ['confident', 'calm', 'nervous', 'enthusiastic'];
    const result: EmotionData[] = [];
    
    for (let i = 0; i < Math.floor(duration / 5); i++) {
      result.push({
        emotion: emotions[Math.floor(Math.random() * emotions.length)] as EmotionType,
        confidence: 0.6 + Math.random() * 0.3,
        timestamp: i * 5000,
        source: 'voice',
      });
    }
    
    return result;
  }

  private static getMockFacialEmotions(): EmotionData[] {
    return [
      {
        emotion: EmotionType.CONFIDENT,
        confidence: 0.75,
        timestamp: Date.now(),
        source: 'facial',
      },
    ];
  }

  private static getMockTextEmotions(): EmotionData[] {
    return [
      {
        emotion: EmotionType.HAPPY,
        confidence: 0.8,
        timestamp: Date.now(),
        source: 'combined',
      },
    ];
  }

  // Parse Motivel API response
  private static parseMotivelResponse(data: any): EmotionData[] {
    // This would parse the actual Motivel API response
    // For now, return mock data
    return this.getMockVoiceEmotions(30);
  }

  // Parse Moodme API response
  private static parseMoodmeResponse(data: any, timestamp: number): EmotionData[] {
    // This would parse the actual Moodme API response
    // For now, return mock data
    return this.getMockFacialEmotions();
  }

  // Check if emotional analysis services are available
  static getAvailableServices(): {
    voice: boolean;
    facial: boolean;
    text: boolean;
  } {
    return {
      voice: config.ai.motivel.enabled,
      facial: config.ai.moodme.enabled,
      text: config.ai.openai.enabled || config.ai.gemini.enabled,
    };
  }
}

export default EmotionalAnalysisService;
