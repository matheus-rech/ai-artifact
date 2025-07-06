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

## Production Considerations

This application uses a secure backend API endpoint to handle Anthropic API calls. For production deployment:

1. Set up your environment variables on your hosting platform (Vercel, etc.)
2. Ensure `ANTHROPIC_API_KEY` is set as a server-side environment variable
3. Configure client-side environment variables as needed (`NEXT_PUBLIC_*`)
4. Deploy using the instructions below

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Production Deployment Guide

### Vercel Deployment

1. Fork or clone this repository
2. Connect your GitHub repository to Vercel
3. Configure the following environment variables in Vercel:
   - `ANTHROPIC_API_KEY`: Your Anthropic API key (kept secret on the server)
   - `API_TIMEOUT`: Timeout for API requests in milliseconds (e.g., 30000)
   - `MAX_RETRIES`: Number of retries for failed API requests (e.g., 3)
   - `NEXT_PUBLIC_USE_CLAUDE_API`: Whether to use Claude API (true/false)
   - `NEXT_PUBLIC_AGENT_MODE`: Agent mode (production/heuristic/mixed)
   - `NEXT_PUBLIC_API_TIMEOUT`: Client-side timeout setting
   - `NEXT_PUBLIC_MAX_RETRIES`: Client-side retry setting
4. Deploy the application

### Docker Deployment

A Dockerfile is not included in this repository. If you need to deploy using Docker:

1. Create a Dockerfile in the root directory
2. Build and run the Docker container with environment variables
3. Expose the appropriate port (default: 3000)

For more detailed deployment options, refer to the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying).
