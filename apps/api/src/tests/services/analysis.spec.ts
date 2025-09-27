import { describe, it, expect } from 'vitest'

// Import private methods via any-cast for unit testing
import * as InterviewSvc from '../../services/interviewService'
import * as IQSvc from '../../services/intelligentQuestionService'

describe('Rubric scoring', () => {
  const svc: any = InterviewSvc

  it('scores higher when keywords and STAR structure present', () => {
    const res = svc['scoreAnswerWithRubric']({
      question: 'Tell me about a challenging project',
      answer: 'Situation: we had a failing release. Task: fix CI. Action: I implemented caching and parallel tests. Result: 40% faster builds.',
      questionType: 'behavioral',
      expectedKeywords: ['release', 'ci', 'tests']
    })
    expect(res.score).toBeGreaterThan(7)
    expect(res.suggestions.join(' ')).not.toContain('STAR')
  })

  it('suggests STAR when structure is weak', () => {
    const res = svc['scoreAnswerWithRubric']({
      question: 'Tell me about a challenging project',
      answer: 'I fixed some problems and we shipped on time.',
      questionType: 'behavioral',
      expectedKeywords: ['release']
    })
    expect(res.suggestions.join(' ').toLowerCase()).toContain('star')
  })
})

describe('Ideal answer validator', () => {
  const svc: any = IQSvc

  it('sanitizes markdown and control characters', () => {
    const raw = '```json\n{"content":"Great answer\u0007","keyPoints":["a"],"scoringCriteria":{"technical":101,"communication":-1,"structure":80,"relevance":88},"improvementAreas":[]}\n```'
    const parsed = svc['validateIdealAnswer'](raw)
    expect(parsed).toBeTruthy()
    expect(parsed.content).toBe('Great answer ')
    expect(parsed.scoringCriteria.technical).toBeLessThanOrEqual(100)
    expect(parsed.scoringCriteria.communication).toBeGreaterThanOrEqual(0)
  })
})


