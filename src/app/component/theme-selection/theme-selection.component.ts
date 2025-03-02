import {Component, OnInit} from '@angular/core';
import {Theme, ThemeService} from '../../providers/theme.service';
import {NgClass, NgIf} from '@angular/common';

@Component({
  selector: 'app-theme-selection',
  imports: [
    NgIf,
    NgClass
  ],
  templateUrl: './theme-selection.component.html',
  styleUrl: './theme-selection.component.scss'
})
export class ThemeSelectionComponent {

  private selectedTheme: Theme;

  constructor(private themeService: ThemeService) {
    this.selectedTheme = this.themeService.getPreferredTheme();
  }

  isDark(): boolean {
    return this.selectedTheme === 'dark';
  }

  isLight(): boolean {
    return this.selectedTheme === 'light';
  }

  isAuto(): boolean {
    return this.selectedTheme === 'auto';
  }

  public toggleTheme(theme: Theme): void {
    this.themeService.setStoredTheme(theme);
    this.themeService.setTheme(theme);
    this.selectedTheme = theme;
  }
}
