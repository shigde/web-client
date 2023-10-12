import {Component, OnInit} from '@angular/core';
import {Location} from '@angular/common';
import {ActivatedRoute} from '@angular/router';
import {Stream, StreamService, LobbyService} from '@shig/core';
import {filter, tap} from 'rxjs';


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
      // this.streamService.getStream(id)
      //   .pipe(tap((stream) => this.stream = stream))
      //   .subscribe((_) => this.startCamera());
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
      this.mediaStream.getTracks().forEach(t => t.stop());
      this.mediaStream = undefined;
    }
    this.location.back();
  }

  start(): void {
    if (!!this.stream && !!this.mediaStream) {
      this.lobbyService.add$.pipe(filter(s => s !== null)).subscribe((s) => {
        if (s !== null) {
          this.getOrCreateVideoElement(s.id).srcObject = s;
        }
      });
      this.lobbyService.remove$.pipe(filter(s => s !== null)).subscribe((s) => {
        if (s !== null && this.hasVideoElement(s)) {
          this.removeVideoElement(s);
        }
      });
      // this.lobbyService.join(this.mediaStream, '123', `${this.stream.id}`, environment.iceServers).then(() => console.log('Connected'));
    }
  }

  hasVideoElement(id: string): boolean {
    return document.getElementById(id) !== null;
  }

  getOrCreateVideoElement(id: string): HTMLVideoElement {
    if (this.hasVideoElement(id)) {
      return document.getElementById(id) as HTMLVideoElement;
    }
    return this.createVideoElement(id);
  }

  createVideoElement(id: string): HTMLVideoElement {
    const video = document.createElement('video');
    video.setAttribute('id', id);
    video.setAttribute('muted', '');
    video.setAttribute('autoplay', '');
    const elem = (document.getElementById('remote-video-container') as HTMLDivElement);
    elem.appendChild(video);
    return video;
  }

  removeVideoElement(id: string) {
    document.getElementById(id)?.remove();
  }
}
