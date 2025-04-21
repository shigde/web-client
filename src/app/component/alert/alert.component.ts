import {Component} from '@angular/core';
import {NgbAlertModule} from '@ng-bootstrap/ng-bootstrap';
import {Alert} from '../../entities/alert';
import {AlertService} from '../../providers/alert.service';
import {filter, tap} from 'rxjs';

@Component({
  selector: 'app-alert',
  imports: [
    NgbAlertModule
  ],
  templateUrl: './alert.component.html',
  styleUrl: './alert.component.scss'
})
export class AlertComponent {

  alerts: Alert[] = [];

  constructor(service: AlertService) {
    service.alerts$.pipe(
      filter(a => a !== null),
      tap(a => this.add(a))
    ).subscribe();
  }

  add(alert: Alert) {
    this.alerts.push(alert);
    window.setTimeout(() => this.close(alert), 10000);
  }

  close(alert: Alert) {
    if (this.alerts.indexOf(alert) >= 0) {
      this.alerts.splice(this.alerts.indexOf(alert), 1);
      alert.closed();
    }
  }

}
