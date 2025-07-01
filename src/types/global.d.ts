import { Application } from '@/core/engine/Application';

declare global {
  interface Window {
    appInstance?: Application;
  }
  
  interface ImportMeta {
    env: {
      DEV?: boolean;
      [key: string]: any;
    };
  }
}

export {};