import {Injectable} from '@angular/core';

export type RuntimeConfig = {
  apiPrefix: string;
  relayService: string;
};

declare global {
  interface Window {
    __SHIG_CONFIG__?: Partial<RuntimeConfig>;
  }
}

const DEFAULT_CONFIG: RuntimeConfig = {
  apiPrefix: '/api',
  relayService: 'http://localhost:4443',
};

@Injectable({providedIn: 'root'})
export class RuntimeConfigService {
  private readonly config: RuntimeConfig = {
    ...DEFAULT_CONFIG,
    ...(window.__SHIG_CONFIG__ ?? {}),
  };

  get apiPrefix(): string {
    return this.config.apiPrefix;
  }

  get relayService(): string {
    return this.config.relayService;
  }

  getConfig(): RuntimeConfig {
    return {...this.config};
  }
}
