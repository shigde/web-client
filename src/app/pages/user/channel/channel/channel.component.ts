import {Component} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {Channel, ChannelService, StreamPreview, StreamService} from '@shigde/core';
import {catchError, filter, Observable, of, take, tap} from 'rxjs';
import {map} from 'rxjs/operators';
import {AlertKind} from '../../../../entities/alert';
import {AlertService} from '../../../../providers/alert.service';
import {NgOptimizedImage} from '@angular/common';
import {FederativeService} from '../../../../providers/federative.service';
import {StreamPreviewCardComponent} from '../../../../component/stream-preview-card/stream-preview-card.component';

export interface CompChannel extends Channel {
  domain: string;
  title: string;
  banner: string;
}

@Component({
  selector: 'app-channel',
  imports: [
    NgOptimizedImage,
    StreamPreviewCardComponent
  ],
  templateUrl: './channel.component.html',
  styleUrl: './channel.component.scss'
})
export class ChannelComponent {

  public hasStreams = false;
  public streams: StreamPreview[] = [];
  public channel!: CompChannel;
  public banner = '';

  private readonly channelUuid: string;

  constructor(
    private readonly router: Router,
    private readonly channelService: ChannelService,
    private readonly streamService: StreamService,
    private readonly alert: AlertService,
    activeRoute: ActivatedRoute) {
    this.channelUuid = activeRoute.snapshot.params['channelUuid'];

    this.channelService.fetch(this.channelUuid).pipe(
      take(1),
      map((res) => {
        let {domain, name} = FederativeService.splitDomainNameToJson(res.data.name);
        // @ts-ignore
        const banner = res.data.banner_name == ''
          ? 'assets/images/default-banner-2.jpg'
          : `${window.location.origin}/static/${res.data.banner_name}`;
        this.banner = banner;
        return {...res.data, domain, title: name, banner};
      }),
      catchError(_ => this.handleError<null>('Could not load channel!', null)),
      filter(c => c !== null),
      tap((c) => this.channel = c),
    ).subscribe();

    this.getStreams().subscribe();
  }

  editChannel() {
    this.router.navigate(['/channel/' + this.channelUuid + '/edit']);
  }

  getStreams(): Observable<StreamPreview[]> {
    return this.streamService.getChannelStreamPreviewList(this.channelUuid)
      .pipe(
        take(1),
        map((resp) => resp.data),
        tap((streams) => this.hasStreams = streams.length > 0),
        tap((streams) => this.streams = streams),
        catchError(_ => this.handleError<StreamPreview[]>('Could not load channel streams!', [])),
      );
  }

  private handleError<T>(msg: string, resp: T): Observable<T> {
    this.alert.alert(AlertKind.DANGER, msg);
    return of(resp);
  }
}
