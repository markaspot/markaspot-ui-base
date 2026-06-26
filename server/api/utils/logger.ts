import { randomUUID } from 'crypto';
import type { LogData } from '../../types/proxy';

/**
 * Enhanced safe logging utility that prevents sensitive data exposure and formats logs consistently
 */
export const logRequest = (message: string, data: LogData): void => {
  const safeData: Record<string, unknown> = { ...data };

  // Truncate large content
  if (typeof safeData.body === 'string' && safeData.body.length > 1000) {
    safeData.body = `${safeData.body.substring(0, 1000)}... (truncated)`;
  }

  if (typeof safeData.responseText === 'string' && safeData.responseText.length > 500) {
    safeData.responseText = `${safeData.responseText.substring(0, 500)}... (truncated)`;
  }

  // Filter sensitive headers
  if (safeData.headers && typeof safeData.headers === 'object') {
    const headers = safeData.headers as Record<string, unknown>;
    safeData.headers = Object.keys(headers).reduce<Record<string, unknown>>((acc, key) => {
      if (!['authorization', 'cookie', 'x-csrf-token'].includes(key.toLowerCase())) {
        acc[key] = headers[key];
      } else {
        acc[key] = '[REDACTED]';
      }
      return acc;
    }, {});
  }

  const timestamp = new Date().toISOString();
  const requestId = randomUUID().split('-')[0];

  console.debug(`[${timestamp}] [${requestId}] [API Proxy] ${message}`, safeData);

  if (message.toLowerCase().includes('error') ||
      (typeof safeData.status === 'number' && safeData.status >= 400)) {
    console.error(`[${timestamp}] [${requestId}] [API Proxy ERROR] ${message}`);

    if (typeof safeData.stack === 'string') {
      console.error(`[${timestamp}] [${requestId}] [Stack Trace]:\n${safeData.stack}`);
      delete safeData.stack;
    }
  }
};

/**
 * Enhanced geocoding-specific logging
 */
export const logGeocoding = (message: string, data: LogData): void => {
  const timestamp = new Date().toISOString();
  const safeData: Record<string, unknown> = { ...data };

  if (safeData.headers && typeof safeData.headers === 'object') {
    const headers = safeData.headers as Record<string, unknown>;
    Object.keys(headers).forEach(key => {
      if (['authorization', 'cookie', 'x-csrf-token'].includes(key.toLowerCase())) {
        headers[key] = '[REDACTED]';
      }
    });
  }

  const requestId = randomUUID().split('-')[0];

  console.debug(`[${timestamp}] [${requestId}] [Geocoding] ${message}`, safeData);

  if (message.toLowerCase().includes('error') || message.toLowerCase().includes('failed')) {
    console.error(`[${timestamp}] [${requestId}] [Geocoding ERROR] ${message}`);

    if (typeof safeData.stack === 'string') {
      console.error(`[${timestamp}] [${requestId}] [Stack Trace]:\n${safeData.stack}`);
      delete safeData.stack;
    }
  }
};
