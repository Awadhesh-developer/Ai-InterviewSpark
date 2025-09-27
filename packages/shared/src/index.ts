// --- START shared/src/index.ts --- //
// Main export file for AI-InterviewSpark shared package
// Exports all types, utilities, and schemas for use across the application

export * from './types';
export * from './utils';

// Re-export commonly used items for convenience
export { schemas } from './types';
export { utils } from './utils'; 