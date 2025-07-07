# AI Artifact - Manuscript Diff Analyzer

A production-ready Next.js application for analyzing academic manuscript revisions using multi-agent AI analysis. This tool helps researchers and editors understand changes between manuscript versions and assess alignment with reviewer requests.

## Features

- **Multi-Agent Analysis**: Intelligent diff segmentation and reviewer alignment analysis
- **Secure API Architecture**: Server-side API key handling with secure backend endpoints
- **Production Ready**: Comprehensive error handling, validation, and deployment configurations
- **Academic Focus**: Specialized for academic manuscript analysis with section detection and priority assessment

## Getting Started

### 1. Setup Environment Variables

Copy the `.env.example` file to `.env.local` and configure your environment:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Anthropic API key from [Anthropic Console](https://console.anthropic.com/settings/keys):

```env
# Required: Anthropic API Configuration
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Optional: Application Configuration
NEXT_PUBLIC_USE_CLAUDE_API=true
NEXT_PUBLIC_AGENT_MODE=intelligent
NEXT_PUBLIC_API_TIMEOUT=30000
NEXT_PUBLIC_MAX_RETRIES=3

# Development Configuration
NODE_ENV=development
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Run Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to access the application.

### 4. Health Check

Verify your setup by visiting the health endpoint:
- [http://localhost:3000/api/health](http://localhost:3000/api/health)

## API Endpoints

The application provides secure backend API endpoints for manuscript analysis:

### POST `/api/analyze`
Analyzes manuscript diffs using AI agents.

**Request Body:**
```json
{
  "diffs": [/* DiffItem array */],
  "revisionRequests": "string (optional)",
  "analysisType": "segmentation" | "alignment"
}
```

### POST `/api/analyze-diffs`
Analyzes manuscript diffs for section categorization and priority assessment.

**Request Body:**
```json
{
  "diffs": [
    {
      "id": "diff-1",
      "type": "addition|deletion|modification",
      "text": "The changed text content",
      "confidence": 0.85,
      "originalPos": 10,
      "revisedPos": 15,
      "context": "Surrounding text context"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "analysisId": "claude-seg-123",
      "diffId": "diff-1",
      "section": "Methods",
      "priority": "high",
      "assessment": "positive",
      "comment": "Detailed analysis comment",
      "confidence": 0.85
    }
  ]
}
```

### POST `/api/analyze-alignment`
Analyzes alignment between manuscript changes and reviewer requests.

**Request Body:**
```json
{
  "diffs": [
    {
      "file": "example.py",
      "line": 10,
      "old": "print('Hello')",
      "new": "print('Hello, world!')"
    }
  ],
  "reviewerRequests": "Detailed reviewer feedback and requests"
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "analysisId": "claude-rev-123",
      "diffId": "diff-1",
      "alignmentScore": 85,
      "reviewerPoint": "Specific request addressed",
      "comment": "How this change responds to reviewer concerns"
    }
  ]
}
```

### GET `/api/health`
Returns application health status and service availability.

## Production Deployment

### Environment Variables for Production

Ensure these environment variables are set in your production environment:

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
docker build -t ai-artifact .
docker run -p 3000:3000 --env-file .env.local ai-artifact
```

#### Docker Compose
```bash
# Set ANTHROPIC_API_KEY in your environment
export ANTHROPIC_API_KEY=your_key_here

# Run with docker-compose
docker-compose up --build
```

## Security Features

✅ **Secure API Key Handling**: API keys are handled server-side only, never exposed to the browser  
✅ **Backend API Endpoints**: All AI processing happens server-side  
✅ **Input Validation**: Comprehensive validation of all API inputs  
✅ **Error Handling**: Production-ready error handling with proper HTTP status codes  
✅ **Rate Limiting**: Built-in timeout and retry mechanisms  
✅ **Health Monitoring**: Built-in health check endpoints

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

### Project Structure

```
src/
├── app/
│   ├── api/                 # Backend API endpoints
│   │   ├── analyze/         # Main analysis endpoint
│   │   ├── analyze-diffs/   # Diff analysis endpoint
│   │   ├── analyze-alignment/ # Reviewer alignment endpoint
│   │   └── health/          # Health check endpoint
│   └── page.tsx             # Main application page
├── agents/                  # Multi-agent analysis system
├── components/              # React components
├── services/                # API and utility services
└── types/                   # TypeScript type definitions
```

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

### Testing API Endpoints

Test the endpoints locally:

```bash
# Test diff analysis
curl -X POST http://localhost:3000/api/analyze-diffs \
  -H "Content-Type: application/json" \
  -d '{"diffs": [{"id": "test", "type": "addition", "text": "Sample text"}]}'

# Test reviewer alignment
curl -X POST http://localhost:3000/api/analyze-alignment \
  -H "Content-Type: application/json" \
  -d '{"diffs": [...], "reviewerRequests": "Improve methodology"}'

# Test health endpoint
curl http://localhost:3000/api/health
```

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Anthropic API Documentation](https://docs.anthropic.com/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Academic Writing Guidelines](https://writing.wisc.edu/handbook/)
