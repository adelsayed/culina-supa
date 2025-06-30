import { logger, consoleTransport } from 'react-native-logs';

const log = logger.createLogger({
  severity: __DEV__ ? 'debug' : 'error',
  transport: [consoleTransport],
  printLevel: true,
  printDate: true,
  enabled: true,
});

export default log;
