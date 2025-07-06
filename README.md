# AI Manuscript Diff Analyzer

A production-ready Next.js application for analyzing academic manuscript revisions using multi-agent AI workflow. This tool helps researchers and editors understand changes between manuscript versions and their alignment with reviewer requests.

## Features

- **Multi-Agent Analysis**: Intelligent diff segmentation and reviewer alignment analysis
- **Secure API Architecture**: Backend API endpoints with proper API key handling
- **Academic Focus**: Specialized for manuscript sections (Abstract, Methods, Results, etc.)
- **Production Ready**: Comprehensive error handling, validation, and deployment configs

## Getting Started

### 1. Setup Environment Variables

Copy the `.env.example` file to `.env.local` and configure your environment:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your API key from [Anthropic Console](https://console.anthropic.com/settings/keys):

```env
ANTHROPIC_API_KEY=your_anthropic_api_key_here
NEXT_PUBLIC_USE_CLAUDE_API=true
NEXT_PUBLIC_AGENT_MODE=production
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

### 4. Health Check

Verify your setup by visiting the health endpoint:
- [http://localhost:3000/api/health](http://localhost:3000/api/health)

## API Endpoints

### POST /api/analyze
Analyzes manuscript diffs using AI agents.

**Request Body:**
```json
{
  "diffs": [/* DiffItem array */],
  "revisionRequests": "string (optional)",
  "analysisType": "segmentation" | "alignment"
}
```

### GET /api/health
Returns application health status and service availability.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Production Deployment

### Environment Variables

Required environment variables for production:

```env
# Required
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Application Configuration
NEXT_PUBLIC_USE_CLAUDE_API=true
NEXT_PUBLIC_AGENT_MODE=production
NEXT_PUBLIC_API_TIMEOUT=30000
NEXT_PUBLIC_MAX_RETRIES=3
NEXT_PUBLIC_ALLOW_BROWSER=false

# Production Environment
NODE_ENV=production
```

### Deployment Options

#### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push

#### Docker
```bash
# Build and run with Docker
docker build -t manuscript-analyzer .
docker run -p 3000:3000 --env-file .env.local manuscript-analyzer
```

#### Docker Compose
```bash
# Run with docker-compose
docker-compose up --build
```

### Security Features

✅ **Secure API Architecture**: API keys are never exposed to the client-side  
✅ **Backend API Endpoints**: All AI processing happens server-side  
✅ **Input Validation**: Comprehensive request validation and sanitization  
✅ **Error Handling**: Production-ready error handling and logging  
✅ **Health Monitoring**: Built-in health check endpoints

## Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run format       # Format code with Prettier
npm run type-check   # Run TypeScript type checking
npm run test         # Run Jest tests
npm run test:e2e     # Run Playwright E2E tests
```

### Testing

The application includes comprehensive testing:

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:coverage
```

### Code Quality

Pre-commit hooks ensure code quality:
- ESLint for code linting
- Prettier for code formatting
- TypeScript type checking
- Husky for git hooks

## Architecture

### Multi-Agent System
- **DiffSegmentationAgent**: Categorizes changes by manuscript section
- **ReviewerAlignmentAgent**: Analyzes alignment with reviewer requests
- **AnalysisOrchestrator**: Coordinates agent execution

### Security Architecture
- API keys stored server-side only
- Secure API endpoints for AI processing
- Input validation and sanitization
- Comprehensive error handling

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Anthropic API Documentation](https://docs.anthropic.com/)
- [Academic Writing Guidelines](https://writing.wisc.edu/handbook/)
