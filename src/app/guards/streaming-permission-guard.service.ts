import {inject} from '@angular/core';
import {CanActivateFn, Router} from '@angular/router';
import {SessionService, UserService} from '@shigde/core';
import {catchError, map, of, switchMap, take} from 'rxjs';

/** Keeps users without publish permission out of stream creation and their own lobby. */
export const streamingPermissionGuard: CanActivateFn = route => {
  const router = inject(Router);
  const sessions = inject(SessionService);
  const users = inject(UserService);
  const lobbyChannel = route.paramMap.get('channelUuid');
  const creatingStream = route.routeConfig?.path === 'stream/new';

  return sessions.getUser().pipe(
    take(1),
    switchMap(user => {
      if (!user) return of(true); // UserAccessGuard handles unauthenticated navigation.
      // Guests may enter another channel's invited lobby; only the channel owner needs publish rights.
      if (!creatingStream && lobbyChannel !== user.channel_uuid) return of(true);
      return users.getMyStreamingPolicy().pipe(
        map(policy => policy.canStream ? true : router.createUrlTree(['/channel', user.channel_uuid], {
          queryParams: {streamingPermissionRequired: 'true'}
        })),
        catchError(() => of(router.createUrlTree(['/channel', user.channel_uuid], {
          queryParams: {streamingPermissionRequired: 'true'}
        })))
      );
    })
  );
};
