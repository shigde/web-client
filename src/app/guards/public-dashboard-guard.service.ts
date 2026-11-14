import {inject} from '@angular/core';
import {CanActivateFn, Router} from '@angular/router';
import {SessionService, UserService} from '@shigde/core';
import {catchError, map, of, switchMap, take} from 'rxjs';

/** The instance dashboard is public only while the administrator enables public content. */
export const publicDashboardGuard: CanActivateFn = () => {
  const session = inject(SessionService);
  const users = inject(UserService);
  const router = inject(Router);
  const login = router.createUrlTree(['/login']);
  return session.isActive().pipe(
    take(1),
    switchMap(hasSession => hasSession ? of(true) : users.getPublicContentPolicy().pipe(
      map(enabled => enabled ? true : login),
      catchError(() => of(login))
    ))
  );
};
