# InterviewSpark Testing Guide

Comprehensive testing strategy for the enhanced question generation system.

## Testing Overview

Our testing strategy covers four main areas:

1. **Unit Tests** - Individual service components
2. **Integration Tests** - LLM provider integrations
3. **End-to-End Tests** - Complete question generation flow
4. **Performance Tests** - Load testing and benchmarks

## Quick Start

### Run All Tests

```bash
# Frontend tests
cd apps/web
npm run test:enhanced

# Backend tests
cd apps/api
npm run test:enhanced

# Full test suite with integration and performance
npm run test:enhanced:full
```

### Run Specific Test Types

```bash
# Unit tests only
npm run test:unit

# Integration tests (requires API keys)
npm run test:integration

# End-to-end tests
npm run test:e2e

# Performance tests
npm run test:performance
```

## Test Structure

### Frontend Tests (`apps/web/src/__tests__/`)

```
__tests__/
├── services/                    # Unit tests
│   ├── llmProviders.test.ts
│   ├── webScrapingIntelligenceService.test.ts
│   ├── realisticAnswerGenerationService.test.ts
│   └── aiInterviewService.test.ts
├── integration/                 # Integration tests
│   └── llmProviders.integration.test.ts
├── e2e/                        # End-to-end tests
│   └── questionGeneration.e2e.test.ts
├── performance/                # Performance tests
│   └── questionGeneration.perf.test.ts
└── testRunner.ts               # Test orchestration
```

### Backend Tests (`apps/api/src/tests/`)

```
tests/
├── services/                   # API service tests
│   └── enhancedQuestionGeneration.test.ts
├── integration/               # Database integration tests
└── api/                      # API endpoint tests
```

## Unit Tests

### LLM Providers Configuration

Tests the configuration management and provider selection logic.

```bash
npm run test -- llmProviders.test.ts
```

**Coverage:**
- Configuration loading and validation
- Provider selection algorithms
- Error handling and fallbacks
- Environment variable processing

### Web Scraping Intelligence Service

Tests the web scraping functionality and data processing.

```bash
npm run test -- webScrapingIntelligenceService.test.ts
```

**Coverage:**
- Industry trends scraping
- Company insights gathering
- Rate limiting and caching
- GDPR compliance features

### Realistic Answer Generation Service

Tests the STAR framework and answer generation.

```bash
npm run test -- realisticAnswerGenerationService.test.ts
```

**Coverage:**
- STAR framework generation
- Template selection
- Industry context integration
- Experience level adaptation

### AI Interview Service

Tests the main service orchestration.

```bash
npm run test -- aiInterviewService.test.ts
```

**Coverage:**
- Service integration
- Question generation flow
- Error handling and fallbacks
- Context building

## Integration Tests

### LLM Provider Integration

Tests actual API integration with OpenAI, Gemini, and Claude.

```bash
# Requires API keys in environment
npm run test:integration
```

**Prerequisites:**
- Valid API keys for at least one provider
- Network connectivity
- API rate limits consideration

**Coverage:**
- API connectivity and authentication
- Response format validation
- Rate limiting handling
- Error response handling

**Environment Variables:**
```bash
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_key
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_key
NEXT_PUBLIC_ANTHROPIC_API_KEY=your_claude_key
```

## End-to-End Tests

### Complete Question Generation Flow

Tests the entire process from request to enhanced response.

```bash
npm run test:e2e
```

**Test Scenarios:**
- Software Engineer at Tech Company
- Product Manager at Startup
- Financial Analyst at Bank

**Coverage:**
- Complete generation workflow
- Configuration integration
- Data quality validation
- Performance requirements

## Performance Tests

### Load Testing and Benchmarks

Tests system performance under various load conditions.

```bash
npm run test:performance
```

**Test Categories:**

#### Response Time Benchmarks
- Single request performance
- Scaling with question count
- Complexity level impact

#### Load Testing
- Moderate concurrent load (5 users)
- High concurrent load (10 users)
- Quality maintenance under load

