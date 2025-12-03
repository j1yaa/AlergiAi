// Network request logger to monitor Firebase API calls
export const logNetworkRequest = (url: string, method: string, data?: any) => {
  console.log(`🌐 ${method} ${url}`);
  if (data) {
    console.log('📤 Request data:', JSON.stringify(data, null, 2));
  }
};

export const logNetworkResponse = (url: string, status: number, data?: any) => {
  console.log(`🌐 Response ${status} from ${url}`);
  if (data) {
    console.log('📥 Response data:', JSON.stringify(data, null, 2));
  }
};

export const logNetworkError = (url: string, error: any) => {
  console.error(`🌐 Error from ${url}:`, {
    code: error.code,
    message: error.message,
    stack: error.stack
  });
};

// Intercept fetch requests to log Firebase API calls
const originalFetch = global.fetch;
global.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = typeof input === 'string' ? input : input.toString();
  const method = init?.method || 'GET';
  
  // Only log Firebase API calls
  if (url.includes('firebaseapp.com') || url.includes('googleapis.com')) {
    logNetworkRequest(url, method, init?.body);
    
    try {
      const response = await originalFetch(input, init);
      const clonedResponse = response.clone();
      
      try {
        const responseData = await clonedResponse.json();
        logNetworkResponse(url, response.status, responseData);
      } catch {
        logNetworkResponse(url, response.status, 'Non-JSON response');
      }
      
      return response;
    } catch (error) {
      logNetworkError(url, error);
      throw error;
    }
  }
  
  return originalFetch(input, init);
};