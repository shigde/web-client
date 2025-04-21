import {Injectable} from '@angular/core';

export type Theme = 'dark' | 'light' | 'auto';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private static readonly key = 'theme';

  public init(): void {
    this.setTheme(this.getPreferredTheme());

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      const storedTheme = this.getStoredTheme()
      if (storedTheme !== 'light' && storedTheme !== 'dark') {
        this.setTheme(this.getPreferredTheme())
      }
    });
  }

  public getStoredTheme(): Theme | null {
    return localStorage.getItem(ThemeService.key) as Theme;
  }

  public setStoredTheme(theme: Theme) {
    localStorage.setItem(ThemeService.key, theme);
  }

  public getPreferredTheme(): Theme  {
    const storedTheme = this.getStoredTheme();
    if (storedTheme !== null) {
      return storedTheme
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  public setTheme(theme: Theme): void  {
    if (theme === 'auto') {
      document.documentElement.setAttribute('data-bs-theme', (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'))
    } else {
      document.documentElement.setAttribute('data-bs-theme', theme)
    }
  }
}
