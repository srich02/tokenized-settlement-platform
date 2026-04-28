import axios, { AxiosInstance } from 'axios';
import { fetchAuthSession } from 'aws-amplify/auth';

class APIClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_ENDPOINT || 'http://localhost:3001',
      timeout: 10000,
    });

    // Add request interceptor to include Cognito token
    this.client.interceptors.request.use(async (config) => {
      try {
        const session = await fetchAuthSession();
        if (session.tokens?.idToken) {
          config.headers.Authorization = `Bearer ${session.tokens.idToken.toString()}`;
        }
      } catch (error) {
        console.log('No auth token available');
      }
      return config;
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response.data,
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized
          console.error('Unauthorized - redirecting to login');
        }
        throw error.response?.data || error;
      }
    );
  }

  get(url: string, config?: any) {
    return this.client.get(url, config);
  }

  post(url: string, data?: any, config?: any) {
    return this.client.post(url, data, config);
  }

  put(url: string, data?: any, config?: any) {
    return this.client.put(url, data, config);
  }

  delete(url: string, config?: any) {
    return this.client.delete(url, config);
  }
}

export const api = new APIClient();
