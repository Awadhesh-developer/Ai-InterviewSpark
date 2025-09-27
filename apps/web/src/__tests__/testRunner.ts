/**
 * Comprehensive Test Runner for Enhanced Question Generation
 * Orchestrates unit, integration, e2e, and performance tests
 */

import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

interface TestSuite {
  name: string
  pattern: string
  timeout: number
  description: string
  required: boolean
}

interface TestResult {
  suite: string
  passed: boolean
  duration: number
  coverage?: number
  errors: string[]
  warnings: string[]
}

interface TestReport {
  timestamp: string
  environment: string
  totalSuites: number
  passedSuites: number
  failedSuites: number
  totalDuration: number
  overallCoverage: number
  results: TestResult[]
  summary: string
}

class EnhancedTestRunner {
  private testSuites: TestSuite[] = [
    {
      name: 'Unit Tests',
      pattern: 'src/__tests__/services/**/*.test.ts',
      timeout: 30000,
      description: 'Tests individual service components',
      required: true
    },
    {
      name: 'Integration Tests',
      pattern: 'src/__tests__/integration/**/*.integration.test.ts',
      timeout: 60000,
      description: 'Tests LLM provider integrations',
      required: false // Optional if no API keys
    },
    {
      name: 'End-to-End Tests',
      pattern: 'src/__tests__/e2e/**/*.e2e.test.ts',
      timeout: 120000,
      description: 'Tests complete question generation flow',
      required: true
    },
    {
      name: 'Performance Tests',
      pattern: 'src/__tests__/performance/**/*.perf.test.ts',
      timeout: 300000,
      description: 'Tests performance and load handling',
      required: false // Optional for CI
    }
  ]

  private results: TestResult[] = []

  async runAllTests(options: {
    includeIntegration?: boolean
    includePerformance?: boolean
    generateReport?: boolean
    coverage?: boolean
  } = {}): Promise<TestReport> {
    console.log('🧪 Starting Enhanced Question Generation Test Suite')
    console.log('================================================')
    
    const startTime = Date.now()
    
    // Check environment and prerequisites
    await this.checkPrerequisites()
    
    // Run test suites
    for (const suite of this.testSuites) {
      if (!this.shouldRunSuite(suite, options)) {
        console.log(`⏭️  Skipping ${suite.name} (${this.getSkipReason(suite, options)})`)
        continue
      }
      
      console.log(`\n🔄 Running ${suite.name}...`)
      console.log(`   ${suite.description}`)
      
      const result = await this.runTestSuite(suite, options.coverage)
      this.results.push(result)
      
      if (result.passed) {
        console.log(`✅ ${suite.name} passed (${result.duration}ms)`)
        if (result.coverage) {
          console.log(`   Coverage: ${result.coverage.toFixed(1)}%`)
        }
      } else {
        console.log(`❌ ${suite.name} failed (${result.duration}ms)`)
        result.errors.forEach(error => console.log(`   Error: ${error}`))
        
        if (suite.required) {
          console.log(`🛑 Required test suite failed, stopping execution`)
          break
        }
      }
    }
    
    const endTime = Date.now()
    const totalDuration = endTime - startTime
    
    // Generate report
    const report = this.generateReport(totalDuration)
    
    if (options.generateReport) {
      await this.saveReport(report)
    }
    
    this.printSummary(report)
    
    return report
  }

  private async checkPrerequisites(): Promise<void> {
    console.log('🔍 Checking prerequisites...')
    
    // Check if Jest is available
    try {
      execSync('npx jest --version', { stdio: 'pipe' })
      console.log('   ✅ Jest is available')
    } catch (error) {
      throw new Error('Jest is not available. Please install Jest.')
    }
    
    // Check environment variables
    const hasLLMKeys = !!(
      process.env.NEXT_PUBLIC_OPENAI_API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
      process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY
    )
    
    if (hasLLMKeys) {
      console.log('   ✅ LLM API keys detected')
    } else {
      console.log('   ⚠️  No LLM API keys detected (integration tests will be skipped)')
    }
    
    // Check test files exist
    const testDirs = [
      'src/__tests__/services',
      'src/__tests__/integration',
      'src/__tests__/e2e',
      'src/__tests__/performance'
    ]
    
    testDirs.forEach(dir => {
      if (fs.existsSync(dir)) {
        console.log(`   ✅ ${dir} exists`)
      } else {
        console.log(`   ⚠️  ${dir} not found`)
      }
    })
  }

  private shouldRunSuite(suite: TestSuite, options: any): boolean {
    if (suite.name === 'Integration Tests' && !options.includeIntegration) {
      return false
    }
    
    if (suite.name === 'Performance Tests' && !options.includePerformance) {
      return false
    }
    
    // Check if test files exist
    const testFiles = this.getTestFiles(suite.pattern)
    return testFiles.length > 0
  }

