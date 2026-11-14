import '@moq/watch/element';
import '@moq/watch/ui';
import {ChangeDetectorRef, Component, CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {catchError, filter, forkJoin, Observable, of, Subject, switchMap, take, takeUntil, tap} from 'rxjs';
import {Subscription} from 'rxjs';
import {
  ChannelService, createAppLogger, RecordedVideo, RecordedVideoPreview, RelayService, VideoService,
  SessionService, PollingService, ReactionService, ReactionStats, ViewerService,
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
import {NgOptimizedImage} from '@angular/common';
import {StreamCountdownComponent} from '../../../../component/stream-countdown/stream-countdown.component';
import {AvatarComponent} from '../../../../component/avatar/avatar.component';
import {RuntimeConfigService} from "../../../../providers/runtime-config.service";
import {HlsPlayerComponent} from '../../../../component/hls-player/hls-player.component';
import {ReplayActionsComponent} from '../../../../component/replay-actions/replay-actions.component';
import {ReplayStatusComponent} from '../../../../component/replay-status/replay-status.component';

@Component({
  selector: 'app-stream',
  imports: [
    NgOptimizedImage, StreamCountdownComponent,
    AvatarComponent,
    HlsPlayerComponent, ReplayActionsComponent, ReplayStatusComponent
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

  stream!: StreamPreview | RecordedVideoPreview;
  userName = 'unknown';
  sessionUser!: User | null;
  streamUuid!: string;
  channelUuid!: string;
  thumbnail!: string;
  isLive: boolean = false;
  ownedReplay?: RecordedVideo;
  likedByMe = false;
  likeBusy = false;
  get isVideo(): boolean { return this.stream?.type === 'video'; }
  private destroy$ = new Subject<void>();
  private viewerPolling?: Subscription;

  constructor(
    private readonly router: Router,
    private readonly streamService: StreamService,
    private readonly relayService: RelayService,
    private readonly alert: AlertService,
    private readonly cdr: ChangeDetectorRef,
    runtime: RuntimeConfigService,
    guestService: StreamFriendService,
    private readonly session: SessionService,
    userService: UserService,
    private readonly videoService: VideoService,
    private readonly reactionService: ReactionService,
    private readonly polling: PollingService,
    private readonly viewerService: ViewerService,
    channelService: ChannelService,
    activeRoute: ActivatedRoute) {

    this.relayUrl = runtime.relayService;
    // Load Stream and Owner
    if (activeRoute.snapshot.params['streamUuid']) {
      const streamUuid = activeRoute.snapshot.params['streamUuid'];
      this.streamUuid = streamUuid;
      const preview$: Observable<StreamPreview | RecordedVideoPreview> = activeRoute.snapshot.data?.['type'] === 'video'
        ? videoService.getPreview(streamUuid).pipe(catchError(() =>
            videoService.get(streamUuid).pipe(switchMap(video =>
              channelService.fetch(video.channelUuid).pipe(
                map(response => ({...this.previewFromOwned(video), channelName: response.data.name,
                  channelDisplayName: response.data.display_name})),
                catchError(() => of(this.previewFromOwned(video))),
              )))))
        : streamService.getStreamPreview(streamUuid).pipe(map(response => response.data));
      preview$.pipe(
        take(1),
        map(d => {
          this.thumbnail = d.thumbnail == ''
            ? 'assets/images/default-banner-2.jpg'
            : `${window.location.origin}/static/${d.thumbnail}`;
          return d;
        }),
        catchError(error => {
          if (activeRoute.snapshot.data?.['type'] === 'video' && !session.isAuthenticated() && error?.status === 401) {
            void router.navigate(['/login'], {queryParams: {returnUrl: router.url}});
            return of(null);
          }
          return this.handleError<null>('Could not load stream or video!', null);
        }),
        filter(s => s !== null),
        tap((s) => {
          this.hasStream = true;
          this.stream = s;
          this.channelUuid = this.stream.channelUuid;
        }),

        switchMap(stream =>
          forkJoin({
            owner: userService.getUser(stream.ownerUuid),
            sessionUser: session.isAuthenticated() ? session.getUser().pipe(
              filter((u): u is User => !!u),
              take(1)
            ) : of(null),
            friends: session.isAuthenticated() && stream.type !== 'video' ? guestService.getStreamFriendsList(stream.uuid) : of([])
          })
        ),

        tap(({owner, sessionUser, friends}) => {
          this.userName = owner.name;
          this.sessionUser = sessionUser;
          const current_user_uuid = sessionUser ? sessionUser.uuid : '';

          this.isOwner = owner.uuid === current_user_uuid;
          this.isGuest = friends.some(f => f.uuid === current_user_uuid);
          if (this.isVideo && this.isOwner && !this.ownedReplay) {
            this.videoService.get(this.streamUuid).pipe(take(1), takeUntil(this.destroy$))
              .subscribe({next: video => { this.ownedReplay = video; this.cdr.markForCheck(); },
                error: () => this.alert.alert(AlertKind.DANGER, 'Could not load replay management controls!')});
          }

          this.log.info(`User is owner: ${this.isOwner} or guest: ${this.isGuest}`);
          cdr.detectChanges();
        }),
        catchError(_ => this.handleError<null>('Could not load user!', null)),
      ).subscribe(() => {
        this.startContentStatsPolling();
        if (!this.isVideo) this.startAnnouncementPolling();
      });
    }
  }

  ngOnInit() {

  }

  private previewFromOwned(video: RecordedVideo): StreamPreview {
    this.ownedReplay = video;
    return {uuid: video.uuid, type: 'video', title: video.title, thumbnail: video.thumbnail,
      description: video.description, support: video.support, durationMs: video.durationMs,
      date: new Date(video.startedAt || video.createdAt), start_time: null, end_time: null,
      viewer: video.viewCount ?? 0, likes: video.likeCount ?? 0, dislikes: 0, isLive: false,
      ownerName: '', ownerUuid: video.ownerUuid, ownerAvatar: '', channelName: '', channelUuid: video.channelUuid};
  }

  replaySaved(video: RecordedVideo): void {
    this.ownedReplay = video;
    this.stream = {...this.stream, title: video.title, description: video.description, support: video.support};
    this.cdr.markForCheck();
  }

  recordReplayView(): void {
    if (!this.isVideo) return;
    this.videoService.recordViewStart(this.streamUuid).pipe(take(1)).subscribe({
      next: viewCount => {
        this.stream = {...this.stream, viewer: viewCount};
        this.cdr.markForCheck();
      },
      error: error => this.log.warn('Could not record replay playback start', error),
    });
  }

  get canLike(): boolean { return this.session.isAuthenticated(); }

  toggleLike(): void {
    if (!this.canLike || this.likeBusy || !this.stream) return;
    this.likeBusy = true;
    this.reactionService.setLike(this.isVideo ? 'video' : 'stream', this.streamUuid, !this.likedByMe)
      .pipe(take(1), takeUntil(this.destroy$))
      .subscribe({
        next: stats => {
          this.stream = {...this.stream, likes: stats.likes};
          this.likedByMe = stats.likedByMe;
          this.likeBusy = false;
          this.cdr.markForCheck();
        },
        error: error => {
          this.likeBusy = false;
          this.log.warn('Could not update like', error);
          this.cdr.markForCheck();
        },
      });
  }

  private startContentStatsPolling(): void {
    if (!this.canLike) return;
    const kind = this.isVideo ? 'video' : 'stream';
    this.polling.watch<ReactionStats>({
      key: `content-stats:${kind}:${this.streamUuid}`,
      intervalMs: 15000,
      requiresSession: true,
      batch: {resource: 'content-stats', contentType: kind, uuid: this.streamUuid},
      load: () => of({likes: this.stream.likes, likedByMe: this.likedByMe}),
    }).pipe(takeUntil(this.destroy$)).subscribe(state => {
      if (!state.data) return;
      this.stream = {...this.stream, likes: state.data.likes};
      this.likedByMe = state.data.likedByMe;
      this.cdr.markForCheck();
    });
  }

  private startViewerPolling(): void {
    if (this.viewerPolling || !this.stream) return;
    this.viewerPolling = this.polling.watch<{viewers: number}>({
      key: `live-viewers:${this.streamUuid}`,
      intervalMs: 15000,
      requiresSession: true,
      batch: {resource: 'live-viewers', streamUuid: this.streamUuid},
      load: () => of({viewers: this.stream.viewer}),
    }).pipe(takeUntil(this.destroy$), map(state => state.data?.viewers ?? 0)).subscribe(viewers => {
      this.stream = {...this.stream, viewer: viewers};
      this.cdr.markForCheck();
    });
  }

  private stopViewerPolling(): void {
    this.viewerPolling?.unsubscribe();
    this.viewerPolling = undefined;
    if (this.stream) this.stream = {...this.stream, viewer: 0};
  }

  replayDeleted(): void {
    this.router.navigate(['/channel', this.channelUuid]);
  }

  get playbackUrl(): string {
    const url = new URL(`${this.relayUrl}/${this.channelUuid}`);
    const token = this.session.getAuthenticationToken();
    if (token) {
      url.searchParams.set('jwt', token);
    }
    return url.toString();
  }

  get videoPlaybackUrl(): string {
    return `/static/recordings/${encodeURIComponent(this.streamUuid)}/master.m3u8`;
  }

  ngOnDestroy() {
    this.stopViewerPolling();
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
    if (!this.session.isAuthenticated()) {
      this.viewerPolling = this.viewerService.watchPublicStream(this.streamUuid)
        .pipe(takeUntil(this.destroy$)).subscribe(status => {
          this.isLive = status.isLive;
          this.stream = {...this.stream, viewer: status.viewers};
          this.cdr.detectChanges();
        });
      return;
    }
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
          if (isLive) this.startViewerPolling();
          else this.stopViewerPolling();
          this.cdr.detectChanges();
        },
        error: err => {
          this.log.error('Polling error', err);
        }
      });
  }

}
