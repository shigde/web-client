import {ChangeDetectorRef, Component, DestroyRef} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {Channel, ChannelService, LocalStoreService, RecordedVideo, RecordedVideoPreview, StreamPreview, StreamService, SessionService, VideoService} from '@shigde/core';
import {catchError, filter, Observable, of, take, tap} from 'rxjs';
import {map} from 'rxjs/operators';
import {AlertKind} from '../../../../entities/alert';
import {AlertService} from '../../../../providers/alert.service';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {NgbNavModule} from '@ng-bootstrap/ng-bootstrap';
import {DatePipe, NgOptimizedImage, NgTemplateOutlet} from '@angular/common';
import {FederativeService} from '../../../../providers/federative.service';
import {AvatarComponent} from '../../../../component/avatar/avatar.component';
import {StreamPreviewCardComponent} from '../../../../component/stream-preview-card/stream-preview-card.component';
import {ReplayActionsComponent} from '../../../../component/replay-actions/replay-actions.component';
import {ReplayStatusComponent} from '../../../../component/replay-status/replay-status.component';

export interface CompChannel extends Channel {
  domain: string;
  title: string;
  banner: string;
}

@Component({
  selector: 'app-channel',
  imports: [
    NgOptimizedImage, DatePipe, NgTemplateOutlet, NgbNavModule, AvatarComponent,
    StreamPreviewCardComponent, ReplayActionsComponent, ReplayStatusComponent
  ],
  templateUrl: './channel.component.html',
  styleUrl: './channel.component.scss'
})
export class ChannelComponent {

  public hasStreams = false;
  public streams: StreamPreview[] = [];
  public replays: RecordedVideoPreview[] = [];
  public replaysLoaded = false;
  ownedReplays: RecordedVideo[] = [];
  ownedReplaysLoaded = false;
  public channel!: CompChannel;
  public banner = '';
  isOwner = false;
  activeTab = 'overview';
  recordReplaysByDefault = false;

  private readonly channelUuid: string;
  private ownerUuid?: string;

  constructor(
    private readonly router: Router,
    private readonly channelService: ChannelService,
    private readonly streamService: StreamService,
    private readonly videoService: VideoService,
    private readonly localStore: LocalStoreService,
    private readonly alert: AlertService,
    activeRoute: ActivatedRoute,
    private readonly cdr: ChangeDetectorRef,
    session: SessionService,
    private readonly destroyRef: DestroyRef) {
    this.channelUuid = activeRoute.snapshot.params['channelUuid'];
    session.getUser().pipe(takeUntilDestroyed(destroyRef)).subscribe(user => {
      this.isOwner = !!user && user.channel_uuid === this.channelUuid;
      this.ownerUuid = this.isOwner ? user?.uuid : undefined;
      this.recordReplaysByDefault = !!this.ownerUuid && this.localStore.loadReplayDefault(this.ownerUuid);
      if (this.isOwner) this.loadOwnedReplays();
      else this.ownedReplays = [];
      if (!this.isOwner && this.activeTab === 'dashboard') this.activeTab = 'overview';
      this.cdr.markForCheck();
    });

    this.channelService.fetch(this.channelUuid).pipe(
      take(1),
      map((res) => {
        let {domain, name} = FederativeService.splitDomainNameToJson(res.data.name);
        // @ts-ignore
        const banner = res.data.banner_name == ''
          ? 'assets/images/default-banner-2.jpg'
          : `${window.location.origin}/static/${res.data.banner_name}`;
        this.banner = banner;
        return {...res.data, domain, title: res.data.display_name || name, banner};
      }),
      catchError(_ => this.handleError<null>('Could not load channel!', null)),
      filter(c => c !== null),
      tap((c) => { this.channel = c; this.cdr.markForCheck(); }),
    ).subscribe();

    this.getStreams().subscribe();
    this.loadPublicReplays();
  }

  setReplayDefault(enabled: boolean): void {
    if (!this.ownerUuid) return;
    this.localStore.saveReplayDefault(this.ownerUuid, enabled);
    this.recordReplaysByDefault = enabled;
  }

  private loadPublicReplays(): void {
    this.videoService.getChannelPreviewList(this.channelUuid).pipe(
      take(1),
      takeUntilDestroyed(this.destroyRef),
      catchError(_ => this.handleError<RecordedVideoPreview[]>('Could not load channel replays!', [])),
    ).subscribe(replays => {
      this.replays = replays;
      this.replaysLoaded = true;
      this.cdr.markForCheck();
    });
  }

  replayChanged(): void {
    this.loadOwnedReplays();
    this.loadPublicReplays();
  }

  loadOwnedReplays(): void {
    this.videoService.list().pipe(take(1), takeUntilDestroyed(this.destroyRef),
      catchError(_ => this.handleError<RecordedVideo[]>('Could not load your replays!', [])),
    ).subscribe(videos => {
      if (!this.isOwner) return;
      this.ownedReplays = videos.filter(video => video.channelUuid === this.channelUuid);
      this.ownedReplaysLoaded = true;
      this.cdr.markForCheck();
    });
  }

  replayPreview(video: RecordedVideo): StreamPreview {
    return {uuid: video.uuid, type: 'video', title: video.title, thumbnail: video.thumbnail,
      description: video.description, support: video.support, durationMs: video.durationMs,
      date: new Date(video.startedAt || video.createdAt), start_time: null, end_time: null,
      viewer: 0, likes: 0, dislikes: 0, isLive: false,
      ownerName: this.channel?.user || '', ownerUuid: video.ownerUuid, ownerAvatar: '',
      channelUuid: video.channelUuid, channelName: this.channel?.name || '',
      channelDisplayName: this.channel?.title || ''};
  }

  openLobby(stream: StreamPreview): void {
    if (!this.isOwner) return;
    this.router.navigate(['/channel', this.channelUuid, 'stream', stream.uuid, 'lobby']);
  }

  editChannel() {
    this.router.navigate(['/channel/' + this.channelUuid + '/edit']);
  }

  getStreams(): Observable<StreamPreview[]> {
    return this.streamService.getChannelStreamPreviewList(this.channelUuid)
      .pipe(
        take(1),
        map((resp) => resp.data.filter(stream => stream.type !== 'video')),
        tap((streams) => this.hasStreams = streams.length > 0),
        tap((streams) => { this.streams = streams; this.cdr.markForCheck(); }),
        catchError(_ => this.handleError<StreamPreview[]>('Could not load channel streams!', [])),
      );
  }

  private handleError<T>(msg: string, resp: T): Observable<T> {
    this.alert.alert(AlertKind.DANGER, msg);
    return of(resp);
  }
}
