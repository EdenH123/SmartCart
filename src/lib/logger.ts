type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  level: LogLevel;
  module: string;
  message: string;
  data?: Record<string, unknown>;
  timestamp: string;
}

function formatEntry(entry: LogEntry): string {
  const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.module}]`;
  const dataStr = entry.data ? ` ${JSON.stringify(entry.data)}` : '';
  return `${prefix} ${entry.message}${dataStr}`;
}

function log(level: LogLevel, module: string, message: string, data?: Record<string, unknown>) {
  const entry: LogEntry = {
    level,
    module,
    message,
    data,
    timestamp: new Date().toISOString(),
  };

  const formatted = formatEntry(entry);

  switch (level) {
    case 'error':
      console.error(formatted);
      break;
    case 'warn':
      console.warn(formatted);
      break;
    case 'debug':
      if (process.env.NODE_ENV === 'development') {
        console.debug(formatted);
      }
      break;
    default:
      console.log(formatted);
  }
}

export function createLogger(module: string) {
  return {
    info: (message: string, data?: Record<string, unknown>) => log('info', module, message, data),
    warn: (message: string, data?: Record<string, unknown>) => log('warn', module, message, data),
    error: (message: string, data?: Record<string, unknown>) => log('error', module, message, data),
    debug: (message: string, data?: Record<string, unknown>) => log('debug', module, message, data),
  };
}
