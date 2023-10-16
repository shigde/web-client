import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {SessionService} from '@shig/core';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';

type Param = { streamId: string, spaceId: string, userToken: string }

@Component({
  selector: 'app-lobby-entry',
  templateUrl: './lobby-entry.component.html',
  styleUrls: ['./lobby-entry.component.scss']
})
export class LobbyEntryComponent implements OnInit {
  // params: Observable<Param> = new BehaviorSubject(null)

  streamId: string;
  spaceId: string;
  userToken: string;
  role$: Observable<string>;

  constructor(
    private route: ActivatedRoute,
    session: SessionService,
  ) {
    this.userToken = session.getToken();
    this.role$ = session.getUserName().pipe(map((name: string) => name === "Owner"? "owner" : "guest"));
    const streamId = this.route.snapshot.paramMap.get('streamId');
    const spaceId = this.route.snapshot.paramMap.get('spaceId');

    this.streamId = streamId ? streamId : '';
    this.spaceId = spaceId ? spaceId : '';
  }

  ngOnInit(): void {

    // this.streamId = this.route.snapshot.paramMap.get('streamId');
    // this.spaceId = this.route.snapshot.paramMap.get('spaceId');
  }
}
