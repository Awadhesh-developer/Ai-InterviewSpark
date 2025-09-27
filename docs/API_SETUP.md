# API Setup Instructions

The application has been updated to use secure server-side API calls instead of exposing API keys in the frontend.

## Required API Keys

To fix the current API errors, you need to set up the following API keys in your `.env` file:

### 1. OpenAI API Key
```bash
OPENAI_API_KEY=sk-your-actual-openai-api-key-here
```
- Get your key from: https://platform.openai.com/api-keys
- Replace `your_openai_api_key_here` in `apps/web/.env`

### 2. Google Gemini API Key
```bash
GEMINI_API_KEY=your-actual-gemini-api-key-here
```
- Get your key from: https://makersuite.google.com/app/apikey
- Replace the existing key in `apps/web/.env` (current one appears to be invalid)

### 3. Anthropic Claude API Key
```bash
ANTHROPIC_API_KEY=sk-ant-your-actual-claude-api-key-here
```
- Get your key from: https://console.anthropic.com/
- Replace `your_anthropic_api_key_here` in `apps/web/.env`

## What Was Fixed

1. **CORS Issues**: Created a secure backend API route (`/api/interview/generate`) that handles all AI provider calls server-side
2. **Security**: Removed `NEXT_PUBLIC_` prefixes from API keys to prevent exposure in the browser
3. **Fallback System**: Added proper error handling and fallback questions when API calls fail
4. **Provider Selection**: The system now tries multiple providers automatically if one fails

## Testing

After setting up your API keys:

1. Restart your development server
2. Try creating a new interview
3. The system should now work without CORS errors
4. Check the console for any remaining API key issues

## Troubleshooting

If you're still seeing errors:
- Make sure your API keys are valid and have sufficient credits
- Check that there are no extra spaces or quotes around the keys in the .env file
- Restart the development server after changing environment variables