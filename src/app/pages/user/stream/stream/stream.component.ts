import {Component} from '@angular/core';
import {catchError, filter, mergeMap, Observable, of, take, tap} from 'rxjs';
import {createAppLogger, StreamPreview, StreamService, UserService} from '@shigde/core';
import {ActivatedRoute, Router} from '@angular/router';
import {AlertService} from '../../../../providers/alert.service';
import {map} from 'rxjs/operators';
import {AlertKind} from '../../../../entities/alert';
import {DatePipe, NgOptimizedImage} from '@angular/common';
import {AvatarComponent} from '../../../../component/avatar/avatar.component';

@Component({
  selector: 'app-stream',
  imports: [
    NgOptimizedImage,
    AvatarComponent,
    DatePipe
  ],
  templateUrl: './stream.component.html',
  styleUrl: './stream.component.scss'
})
export class StreamComponent {
  private readonly log = createAppLogger('StreamComponent');

  hasStream = false;
  stream!: StreamPreview;
  userName = 'unknown';
  streamUuid!: string;
  channelUuid!: string;
  thumbnail!: string;

  constructor(
    private readonly router: Router,
    private readonly streamService: StreamService,
    private readonly userService: UserService,
    private readonly alert: AlertService,
    activeRoute: ActivatedRoute) {

    // Load Stream and Owner
    if (activeRoute.snapshot.params['streamUuid']) {
      const streamUuid = activeRoute.snapshot.params['streamUuid'];
      this.streamUuid = streamUuid;
      streamService.getStreamPreview(streamUuid).pipe(
        take(1),
        map(d => {
          this.thumbnail = d.data.thumbnail == ''
            ? 'assets/images/default-banner-2.jpg'
            : `${window.location.origin}/static/${d.data.thumbnail}`;
          return d.data;
        }),
        catchError(_ => this.handleError<null>('Could not load stream!', null)),
        filter(s => s !== null),
        tap((s) => {
          this.hasStream = true;
          this.stream = s;
        }),
        mergeMap((s) => userService.getUser(s.ownerUuid)),
        take(1),
        tap(u => this.userName = u.name),
        catchError(_ => this.handleError<null>('Could not load user!', null)),
      ).subscribe();
    }
  }

  editStream() {
    this.router.navigate(['/stream/' + this.streamUuid + '/edit']);
  }

  startStream() {
    this.log.info('start stream', this.streamUuid, this.stream.channelUuid);
    this.router.navigate(['/channel/' + this.stream.channelUuid + '/stream/' + this.streamUuid + '/lobby']);
  }

  deleteStream() {
    this.streamService.deleteStream(this.streamUuid).pipe(
      take(1),
      tap(_ => this.alert.alert(AlertKind.SUCCESS, 'The Stream has been deleted!')),
      map(_ => this.router.navigate(['/dashboard'])),
      catchError(_ => this.handleError<null>('Could not delete stream!', null)),
    ).subscribe();
  }

  private handleError<T>(msg: string, resp: T): Observable<T> {
    this.alert.alert(AlertKind.DANGER, msg);
    return of(resp);
  }
}
