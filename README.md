This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### 1. Setup Environment Variables

Copy the `.env.example` file to `.env.local` and add your Anthropic API key:

```bash
cp .env.example .env.local
```

Then edit `.env.local` and add your API key from [Anthropic Console](https://console.anthropic.com/settings/keys).

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

### 3. Run Development Server

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Production Setup

✅ **Security**: This application now includes secure backend API endpoints that handle Anthropic API calls server-side, eliminating client-side API key exposure.

### Environment Configuration

1. **Copy environment template:**
   ```bash
   cp .env.example .env.local
   ```

2. **Add your Anthropic API key to `.env.local`:**
   ```bash
   ANTHROPIC_API_KEY=your_anthropic_api_key_here
   NEXT_PUBLIC_ALLOW_BROWSER=false
   NEXT_PUBLIC_MAX_RETRIES=3
   NEXT_PUBLIC_API_TIMEOUT=30000
   ```

### Deployment Options

#### Vercel Deployment
1. Connect your repository to Vercel
2. Add environment variables in Vercel dashboard:
   - `ANTHROPIC_API_KEY`: Your Anthropic API key
3. Deploy automatically on push to main branch

#### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up --build

# Or build and run manually
docker build -t ai-artifact .
docker run -p 3000:3000 --env-file .env.local ai-artifact
```

#### Manual Production Build
```bash
npm run build
npm start
```

### Security Features
- ✅ Server-side API key handling
- ✅ No client-side API key exposure
- ✅ Secure backend endpoints (`/api/claude/*`)
- ✅ Environment-based configuration
- ✅ Production-ready error handling

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
