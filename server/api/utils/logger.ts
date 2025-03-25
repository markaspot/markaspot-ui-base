export const logRequest = (message: string, data: any): void => {
  
  const safeData = { ...data };
  
  
  if (safeData.body && typeof safeData.body === 'string' && safeData.body.length > 1000) {
    safeData.body = `${safeData.body.substring(0, 1000)}... (truncated)`;
  }
  
  
  if (safeData.responseText && typeof safeData.responseText === 'string' && safeData.responseText.length > 500) {
    safeData.responseText = `${safeData.responseText.substring(0, 500)}... (truncated)`;
  }
  
  
  if (safeData.headers) {
    
    safeData.headers = Object.keys(safeData.headers).reduce((acc, key) => {
      if (!['authorization', 'cookie', 'x-csrf-token'].includes(key.toLowerCase())) {
        acc[key] = safeData.headers[key];
      } else {
        acc[key] = '[REDACTED]';
      }
      return acc;
    }, {});
  }
  
  
  const timestamp = new Date().toISOString();
  
  
  const requestId = Math.random().toString(36).substring(2, 10);
  
  
  console.debug(`[${timestamp}] [${requestId}] [API Proxy] ${message}`, safeData);
  
  
  if (message.toLowerCase().includes('error') || 
      (safeData.status && (typeof safeData.status === 'number' && safeData.status >= 400))) {
    console.error(`[${timestamp}] [${requestId}] [API Proxy ERROR] ${message}`);
    
    
    if (safeData.stack) {
      console.error(`[${timestamp}] [${requestId}] [Stack Trace]:\n${safeData.stack}`);
      delete safeData.stack;
    }
  }
};

export const logGeocoding = (message: string, data: any): void => {
  
  const timestamp = new Date().toISOString();
  
  
  const safeData = { ...data };
  
  
  if (safeData.headers) {
    Object.keys(safeData.headers).forEach(key => {
      if (['authorization', 'cookie', 'x-csrf-token'].includes(key.toLowerCase())) {
        safeData.headers[key] = '[REDACTED]';
      }
    });
  }
  
  
  const requestId = Math.random().toString(36).substring(2, 10);
  
  
  
  
  
  if (message.toLowerCase().includes('error') || message.toLowerCase().includes('failed')) {
    console.error(`[${timestamp}] [${requestId}] [Geocoding ERROR] ${message}`);
    
    
    if (safeData.stack) {
      console.error(`[${timestamp}] [${requestId}] [Stack Trace]:\n${safeData.stack}`);
      delete safeData.stack;
    }
  }
};