import {Component} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {Channel, ChannelService, Stream, StreamService} from '@shigde/core';
import {catchError, filter, Observable, of, take} from 'rxjs';
import {map} from 'rxjs/operators';
import {AlertKind} from '../../../../entities/alert';
import {AlertService} from '../../../../providers/alert.service';
import {AsyncPipe, NgForOf, NgIf, NgOptimizedImage} from '@angular/common';
import {FederativeService} from '../../../../providers/federative.service';
import {StreamCardComponent} from '../../../../component/stream-card/stream-card.component';

export interface CompChannel extends Channel {
  domain: string;
  title: string;
  banner: string;
}

@Component({
  selector: 'app-channel',
  imports: [
    AsyncPipe,
    NgOptimizedImage,
    NgForOf,
    NgIf,
    StreamCardComponent
  ],
  templateUrl: './channel.component.html',
  styleUrl: './channel.component.scss'
})
export class ChannelComponent {

  public readonly channel$: Observable<CompChannel>;
  public banner = '';
  public streams$: Observable<Stream[]> = of([]);

  private readonly channelUuid: string;


  constructor(
    private readonly router: Router,
    private readonly channelService: ChannelService,
    private readonly streamService: StreamService,
    private readonly alert: AlertService,
    activeRoute: ActivatedRoute) {
    this.channelUuid = activeRoute.snapshot.params['channelUuid'];

    this.channel$ = this.channelService.fetch(this.channelUuid).pipe(
      take(1),
      map((res) => {
        let {domain, name} = FederativeService.splitDomainNameToJson(res.data.name);
        const banner = res.data.banner_name = ''
          ? 'assets/images/default-banner-2.jpg'
          : `${window.location.origin}/static/${res.data.banner_name}`;
        this.banner = banner;
        return {...res.data, domain, title: name, banner};
      }),
      catchError(_ => this.handleError<null>('Could not load channel!', null)),
      filter(c => c !== null),
    );
  }

  editChannel() {
    this.router.navigate(['/channel/' + this.channelUuid + '/edit']);
  }

  private handleError<T>(msg: string, resp: T): Observable<T> {
    this.alert.alert(AlertKind.DANGER, msg);
    return of(resp);
  }
}