#### Resource Usage
- Memory leak detection
- CPU utilization
- Network efficiency

**Performance Targets:**
- Average response time: < 10 seconds
- Maximum response time: < 20 seconds
- Success rate under load: > 80%
- Memory growth: < 50% over baseline

## Test Configuration

### Jest Configuration (`apps/web/jest.config.js`)

```javascript
module.exports = {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
}
```

### Vitest Configuration (`apps/api/vitest.config.ts`)

```typescript
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/tests/setup.ts'],
    include: ['src/tests/**/*.test.ts'],
    testTimeout: 10000,
  },
})
```

## Test Data and Mocking

### Mock Data

Tests use realistic mock data that mirrors production scenarios:

- Company insights for major tech companies
- Industry trends for technology, finance, healthcare
- Sample questions across all difficulty levels
- STAR framework examples

### API Mocking

Integration tests can run in two modes:

1. **Mock Mode** - Uses mock responses (default)
2. **Live Mode** - Uses real API calls (with API keys)

```bash
# Mock mode (default)
npm run test:integration

# Live mode (requires API keys)
LIVE_API_TESTS=true npm run test:integration
```

## Continuous Integration

### GitHub Actions Workflow

```yaml
name: Enhanced Testing
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:unit
      
      - name: Run integration tests
        run: npm run test:integration
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
      
      - name: Run e2e tests
        run: npm run test:e2e
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

### Pre-commit Hooks

```bash
# Install husky for pre-commit hooks
npm install --save-dev husky

# Add pre-commit hook
npx husky add .husky/pre-commit "npm run test:unit"
```

## Test Reports

### Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# View coverage report
open coverage/lcov-report/index.html
```

### Performance Reports

```bash
# Generate performance report
npm run test:performance -- --report

# View performance report
open test-reports/latest-test-report.json
```

## Troubleshooting

### Common Issues

#### 1. Integration Tests Failing
```bash
# Check API keys
npm run validate-config

# Test individual providers
npm run test -- --testNamePattern="OpenAI"
```

#### 2. Performance Tests Timing Out
```bash
# Increase timeout
npm run test:performance -- --testTimeout=600000

# Run with fewer concurrent users
CONCURRENT_USERS=3 npm run test:performance
```

#### 3. Memory Issues in Performance Tests
```bash
# Run with increased memory
node --max-old-space-size=4096 npm run test:performance

# Enable garbage collection
node --expose-gc npm run test:performance
```

### Debug Mode

```bash
# Run tests with debug output
DEBUG=true npm run test:enhanced

# Run specific test with verbose output
npm run test -- --verbose llmProviders.test.ts
```

## Best Practices

### Writing Tests

1. **Use descriptive test names**
   ```typescript
   it('should generate questions with enhanced metadata for software engineer role', async () => {
   ```

2. **Test edge cases**
   ```typescript
   it('should handle empty API responses gracefully', async () => {
   ```

3. **Mock external dependencies**
   ```typescript
   jest.mock('@/services/webScrapingIntelligenceService')
   ```

4. **Use realistic test data**
   ```typescript
   const mockQuestion = {
     question: 'Tell me about a challenging project you worked on.',
     type: 'behavioral',
     difficulty: 'medium'
   }
   ```

### Performance Testing

1. **Set realistic performance targets**
2. **Test under various load conditions**
3. **Monitor resource usage**
4. **Use consistent test environments**

### Maintenance

1. **Update tests when features change**
2. **Review test coverage regularly**
3. **Clean up test data after tests**
4. **Keep mock data current**

## Next Steps

1. **Run the test suite**: `npm run test:enhanced`
2. **Check coverage**: `npm run test:coverage`
3. **Review performance**: `npm run test:performance`
4. **Set up CI/CD**: Configure GitHub Actions
5. **Monitor in production**: Set up performance monitoring

For deployment testing, see [DEPLOYMENT.md](./DEPLOYMENT.md).
