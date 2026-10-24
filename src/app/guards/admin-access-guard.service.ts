import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree} from '@angular/router';
import {Observable} from 'rxjs';
import {defaultIfEmpty, map, switchMap, take} from 'rxjs/operators';
import {Role, SessionService} from '@shigde/core';

@Injectable({providedIn: 'root'})
export class AdminAccessGuard implements CanActivate {
  constructor(private router: Router, private session: SessionService) {
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> {
    return this.session.initPrincipal().pipe(
      defaultIfEmpty(undefined),
      switchMap(() => this.session.getUserRole()),
      take(1),
      map(role => role === Role.ADMIN ? true : this.router.parseUrl('/settings'))
    );
  }
}
