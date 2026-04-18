class RegistryService {
  public getEnvironment(): 'extension' | 'saas' {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
      return 'extension';
    }
    return 'saas';
  }

  public async saveState(key: string, state: any): Promise<void> {
    const env = this.getEnvironment();
    if (env === 'extension' && chrome.storage && chrome.storage.sync) {
      return new Promise((resolve) => {
        chrome.storage.sync.set({ [key]: state }, () => {
          resolve();
        });
      });
    } else {
      try {
        localStorage.setItem(key, JSON.stringify(state));
      } catch (e) {
        console.warn('Failed to save state to localStorage', e);
      }
      return Promise.resolve();
    }
  }

  public async loadState(key: string): Promise<any> {
    const env = this.getEnvironment();
    if (env === 'extension' && chrome.storage && chrome.storage.sync) {
      return new Promise((resolve) => {
        chrome.storage.sync.get([key], (result) => {
          resolve(result[key] || null);
        });
      });
    } else {
      try {
        const stored = localStorage.getItem(key);
        return Promise.resolve(stored ? JSON.parse(stored) : null);
      } catch (e) {
        console.warn('Failed to load state from localStorage', e);
        return Promise.resolve(null);
      }
    }
  }
}

export const Registry = new RegistryService();
