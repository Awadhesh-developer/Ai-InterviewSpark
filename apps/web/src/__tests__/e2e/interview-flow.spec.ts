import { test, expect, Page } from '@playwright/test'

// Test configuration
test.describe('Interview Flow E2E Tests', () => {
  let page: Page

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage()
    
    // Mock authentication
    await page.goto('/dashboard')
    
    // Wait for page to load
    await page.waitForLoadState('networkidle')
  })

  test.afterEach(async () => {
    await page.close()
  })

  test('complete interview creation and practice flow', async () => {
    // Navigate to create interview
    await page.click('text=Start New Interview')
    await expect(page).toHaveURL('/dashboard/interviews/new')

    // Step 1: Basic Information
    await page.fill('[data-testid="interview-title"]', 'Software Engineer Interview Practice')
    await page.fill('[data-testid="job-title"]', 'Senior Software Engineer')
    await page.fill('[data-testid="company"]', 'Google')
    await page.click('[data-testid="industry-technology"]')
    await page.click('text=Next')

    // Step 2: Interview Type & Settings
    await page.click('[data-testid="interview-type-video"]')
    await page.selectOption('[data-testid="duration"]', '30')
    await page.selectOption('[data-testid="difficulty"]', 'medium')
    await page.click('text=Next')

    // Step 3: Question Configuration
    await page.click('[data-testid="question-type-technical"]')
    await page.click('[data-testid="question-type-behavioral"]')
    await page.fill('[data-testid="job-description"]', 'Looking for a senior software engineer with experience in React and Node.js')
    await page.click('text=Next')

    // Step 4: Review & Create
    await expect(page.locator('text=Interview Summary')).toBeVisible()
    await expect(page.locator('text=Software Engineer Interview Practice')).toBeVisible()
    await expect(page.locator('text=Senior Software Engineer')).toBeVisible()
    
    await page.click('text=Start Interview')

    // Should navigate to practice page
    await expect(page).toHaveURL('/dashboard/interviews/practice')
  })

  test('practice interview session with video recording', async () => {
    // Navigate directly to practice page (assuming interview is set up)
    await page.goto('/dashboard/interviews/practice')
    
    // Wait for camera permissions (mock)
    await page.evaluate(() => {
      // Mock getUserMedia
      Object.defineProperty(navigator, 'mediaDevices', {
        value: {
          getUserMedia: () => Promise.resolve({
            getTracks: () => [{ stop: () => {} }]
          })
        }
      })
    })

    // Start interview
    await page.click('[data-testid="start-interview"]')
    
    // Wait for first question to appear
    await expect(page.locator('[data-testid="current-question"]')).toBeVisible()
    
    // Start recording
    await page.click('[data-testid="start-recording"]')
    await expect(page.locator('[data-testid="recording-indicator"]')).toBeVisible()
    
    // Wait a moment to simulate answering
    await page.waitForTimeout(3000)
    
    // Stop recording
    await page.click('[data-testid="stop-recording"]')
    
    // Submit answer
    await page.click('[data-testid="submit-answer"]')
    
    // Wait for AI feedback
    await expect(page.locator('[data-testid="ai-feedback"]')).toBeVisible()
    
    // Check feedback content
    await expect(page.locator('text=Score:')).toBeVisible()
    await expect(page.locator('text=Strengths:')).toBeVisible()
    await expect(page.locator('text=Improvements:')).toBeVisible()
    
    // Continue to next question or finish
    const nextButton = page.locator('[data-testid="next-question"]')
    const finishButton = page.locator('[data-testid="finish-interview"]')
    
    if (await nextButton.isVisible()) {
      await nextButton.click()
    } else if (await finishButton.isVisible()) {
      await finishButton.click()
      
      // Should navigate to results page
      await expect(page).toHaveURL(/\/dashboard\/interviews\/results/)
    }
  })

  test('view interview results and analytics', async () => {
    // Navigate to results page (assuming interview is completed)
    await page.goto('/dashboard/interviews/results/session-123')
    
    // Check overall score
    await expect(page.locator('[data-testid="overall-score"]')).toBeVisible()
    
    // Check category scores
    await expect(page.locator('[data-testid="technical-score"]')).toBeVisible()
    await expect(page.locator('[data-testid="behavioral-score"]')).toBeVisible()
    await expect(page.locator('[data-testid="communication-score"]')).toBeVisible()
    
    // Check detailed feedback
    await expect(page.locator('[data-testid="detailed-feedback"]')).toBeVisible()
    
    // Check recommendations
    await expect(page.locator('[data-testid="recommendations"]')).toBeVisible()
    
    // Test export functionality
    await page.click('[data-testid="export-results"]')
    
    // Test sharing functionality
    await page.click('[data-testid="share-results"]')
    
    // Navigate to analytics
    await page.click('text=View Analytics')
    await expect(page).toHaveURL('/dashboard/analytics')
  })

  test('analytics dashboard functionality', async () => {
    await page.goto('/dashboard/analytics')
    
    // Check main metrics
    await expect(page.locator('[data-testid="average-score"]')).toBeVisible()
    await expect(page.locator('[data-testid="total-sessions"]')).toBeVisible()
    await expect(page.locator('[data-testid="time-practiced"]')).toBeVisible()
    await expect(page.locator('[data-testid="industry-rank"]')).toBeVisible()
    
    // Test time range filter
    await page.selectOption('[data-testid="time-range"]', '7d')
    await page.waitForTimeout(1000) // Wait for data to update
    
    await page.selectOption('[data-testid="time-range"]', '30d')
    await page.waitForTimeout(1000)
    
    // Test tab navigation
    await page.click('text=Performance')
    await expect(page.locator('[data-testid="performance-charts"]')).toBeVisible()
    
    await page.click('text=AI Insights')
    await expect(page.locator('[data-testid="ai-insights"]')).toBeVisible()
    
    await page.click('text=Benchmarks')
    await expect(page.locator('[data-testid="benchmark-comparison"]')).toBeVisible()
    
    await page.click('text=Goals')
    await expect(page.locator('[data-testid="goals-tracker"]')).toBeVisible()
    
    // Test export functionality
    await page.click('[data-testid="export-analytics"]')
  })

  test('resume upload and analysis', async () => {
    await page.goto('/dashboard/resume')
    
    // Upload resume file
    const fileInput = page.locator('[data-testid="resume-upload"]')
    await fileInput.setInputFiles('test-files/sample-resume.pdf')
    
    // Wait for upload to complete
    await expect(page.locator('[data-testid="upload-success"]')).toBeVisible()
    
    // Start analysis
    await page.click('[data-testid="analyze-resume"]')
    
    // Wait for analysis to complete
    await expect(page.locator('[data-testid="analysis-results"]')).toBeVisible()
    
    // Check ATS score
    await expect(page.locator('[data-testid="ats-score"]')).toBeVisible()
    
    // Check keywords
    await expect(page.locator('[data-testid="keywords"]')).toBeVisible()
    
    // Check suggestions
    await expect(page.locator('[data-testid="suggestions"]')).toBeVisible()
    
    // Test optimization
    await page.click('[data-testid="optimize-resume"]')
    await expect(page.locator('[data-testid="optimization-suggestions"]')).toBeVisible()
  })

  test('expert booking flow', async () => {
    await page.goto('/dashboard/experts')
    
    // Search for experts
    await page.fill('[data-testid="expert-search"]', 'software engineer')
    await page.click('[data-testid="search-button"]')
    
    // Filter by expertise
    await page.selectOption('[data-testid="expertise-filter"]', 'System Design')
    
    // Filter by price range
    await page.selectOption('[data-testid="price-filter"]', '100-150')
    
    // View expert profile
    await page.click('[data-testid="expert-card"]:first-child')
    await expect(page).toHaveURL(/\/dashboard\/experts\/expert-/)
    
    // Check expert details
    await expect(page.locator('[data-testid="expert-name"]')).toBeVisible()
    await expect(page.locator('[data-testid="expert-rating"]')).toBeVisible()
    await expect(page.locator('[data-testid="expert-experience"]')).toBeVisible()
    
    // Book session
    await page.click('[data-testid="book-session"]')
    
    // Fill booking form
    await page.selectOption('[data-testid="session-type"]', 'video')
    await page.selectOption('[data-testid="session-duration"]', '60')
    await page.fill('[data-testid="session-topic"]', 'System design interview preparation')
    
    // Select date and time
    await page.click('[data-testid="date-picker"]')
    await page.click('[data-testid="available-slot"]:first-child')
    
    // Confirm booking
    await page.click('[data-testid="confirm-booking"]')
    
    // Check confirmation
    await expect(page.locator('[data-testid="booking-confirmation"]')).toBeVisible()
  })

  test('accessibility features', async () => {
    await page.goto('/dashboard')
    
    // Test keyboard navigation
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Enter')
    
    // Test high contrast mode
    await page.goto('/dashboard/settings')
    await page.click('[data-testid="accessibility-settings"]')
    await page.check('[data-testid="high-contrast"]')
    
    // Verify high contrast is applied
    await expect(page.locator('html')).toHaveClass(/high-contrast/)
    
    // Test large text
    await page.check('[data-testid="large-text"]')
    await expect(page.locator('html')).toHaveClass(/large-text/)
    
    // Test reduced motion
    await page.check('[data-testid="reduced-motion"]')
    await expect(page.locator('html')).toHaveClass(/reduced-motion/)
  })

  test('mobile responsiveness', async () => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    await page.goto('/dashboard')
    
    // Check mobile navigation
    await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible()
    await page.click('[data-testid="mobile-menu-button"]')
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible()
    
    // Test mobile interview flow
    await page.click('text=Start New Interview')
    
    // Check mobile-optimized forms
    await expect(page.locator('[data-testid="mobile-form"]')).toBeVisible()
    
    // Test mobile video recording
    await page.goto('/dashboard/interviews/practice')
    await expect(page.locator('[data-testid="mobile-video-controls"]')).toBeVisible()
  })

  test('offline functionality', async () => {
    await page.goto('/dashboard')
    
    // Go offline
    await page.context().setOffline(true)
    
    // Try to navigate
    await page.click('text=Analytics')
    
    // Should show offline message or cached content
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible()
    
    // Go back online
    await page.context().setOffline(false)
    
    // Should sync data
    await page.waitForTimeout(2000)
    await expect(page.locator('[data-testid="sync-indicator"]')).toBeVisible()
  })
})
