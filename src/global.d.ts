export {};

declare global {
  interface Window {
    extreamixMainStream?: MediaStream;
    getScreenDetails?: () => Promise<{ screens: any[] }>;
  }
}
