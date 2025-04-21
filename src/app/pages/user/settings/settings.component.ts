import {Component} from '@angular/core';
import {UpdatePasswordComponent} from '../../auth/update-password/update-password.component';
import {ThemeSelectionComponent} from '../../../component/theme-selection/theme-selection.component';

@Component({
  selector: 'app-settings',
  imports: [UpdatePasswordComponent, ThemeSelectionComponent],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent {

}
