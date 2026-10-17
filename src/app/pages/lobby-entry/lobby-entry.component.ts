import '@moq/watch/element';
import '@moq/watch/ui';
import {Component, CUSTOM_ELEMENTS_SCHEMA, HostListener, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {createAppLogger, LobbyComponent, LobbyErrorEvent, SessionService, ShigModule, User} from '@shigde/core';
import {filter, Observable, take} from 'rxjs';
import {map} from "rxjs/operators";
import {AsyncPipe} from "@angular/common";
import {AlertService} from "../../providers/alert.service";
import {AlertKind} from "../../entities/alert";
import {RuntimeConfigService} from "../../providers/runtime-config.service";
import {ConfirmDialogComponent} from '../../component/confirm-dialog/confirm-dialog.component';

type Param = { streamId: string, spaceId: string, userToken: string }

@Component({
  selector: 'app-lobby-entry',
  templateUrl: './lobby-entry.component.html',
  styleUrls: ['./lobby-entry.component.scss'],
  imports: [
    ShigModule,
    AsyncPipe,
    ConfirmDialogComponent
  ],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class LobbyEntryComponent implements OnInit {
  @ViewChild(LobbyComponent) lobby?: LobbyComponent;
  @ViewChild(ConfirmDialogComponent) leaveDialog!: ConfirmDialogComponent;
  readonly relayUrl: string;
  private log = createAppLogger('LobbyEntryComponent');
  // params: Observable<Param> = new BehaviorSubject(null)

  streamUuid: string;
  channelUuid: string;
  userToken: string;
  userUuid$: Observable<string | undefined>;
  apiPrifix: string;


  constructor(
    private route: ActivatedRoute,
    private alert: AlertService,
    private router: Router,
    session: SessionService,
    runtimeConfig: RuntimeConfigService,
  ) {
    const jwt = session.getAuthenticationToken();
    this.userToken = `${jwt}`;
    this.apiPrifix = runtimeConfig.apiPrefix;
    this.relayUrl = runtimeConfig.relayService;

    this.userUuid$ = session.getUser().pipe(
      filter((u): u is User => !!u),
      take(1),
      map((u) => u.uuid)
    );

    //this.user$ = userName.pipe(map((name: string) => !name? "unknown" : name)) as Observable<string>;
    const streamUuid = this.route.snapshot.paramMap.get('streamUuid');
    const channelUuid = this.route.snapshot.paramMap.get('channelUuid');

    this.streamUuid = streamUuid ? streamUuid : '';
    this.channelUuid = channelUuid ? channelUuid : '';
  }

  ngOnInit(): void {

    // this.streamId = this.route.snapshot.paramMap.get('streamId');
    // this.spaceId = this.route.snapshot.paramMap.get('spaceId');
  }

  protected readonly filter = filter;

  get playbackUrl(): string {
    const url = new URL(`${this.relayUrl}/${this.channelUuid}`);
    if (this.userToken && this.userToken !== 'undefined') url.searchParams.set('jwt', this.userToken);
    return url.toString();
  }

  async canLeave(): Promise<boolean> {
    if (!this.lobby?.connectionActive) return true;
    if (!await this.leaveDialog.confirm()) return false;
    await this.lobby.leaveCurrentLobby();
    return true;
  }

  @HostListener('window:beforeunload', ['$event'])
  beforeUnload(event: BeforeUnloadEvent): void {
    if (this.lobby?.connectionActive) {
      event.preventDefault();
      event.returnValue = '';
    }
  }

  protected handleLobbyErrorEvent(event: LobbyErrorEvent) {
    if (event === LobbyErrorEvent.NO_STREAM_PERMISSIONS) {
      this.log.warn('No stream permissions to enter lobby', this.streamUuid);
      this.alert.alert(AlertKind.WARNING, "You have not permissions to enter the Stream Lobby").then(
        ()=>   this.router.navigate([
          '/stream',
          this.streamUuid,
        ])
      );
    } else if (event === LobbyErrorEvent.LOBBY_CONNECTION_EXISTS) {
      this.alert.alert(AlertKind.WARNING, 'You are already connected to this lobby.');
    } else if (event === LobbyErrorEvent.LOBBY_JOIN_FAILED) {
      this.alert.alert(AlertKind.DANGER, 'Could not join the lobby. The connection setup failed.');
    }
  }
}
