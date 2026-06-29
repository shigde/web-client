import '@moq/watch/element';
import '@moq/watch/ui';
import {ChangeDetectorRef, Component, CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {catchError, filter, forkJoin, Observable, of, Subject, switchMap, take, takeUntil, tap} from 'rxjs';
import {
  createAppLogger, RelayService,
  SessionService,
  StreamFriendService,
  StreamPreview,
  StreamService,
  User,
  UserService
} from '@shigde/core';
import {ActivatedRoute, Router} from '@angular/router';
import {AlertService} from '../../../../providers/alert.service';
import {map} from 'rxjs/operators';
import {AlertKind} from '../../../../entities/alert';
import {DatePipe, NgOptimizedImage} from '@angular/common';
import {AvatarComponent} from '../../../../component/avatar/avatar.component';
import {RuntimeConfigService} from "../../../../providers/runtime-config.service";

@Component({
  selector: 'app-stream',
  imports: [
    NgOptimizedImage,
    AvatarComponent,
    DatePipe
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './stream.component.html',
  styleUrl: './stream.component.scss'
})
export class StreamComponent {
  readonly relayUrl: string
  private readonly log = createAppLogger('StreamComponent');

  isOwner = false;
  isGuest = false;
  hasStream = false;

  stream!: StreamPreview;
  userName = 'unknown';
  sessionUser!: User | null;
  streamUuid!: string;
  channelUuid!: string;
  thumbnail!: string;
  isLive: boolean = false;
  private destroy$ = new Subject<void>();

  constructor(
    private readonly router: Router,
    private readonly streamService: StreamService,
    private readonly relayService: RelayService,
    private readonly alert: AlertService,
    private readonly runtime: RuntimeConfigService,
    private readonly cdr: ChangeDetectorRef,
    guestService: StreamFriendService,
    session: SessionService,
    userService: UserService,
    activeRoute: ActivatedRoute) {

    this.relayUrl = runtime.relayService;
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
          this.channelUuid = this.stream.channelUuid;
        }),

        switchMap(stream =>
          forkJoin({
            owner: userService.getUser(stream.ownerUuid),
            sessionUser: session.getUser().pipe(
              filter((u): u is User => !!u),
              take(1)
            ),
            friends: guestService.getStreamFriendsList(stream.uuid)
          })
        ),

        tap(({owner, sessionUser, friends}) => {
          this.userName = owner.name;
          this.sessionUser = sessionUser;
          const current_user_uuid = sessionUser ? sessionUser.uuid : '';

          this.isOwner = owner.uuid === current_user_uuid;
          this.isGuest = friends.some(f => f.uuid === current_user_uuid);

          this.log.info(`User is owner: ${this.isOwner} or guest: ${this.isGuest}`);
          cdr.detectChanges();
        }),
        catchError(_ => this.handleError<null>('Could not load user!', null)),
      ).subscribe(() => {
        this.startAnnouncementPolling();
      });
    }
  }

  ngOnInit() {

  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  editStream() {
    this.router.navigate(['/stream/' + this.streamUuid + '/edit']);
  }

  openStream() {
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

  private startAnnouncementPolling(): void {
    this.relayService
      .pollHasAnnouncement(this.channelUuid, this.streamUuid, 5000)
      .pipe(
        takeUntil(this.destroy$),
        filter(isLive => isLive !== this.isLive)
      )
      .subscribe({
        next: isLive => {
          this.log.info('Stream is live: ' + isLive);
          this.isLive = isLive;
          this.cdr.detectChanges();
        },
        error: err => {
          this.log.error('Polling error', err);
        }
      });
  }
}
