// Um logger simples para padronizar as saídas do console.
const FgRed = "\x1b[31m";
const FgGreen = "\x1b[32m";
const FgYellow = "\x1b[33m";
const FgBlue = "\x1b[34m";
const Reset = "\x1b[0m";

const logger = {
  info: (message) => {
    console.log(`${FgBlue}[INFO]${Reset} ${message}`);
  },
  success: (message) => {
    console.log(`${FgGreen}[SUCCESS]${Reset} ${message}`);
  },
  warn: (message) => {
    console.warn(`${FgYellow}[WARN]${Reset} ${message}`);
  },
  error: (message, error) => {
    console.error(`${FgRed}[ERROR]${Reset} ${message}`, error || '');
  }
};

export default logger;
