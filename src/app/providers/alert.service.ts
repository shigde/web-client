import {Injectable} from '@angular/core';
import {Alert, AlertKind} from '../entities/alert';
import {BehaviorSubject} from 'rxjs';
import {resolve} from '@angular/compiler-cli';

@Injectable({
  providedIn: 'root'
})
export class AlertService {

  public readonly alerts$ = new BehaviorSubject<Alert | null>(null);

  alert(kind: AlertKind, msg: string): Promise<void> {
    return new Promise((resolve) => {
      let alert: Alert = {
        kind, msg, closed: resolve
      };
      this.alerts$.next(alert);
    });
  }
}
