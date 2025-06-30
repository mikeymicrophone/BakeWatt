import { Application } from '@/core/engine/Application';

declare global {
  interface Window {
    appInstance?: Application;
  }
}

export {};