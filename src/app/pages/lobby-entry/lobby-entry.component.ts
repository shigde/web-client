import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {SessionService, ShigModule} from '@shigde/core';
import {filter} from 'rxjs';

type Param = { streamId: string, spaceId: string, userToken: string }

@Component({
  selector: 'app-lobby-entry',
  templateUrl: './lobby-entry.component.html',
  styleUrls: ['./lobby-entry.component.scss'],
  imports: [
    ShigModule
  ]
})
export class LobbyEntryComponent implements OnInit {
  // params: Observable<Param> = new BehaviorSubject(null)

  streamId: string;
  spaceId: string;
  userToken: string;
  user: string = 'unknown';
  apiPrifix: string = '/api';


  constructor(
    private route: ActivatedRoute,
    session: SessionService,
  ) {
    const jwt = session.getAuthenticationToken();
    this.userToken = `${jwt}`;
    session.getUserName().subscribe((name) => {
      this.user = name;
    });
    //this.user$ = userName.pipe(map((name: string) => !name? "unknown" : name)) as Observable<string>;
    const streamId = this.route.snapshot.paramMap.get('streamId');
    const spaceId = this.route.snapshot.paramMap.get('spaceId');

    this.streamId = streamId ? streamId : '';
    this.spaceId = spaceId ? spaceId : '';
  }

  ngOnInit(): void {

    // this.streamId = this.route.snapshot.paramMap.get('streamId');
    // this.spaceId = this.route.snapshot.paramMap.get('spaceId');
  }

  protected readonly filter = filter;
}
