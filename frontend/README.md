# Frontend - Settlement Platform Dashboard

React + TypeScript + Tailwind CSS + AWS Amplify + Ethers.js

## Features

- **Cognito Authentication**: Sign in with email/password via AWS Cognito
- **Settlement Form**: Submit multi-party settlement transactions
- **Compliance Checks**: Pre-settlement KYC and allowlist validation
- **Transaction Dashboard**: View settlement history and status
- **Real-time Updates**: Integration with backend Lambda functions
- **Responsive UI**: Mobile-friendly Tailwind CSS design

## Environment Variables

Create a `.env.local` file:

```bash
VITE_COGNITO_USER_POOL_ID=your-pool-id
VITE_COGNITO_CLIENT_ID=your-client-id
VITE_AWS_REGION=ap-south-1
VITE_API_ENDPOINT=https://your-api-gateway-url.execute-api.ap-south-1.amazonaws.com/prod
```

## Development

```bash
npm install
npm run dev
```

Runs at `http://localhost:3000`

## Build

```bash
npm run build
```

Output: `dist/`

## Deployment

Frontend can be deployed to:
- AWS S3 + CloudFront
- Vercel
- Netlify
- AWS Amplify Hosting
