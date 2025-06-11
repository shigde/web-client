import {Component} from '@angular/core';
import {catchError, filter, Observable, of, take, tap} from 'rxjs';
import {Stream, StreamService, User, UserService} from '@shigde/core';
import {ActivatedRoute, Router} from '@angular/router';
import {AlertService} from '../../../../providers/alert.service';
import {map} from 'rxjs/operators';
import {AlertKind} from '../../../../entities/alert';
import {AsyncPipe, NgOptimizedImage} from '@angular/common';
import {AvatarComponent} from '../../../../component/avatar/avatar.component';

@Component({
  selector: 'app-stream',
  imports: [
    NgOptimizedImage,
    AsyncPipe,
    AvatarComponent
  ],
  templateUrl: './stream.component.html',
  styleUrl: './stream.component.scss'
})
export class StreamComponent {
  stream$!: Observable<Stream>;
  userName = 'dd';
  streamUuid!: string;
  thumbnail!: string;

  constructor(
    private readonly router: Router,
    private readonly streamService: StreamService,
    private readonly userService: UserService,
    private readonly alert: AlertService,
    activeRoute: ActivatedRoute) {
    if (activeRoute.snapshot.params['streamUuid']) {
      const streamUuid = activeRoute.snapshot.params['streamUuid'];
      this.streamUuid = streamUuid;
      this.stream$ = streamService.getStream(streamUuid).pipe(
        map(d => {
          this.thumbnail = d.data.thumbnail == ''
            ? 'assets/images/default-banner-2.jpg'
            : `${window.location.origin}/static/${d.data.thumbnail}`;
          return d.data;
        }),
        catchError(_ => this.handleError<null>('Could not load stream!', null)),
        filter(s => s !== null),
      );
      userService.getUser().pipe(
        take(1),
        tap(u => this.userName = u.name),
        catchError(_ => this.handleError<null>('Could not load user!', null)),
      ).subscribe();
    }
  }

  editStream() {
    this.router.navigate(['/stream/' + this.streamUuid + '/edit']);
  }

  private handleError<T>(msg: string, resp: T): Observable<T> {
    this.alert.alert(AlertKind.DANGER, msg);
    return of(resp);
  }
}
