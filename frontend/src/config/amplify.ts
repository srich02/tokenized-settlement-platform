import { Amplify } from 'aws-amplify';
import type { ResourcesConfig } from 'aws-amplify';

// Configure AWS Amplify with Cognito credentials
// These values should come from CDK outputs or environment variables
export const configureAmplify = (config: {
  userPoolId: string;
  userPoolWebClientId: string;
  region: string;
  apiEndpoint: string;
}) => {
  const amplifyConfig: ResourcesConfig = {
    Auth: {
      Cognito: {
        userPoolId: config.userPoolId,
        userPoolClientId: config.userPoolWebClientId,
      },
    },
  };

  Amplify.configure(amplifyConfig);
};

// Initialize Amplify on app startup
export const initializeAmplify = async () => {
  // Load config from environment or localStorage
  const config = {
    userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || localStorage.getItem('userPoolId') || '',
    userPoolWebClientId: import.meta.env.VITE_COGNITO_CLIENT_ID || localStorage.getItem('userPoolClientId') || '',
    region: import.meta.env.VITE_AWS_REGION || 'ap-south-1',
    apiEndpoint: import.meta.env.VITE_API_ENDPOINT || 'http://localhost:3001',
  };

  configureAmplify(config);
};
