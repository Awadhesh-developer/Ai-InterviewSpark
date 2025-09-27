/**
 * React Hook for Cultural Intelligence
 * Provides comprehensive cultural adaptation, global localization, and cross-cultural assessment
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { 
  CulturalIntelligenceService,
  type CulturalIntelligenceResult,
  type CulturalProfile,
  type CulturallyAdaptedAssessment,
  type CulturalInsights,
  type CrossCulturalCompetence,
  type CulturalRecommendations,
  type CulturalIntelligenceConfig
} from '@/services/culturalIntelligenceService'

interface UseCulturalIntelligenceOptions {
  autoInitialize?: boolean
  enableCulturalDetection?: boolean
  enableAdaptiveAssessment?: boolean
  enableGlobalLocalization?: boolean
  enableCrossculturalAnalysis?: boolean
  culturalSensitivityLevel?: number
  adaptationDepth?: 'basic' | 'standard' | 'comprehensive' | 'expert'
  supportedCultures?: string[]
}

interface CulturalIntelligenceHookState {
  isInitialized: boolean
  isInitializing: boolean
  isAnalyzing: boolean
  latestResult: CulturalIntelligenceResult | null
  analysisHistory: CulturalIntelligenceResult[]
  culturalProfile: CulturalProfile | null
  adaptedAssessment: CulturallyAdaptedAssessment | null
  culturalInsights: CulturalInsights | null
  crossCulturalCompetence: CrossCulturalCompetence | null
  recommendations: CulturalRecommendations | null
  overallConfidence: number
  error: string | null
}

interface CulturalIntelligenceActions {
  initialize: () => Promise<void>
  analyzeCulturalIntelligence: (assessmentData: any, context?: any) => Promise<CulturalIntelligenceResult>
  updateConfig: (config: Partial<CulturalIntelligenceConfig>) => void
  clearHistory: () => void
  destroy: () => void
}

export function useCulturalIntelligence(options: UseCulturalIntelligenceOptions = {}): [CulturalIntelligenceHookState, CulturalIntelligenceActions] {
  const {
    autoInitialize = false,
    enableCulturalDetection = true,
    enableAdaptiveAssessment = true,
    enableGlobalLocalization = true,
    enableCrossculturalAnalysis = true,
    culturalSensitivityLevel = 0.8,
    adaptationDepth = 'comprehensive',
    supportedCultures = [
      'western-individualistic', 'eastern-collectivistic', 'latin-american',
      'middle-eastern', 'african', 'nordic', 'mediterranean', 'south-asian',
      'east-asian', 'southeast-asian', 'oceanic', 'indigenous'
    ]
  } = options

  const intelligenceServiceRef = useRef<CulturalIntelligenceService | null>(null)
  
  const [state, setState] = useState<CulturalIntelligenceHookState>({
    isInitialized: false,
    isInitializing: false,
    isAnalyzing: false,
    latestResult: null,
    analysisHistory: [],
    culturalProfile: null,
    adaptedAssessment: null,
    culturalInsights: null,
    crossCulturalCompetence: null,
    recommendations: null,
    overallConfidence: 0,
    error: null
  })

  // Initialize cultural intelligence service
  const initialize = useCallback(async () => {
    if (state.isInitializing || state.isInitialized) return

    setState(prev => ({ ...prev, isInitializing: true, error: null }))

    try {
      intelligenceServiceRef.current = new CulturalIntelligenceService({
        enableCulturalDetection,
        enableAdaptiveAssessment,
        enableGlobalLocalization,
        enableCrossculturalAnalysis,
        culturalSensitivityLevel,
        adaptationDepth,
        supportedCultures,
        biasDetectionEnabled: true
      })

      await intelligenceServiceRef.current.initialize()

      setState(prev => ({
        ...prev,
        isInitialized: true,
        isInitializing: false
      }))

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Cultural Intelligence initialization failed'
      setState(prev => ({
        ...prev,
        isInitializing: false,
        error: errorMessage
      }))
      throw error
    }
  }, [state.isInitializing, state.isInitialized, enableCulturalDetection, enableAdaptiveAssessment, enableGlobalLocalization, enableCrossculturalAnalysis, culturalSensitivityLevel, adaptationDepth, supportedCultures])

  // Analyze cultural intelligence
  const analyzeCulturalIntelligence = useCallback(async (assessmentData: any, context?: any): Promise<CulturalIntelligenceResult> => {
    if (!intelligenceServiceRef.current) {
      throw new Error('Cultural Intelligence Service not initialized')
    }

    setState(prev => ({ ...prev, isAnalyzing: true, error: null }))

    try {
      const result = await intelligenceServiceRef.current.analyzeCulturalIntelligence(assessmentData, {
        declaredCulture: context?.declaredCulture,
        detectedLanguage: context?.detectedLanguage || navigator.language,
        geolocation: context?.geolocation,
        userPreferences: context?.userPreferences,
        interviewContext: context?.interviewContext || 'standard_interview'
      })

      setState(prev => ({
        ...prev,
        latestResult: result,
        analysisHistory: [...prev.analysisHistory, result].slice(-50), // Keep last 50
        culturalProfile: result.culturalProfile,
        adaptedAssessment: result.adaptedAssessment,
        culturalInsights: result.culturalInsights,
        crossCulturalCompetence: result.crossCulturalCompetence,
        recommendations: result.recommendations,
        overallConfidence: result.confidence,
        isAnalyzing: false
      }))

      return result

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Cultural intelligence analysis failed'
      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        error: errorMessage
      }))
      throw error
    }
  }, [])

  // Update configuration
  const updateConfig = useCallback((config: Partial<CulturalIntelligenceConfig>) => {
    if (intelligenceServiceRef.current) {
      intelligenceServiceRef.current.updateConfig(config)
    }
  }, [])

  // Clear history
  const clearHistory = useCallback(() => {
    if (intelligenceServiceRef.current) {
      intelligenceServiceRef.current.clearHistory()
    }
    
    setState(prev => ({
      ...prev,
      latestResult: null,
      analysisHistory: [],
      culturalProfile: null,
      adaptedAssessment: null,
      culturalInsights: null,
      crossCulturalCompetence: null,
      recommendations: null,
      overallConfidence: 0
    }))
  }, [])

  // Destroy service
  const destroy = useCallback(() => {
    if (intelligenceServiceRef.current) {
      intelligenceServiceRef.current.destroy()
      intelligenceServiceRef.current = null
    }

    setState({
      isInitialized: false,
      isInitializing: false,
      isAnalyzing: false,
      latestResult: null,
      analysisHistory: [],
      culturalProfile: null,
      adaptedAssessment: null,
      culturalInsights: null,
      crossCulturalCompetence: null,
      recommendations: null,
      overallConfidence: 0,
      error: null
    })
  }, [])

  // Auto-initialize if requested
  useEffect(() => {
    if (autoInitialize && !state.isInitialized && !state.isInitializing) {
      initialize().catch(console.error)
    }
  }, [autoInitialize, initialize, state.isInitialized, state.isInitializing])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      destroy()
    }
  }, [destroy])

  const actions: CulturalIntelligenceActions = {
    initialize,
    analyzeCulturalIntelligence,
    updateConfig,
    clearHistory,
    destroy
  }

  return [state, actions]
}

// Specialized hook for interview cultural intelligence
export function useInterviewCulturalIntelligence() {
  const [state, actions] = useCulturalIntelligence({
    autoInitialize: true,
    enableCulturalDetection: true,
    enableAdaptiveAssessment: true,
    enableGlobalLocalization: true,
    enableCrossculturalAnalysis: true,
    culturalSensitivityLevel: 0.8,
    adaptationDepth: 'comprehensive'
  })

  return {
    ...state,
    ...actions,
    
    // Convenience getters for cultural profile
    primaryCulture: state.culturalProfile?.primaryCulture || null,
    culturalMix: state.culturalProfile?.culturalMix || [],
    culturalDimensions: state.culturalProfile?.culturalDimensions || null,
    communicationPreferences: state.culturalProfile?.communicationPreferences || null,
    behavioralPatterns: state.culturalProfile?.behavioralPatterns || null,
    valueSystem: state.culturalProfile?.valueSystem || null,
    adaptabilityProfile: state.culturalProfile?.adaptabilityProfile || null,
    
    // Convenience getters for cultural insights
    culturalStrengths: state.culturalInsights?.culturalStrengths || [],
    culturalChallenges: state.culturalInsights?.culturalChallenges || [],
    adaptationOpportunities: state.culturalInsights?.adaptationOpportunities || [],
    crossCulturalPotential: state.culturalInsights?.crossCulturalPotential || null,
    culturalRisks: state.culturalInsights?.culturalRisks || [],
    developmentAreas: state.culturalInsights?.developmentAreas || [],
    
    // Convenience getters for cross-cultural competence
    overallCompetence: state.crossCulturalCompetence?.overallCompetence || 0,
    culturalAwareness: state.crossCulturalCompetence?.culturalAwareness || 0,
    culturalKnowledge: state.crossCulturalCompetence?.culturalKnowledge || 0,
    culturalSkills: state.crossCulturalCompetence?.culturalSkills || 0,
    culturalAdaptation: state.crossCulturalCompetence?.culturalAdaptation || 0,
    culturalEmpathy: state.crossCulturalCompetence?.culturalEmpathy || 0,
    competenceBreakdown: state.crossCulturalCompetence?.competenceBreakdown || null,
    
    // Convenience getters for recommendations
    immediateRecommendations: state.recommendations?.immediate || [],
    shortTermRecommendations: state.recommendations?.shortTerm || [],
    longTermRecommendations: state.recommendations?.longTerm || [],
    culturalDevelopmentRecommendations: state.recommendations?.culturalDevelopment || [],
    organizationalAdaptations: state.recommendations?.organizationalAdaptations || [],
    recommendationPriority: state.recommendations?.priority || 'low',
    
    // Helper methods
    getPrimaryCulture: () => {
      return state.culturalProfile?.primaryCulture || 'unknown'
    },
    
    getCulturalInfluences: () => {
      return state.culturalProfile?.culturalMix.map(mix => ({
        culture: mix.culture,
        influence: mix.influence
      })) || []
    },
    
    getDirectnessLevel: () => {
      return state.culturalProfile?.communicationPreferences.directnessLevel || 0.5
    },
    
    getFormalityLevel: () => {
      return state.culturalProfile?.communicationPreferences.formalityPreference || 0.5
    },
    
    getContextLevel: () => {
      return state.culturalProfile?.communicationPreferences.contextLevel || 'medium'
    },
    
    getEmotionalExpressiveness: () => {
      return state.culturalProfile?.communicationPreferences.emotionalExpressiveness || 0.5
    },
    
    getHierarchyRespect: () => {
      return state.culturalProfile?.behavioralPatterns.respectDemonstration.hierarchyAwareness || 0.5
    },
    
    getConflictApproach: () => {
      return state.culturalProfile?.behavioralPatterns.conflictApproach.directnessAcceptance || 0.5
    },
    
    getTimeOrientation: () => {
      return state.culturalProfile?.behavioralPatterns.timeOrientation.punctualityImportance || 0.5
    },
    
    getCulturalFlexibility: () => {
      return state.culturalProfile?.adaptabilityProfile.culturalFlexibility || 0.5
    },
    
    getBiasAwareness: () => {
      return state.culturalProfile?.adaptabilityProfile.biasAwareness || 0.5
    },
    
    getInclusivityMindset: () => {
      return state.culturalProfile?.adaptabilityProfile.inclusivityMindset || 0.5
    },
    
    getCulturalAdaptationSpeed: () => {
      return state.culturalProfile?.adaptabilityProfile.adaptationSpeed || 0.5
    },
    
    getCrossCulturalExperience: () => {
      return state.culturalProfile?.adaptabilityProfile.crossCulturalExperience || 0.5
    },
    
    isHighContext: () => {
      return state.culturalProfile?.communicationPreferences.contextLevel === 'high'
    },
    
    isCollectivistic: () => {
      return state.culturalProfile?.culturalDimensions.hofstedeProfile.individualismCollectivism.score < 0.5
    },
    
    isHighPowerDistance: () => {
      return state.culturalProfile?.culturalDimensions.hofstedeProfile.powerDistance.score > 0.7
    },
    
    isUncertaintyAvoiding: () => {
      return state.culturalProfile?.culturalDimensions.hofstedeProfile.uncertaintyAvoidance.score > 0.7
    },
    
    isLongTermOriented: () => {
      return state.culturalProfile?.culturalDimensions.hofstedeProfile.longTermOrientation.score > 0.7
    },
    
    needsCulturalAdaptation: () => {
      return state.recommendations?.priority === 'high' || state.recommendations?.priority === 'critical'
    },
    
    hasHighCulturalRisk: () => {
      return state.culturalInsights?.culturalRisks.some(risk => risk.probability > 0.7) || false
    },
    
    hasStrongCulturalPotential: () => {
      return (state.culturalInsights?.crossCulturalPotential?.overallPotential || 0) > 0.7
    },
    
    isCulturallyAdaptable: () => {
      return (state.culturalProfile?.adaptabilityProfile.culturalFlexibility || 0) > 0.7
    },
    
    hasCulturalAwareness: () => {
      return (state.culturalProfile?.adaptabilityProfile.biasAwareness || 0) > 0.7
    },
    
    isInclusivityMinded: () => {
      return (state.culturalProfile?.adaptabilityProfile.inclusivityMindset || 0) > 0.7
    },
    
    getCulturalStrengthsText: () => {
      return state.culturalInsights?.culturalStrengths.map(strength => strength.strength) || []
    },
    
    getCulturalChallengesText: () => {
      return state.culturalInsights?.culturalChallenges.map(challenge => challenge.challenge) || []
    },
    
    getAdaptationOpportunitiesText: () => {
      return state.culturalInsights?.adaptationOpportunities.map(opp => opp.opportunity) || []
    },
    
    getCulturalRisksText: () => {
      return state.culturalInsights?.culturalRisks.map(risk => risk.risk) || []
    },
    
    getDevelopmentAreasText: () => {
      return state.culturalInsights?.developmentAreas.map(area => area.area) || []
    },
    
    getCoreValues: () => {
      return state.culturalProfile?.valueSystem.coreValues.map(value => value.value) || []
    },
    
    getWorkValues: () => {
      return state.culturalProfile?.valueSystem.workValues.map(value => value.value) || []
    },
    
    getCommunicationStyle: () => {
      const prefs = state.culturalProfile?.communicationPreferences
      if (!prefs) return 'unknown'
      
      if (prefs.directnessLevel > 0.7 && prefs.formalityPreference < 0.5) {
        return 'direct_informal'
      } else if (prefs.directnessLevel > 0.7 && prefs.formalityPreference > 0.7) {
        return 'direct_formal'
      } else if (prefs.directnessLevel < 0.5 && prefs.formalityPreference > 0.7) {
        return 'indirect_formal'
      } else {
        return 'indirect_informal'
      }
    },
    
    getLeadershipStyle: () => {
      const patterns = state.culturalProfile?.behavioralPatterns
      if (!patterns) return 'unknown'
      
      if (patterns.decisionMaking.consensusImportance > 0.7) {
        return 'consensus_building'
      } else if (patterns.respectDemonstration.hierarchyAwareness > 0.7) {
        return 'hierarchical'
      } else if (patterns.conflictApproach.directnessAcceptance > 0.7) {
        return 'direct_decisive'
      } else {
        return 'collaborative'
      }
    },
    
    getConflictResolutionStyle: () => {
      const conflict = state.culturalProfile?.behavioralPatterns.conflictApproach
      if (!conflict) return 'unknown'
      
      if (conflict.harmonyPreference > 0.7) {
        return 'harmony_focused'
      } else if (conflict.mediationPreference > 0.7) {
        return 'mediation_preferred'
      } else if (conflict.directnessAcceptance > 0.7) {
        return 'direct_confrontation'
      } else {
        return 'avoidance'
      }
    },
    
    getCulturalAdaptationRecommendations: () => {
      const immediate = state.recommendations?.immediate.map(rec => rec.recommendation) || []
      const shortTerm = state.recommendations?.shortTerm.map(rec => rec.recommendation) || []
      const longTerm = state.recommendations?.longTerm.map(rec => rec.recommendation) || []
      
      return {
        immediate,
        shortTerm,
        longTerm,
        all: [...immediate, ...shortTerm, ...longTerm]
      }
    },
    
    getCulturalCompetenceLevel: () => {
      const competence = state.crossCulturalCompetence?.overallCompetence || 0
      
      if (competence > 0.8) return 'expert'
      if (competence > 0.6) return 'proficient'
      if (competence > 0.4) return 'developing'
      if (competence > 0.2) return 'novice'
      return 'beginner'
    },
    
    getCulturalDimensionSummary: () => {
      const dimensions = state.culturalProfile?.culturalDimensions
      if (!dimensions) return {}
      
      return {
        powerDistance: dimensions.hofstedeProfile.powerDistance.score > 0.5 ? 'high' : 'low',
        individualism: dimensions.hofstedeProfile.individualismCollectivism.score > 0.5 ? 'individualistic' : 'collectivistic',
        masculinity: dimensions.hofstedeProfile.masculinityFemininity.score > 0.5 ? 'masculine' : 'feminine',
        uncertaintyAvoidance: dimensions.hofstedeProfile.uncertaintyAvoidance.score > 0.5 ? 'high' : 'low',
        longTermOrientation: dimensions.hofstedeProfile.longTermOrientation.score > 0.5 ? 'long_term' : 'short_term',
        indulgence: dimensions.hofstedeProfile.indulgenceRestraint.score > 0.5 ? 'indulgent' : 'restrained'
      }
    }
  }
}

// Export types for convenience
export type {
  CulturalIntelligenceResult,
  CulturalProfile,
  CulturallyAdaptedAssessment,
  CulturalInsights,
  CrossCulturalCompetence,
  CulturalRecommendations
}