  private getSkipReason(suite: TestSuite, options: any): string {
    if (suite.name === 'Integration Tests' && !options.includeIntegration) {
      return 'integration tests disabled'
    }
    
    if (suite.name === 'Performance Tests' && !options.includePerformance) {
      return 'performance tests disabled'
    }
    
    const testFiles = this.getTestFiles(suite.pattern)
    if (testFiles.length === 0) {
      return 'no test files found'
    }
    
    return 'unknown reason'
  }

  private getTestFiles(pattern: string): string[] {
    try {
      const output = execSync(`find ${pattern.replace('**/*', '.')} -name "*.test.ts" -o -name "*.integration.test.ts" -o -name "*.e2e.test.ts" -o -name "*.perf.test.ts" 2>/dev/null || true`, {
        encoding: 'utf8',
        stdio: 'pipe'
      })
      
      return output.trim().split('\n').filter(file => file.length > 0)
    } catch (error) {
      return []
    }
  }

  private async runTestSuite(suite: TestSuite, coverage: boolean = false): Promise<TestResult> {
    const startTime = Date.now()
    const errors: string[] = []
    const warnings: string[] = []
    
    try {
      let command = `npx jest "${suite.pattern}" --testTimeout=${suite.timeout}`
      
      if (coverage) {
        command += ' --coverage --coverageReporters=json-summary'
      }
      
      const output = execSync(command, {
        encoding: 'utf8',
        stdio: 'pipe'
      })
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      // Parse coverage if available
      let coveragePercent: number | undefined
      if (coverage) {
        coveragePercent = this.parseCoverage()
      }
      
      return {
        suite: suite.name,
        passed: true,
        duration,
        coverage: coveragePercent,
        errors,
        warnings
      }
    } catch (error) {
      const endTime = Date.now()
      const duration = endTime - startTime
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      errors.push(errorMessage)
      
      return {
        suite: suite.name,
        passed: false,
        duration,
        errors,
        warnings
      }
    }
  }

  private parseCoverage(): number | undefined {
    try {
      const coveragePath = path.join(process.cwd(), 'coverage', 'coverage-summary.json')
      if (fs.existsSync(coveragePath)) {
        const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'))
        return coverage.total.lines.pct
      }
    } catch (error) {
      console.warn('Could not parse coverage data')
    }
    return undefined
  }

  private generateReport(totalDuration: number): TestReport {
    const passedSuites = this.results.filter(r => r.passed).length
    const failedSuites = this.results.filter(r => !r.passed).length
    
    const coverageResults = this.results
      .map(r => r.coverage)
      .filter(c => c !== undefined) as number[]
    
    const overallCoverage = coverageResults.length > 0
      ? coverageResults.reduce((a, b) => a + b) / coverageResults.length
      : 0
    
    let summary = `${passedSuites}/${this.results.length} test suites passed`
    if (failedSuites > 0) {
      summary += `, ${failedSuites} failed`
    }
    if (overallCoverage > 0) {
      summary += `, ${overallCoverage.toFixed(1)}% coverage`
    }
    
    return {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      totalSuites: this.results.length,
      passedSuites,
      failedSuites,
      totalDuration,
      overallCoverage,
      results: this.results,
      summary
    }
  }

  private async saveReport(report: TestReport): Promise<void> {
    const reportsDir = path.join(process.cwd(), 'test-reports')
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true })
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const reportPath = path.join(reportsDir, `test-report-${timestamp}.json`)
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
    console.log(`📄 Test report saved to: ${reportPath}`)
    
    // Also save as latest
    const latestPath = path.join(reportsDir, 'latest-test-report.json')
    fs.writeFileSync(latestPath, JSON.stringify(report, null, 2))
  }

  private printSummary(report: TestReport): void {
    console.log('\n📊 Test Summary')
    console.log('===============')
    console.log(`Total Duration: ${report.totalDuration}ms`)
    console.log(`Test Suites: ${report.passedSuites}/${report.totalSuites} passed`)
    
    if (report.overallCoverage > 0) {
      console.log(`Coverage: ${report.overallCoverage.toFixed(1)}%`)
    }
    
    console.log(`\n${report.summary}`)
    
    if (report.failedSuites > 0) {
      console.log('\n❌ Failed Suites:')
      report.results
        .filter(r => !r.passed)
        .forEach(result => {
          console.log(`   ${result.suite}: ${result.errors.join(', ')}`)
        })
    }
    
    console.log('\n💡 Next Steps:')
    if (report.failedSuites === 0) {
      console.log('   ✅ All tests passed! Ready for deployment.')
    } else {
      console.log('   🔧 Fix failing tests before deployment.')
    }
    
    if (report.overallCoverage < 80) {
      console.log('   📈 Consider adding more tests to improve coverage.')
    }
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2)
  const options = {
    includeIntegration: args.includes('--integration'),
    includePerformance: args.includes('--performance'),
    generateReport: args.includes('--report'),
    coverage: args.includes('--coverage')
  }
  
  const runner = new EnhancedTestRunner()
  
  runner.runAllTests(options)
    .then(report => {
      process.exit(report.failedSuites > 0 ? 1 : 0)
    })
    .catch(error => {
      console.error('Test runner failed:', error)
      process.exit(1)
    })
}

export { EnhancedTestRunner }
