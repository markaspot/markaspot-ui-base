import { defineConfig } from '@playwright/test';
import clientConfig from './config/clients'

export default defineConfig({
  
  
  
  use: {
    
    baseURL: 'http://localhost:3000',
    ignoreHTTPSErrors: true,
    headless: false, 
    
  },
  timeout: 60000, 
  expect: {
    timeout: 10000  
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
});
