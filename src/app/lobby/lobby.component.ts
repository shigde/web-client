import {Component, OnInit} from '@angular/core';
import {Location} from '@angular/common';
import {ActivatedRoute} from '@angular/router';
import {StreamService} from '../provider/stream.service';
import {Stream} from '../entities/stream';
import {LobbyService} from '../provider/lobby.service';
import {tap} from 'rxjs';


@Component({
  selector: 'app-lobby',
  templateUrl: './lobby.component.html',
  styleUrls: ['./lobby.component.scss']
})
export class LobbyComponent implements OnInit {
  stream: Stream | undefined;
  mediaStream: MediaStream | undefined;

  constructor(
    private route: ActivatedRoute,
    private streamService: StreamService,
    private lobbyService: LobbyService,
    private location: Location
  ) {
  }

  ngOnInit(): void {
    this.getStream();
  }

  getStream(): void {
    const id = this.route.snapshot.paramMap.get('streamId');
    if (id !== null) {
      this.streamService.getStream(id)
        .pipe(tap((stream) => this.stream = stream))
        .subscribe((_) => this.startCamera());
    }
  }

  startCamera() {
    navigator.mediaDevices
      .getUserMedia({audio: true, video: true})
      .then((stream) => this.mediaStream = stream)
      .then(() => (document.getElementById('video') as HTMLVideoElement))
      .then(element => {
          if (this.mediaStream) {
            element.srcObject = this.mediaStream;
          }
        }
      );
  }

  goBack(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(t => t.stop())
      this.mediaStream = undefined
    }
    this.location.back();
  }

  start(): void {
    if (this.stream) {
      this.lobbyService.join(this.stream)
    }
  }
}
