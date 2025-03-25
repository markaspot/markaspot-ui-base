

export interface ErrorState {
  isVisible: boolean;
  message: string;
  
  meta?: Record<string, any>;
  errors: Array<{
    field: string;
    message: string;
    code?: string;
    
    meta?: Record<string, any>;
  }>;
}

export class ApiError extends Error {
  
  public originalMessage?: string;
  
  constructor(
    public status: number,
    public statusText: string,
    public data: any
  ) {
    super(`API Error: ${status} ${statusText}`);
    this.name = 'ApiError';
    
    
    if (data && typeof data === 'object') {
      if (data.message) {
        this.originalMessage = data.message;
      } else if (data.data && data.data.message) {
        this.originalMessage = data.data.message;
      }
    }
  }
}
