/// <reference types="vite/client" />

declare global {
  var ENV_VARS: Record<string, string | number | boolean | undefined> | undefined;
}

export {};
