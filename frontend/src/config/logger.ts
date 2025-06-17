import { Logger } from '@walletconnect/logger';

// Create a browser-safe logger
const logger = new Logger({
  level: 'error', // Only show errors in production
  logger: {
    debug: (...args: unknown[]) => console.debug(...args),
    info: (...args: unknown[]) => console.info(...args),
    warn: (...args: unknown[]) => console.warn(...args),
    error: (...args: unknown[]) => console.error(...args),
  },
});

export default logger; 