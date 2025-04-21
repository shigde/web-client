import {Component} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {Channel, ChannelService, StreamService} from '@shigde/core';
import {catchError, Observable, of, take} from 'rxjs';
import {map} from 'rxjs/operators';
import {AlertKind} from '../../../../entities/alert';
import {AlertService} from '../../../../providers/alert.service';

@Component({
  selector: 'app-channel',
  imports: [],
  templateUrl: './channel.component.html',
  styleUrl: './channel.component.scss'
})
export class ChannelComponent {

  public readonly channel$: Observable<Channel>;
  private channelUuid: string;


  constructor(
    private readonly router: Router,
    private readonly channelService: ChannelService,
    private readonly streamService: StreamService,
    private readonly alert: AlertService,
    activeRoute: ActivatedRoute) {
    this.channelUuid = activeRoute.snapshot.params['channelId'];

    this.channel$ = this.channelService.fetch(this.channelUuid).pipe(
      take(1),
      map((res) => res.data),
      catchError(_ => this.handleError<Channel>('Could not load channel!', {} as Channel))
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
