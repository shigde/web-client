import {Component, EventEmitter, Input, OnInit, Output, ViewEncapsulation} from '@angular/core';

import {Location} from '@angular/common';
import {filter, tap} from 'rxjs';
import {environment} from '../../environments/environment';

import {
    DeviceSettings,
    DeviceSettingsService,
    LobbyService,
    ParameterService,
    SessionService,
    Stream,
    StreamService
} from '@shig/core';

import {DeviceSettingsCbk} from '../device-settings/device-settings.component';
import {StreamMixer} from '../provider/stream_mixer';


@Component({
    selector: 'shig-lobby',
    templateUrl: './lobby.component.html',
    styleUrls: ['./lobby.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class LobbyComponent implements OnInit {
    cbk: DeviceSettingsCbk;
    displaySettings = false;
    isInLobby = false;

    stream: Stream | undefined;
    mediaStream: MediaStream | undefined;
    hasMediaStreamSet = false;

    private mixer?: StreamMixer;

    private readonly config: RTCConfiguration = {
        iceServers: environment.iceServers
    };

    @Input() token: string | undefined;
    @Input('api-prefix') apiPrefix: string | undefined;
    @Input('stream') streamId: string | undefined;
    @Input('space') spaceId: string | undefined;
    @Input() role: string | null = 'guest';

    @Output() loadComp = new EventEmitter();

    constructor(
        private session: SessionService,
        private devices: DeviceSettingsService,
        private streamService: StreamService,
        private lobbyService: LobbyService,
        private params: ParameterService,
        private location: Location
    ) {
        this.cbk = (settings) => {
            this.startCamera(settings);
        };

    }

    ngOnInit(): void {
        if (this.apiPrefix !== undefined) {
            this.params.API_PREFIX = this.apiPrefix;
        }
        this.session.setAuthenticationToken(this.getToken());
        this.getStream();

//         const mixer = new MultiStreamsMixer([]);
//         mixer.
//
//         var mixer = new MultiStreamsMixer([microphone1, microphone2]);
//
// // record using MediaRecorder API
//         var recorder = new MediaRecorder(mixer.getMixedStream());
//
// // or share using WebRTC
//         rtcPeerConnection.addStream(mixer.getMixedStream());


        // rtcPeerConnection.addStream(mixer.getMixedStream());
// https://github.com/fzembow/rect-scaler
// https://codesandbox.io/s/zoom-video-gallery-600ks?file=/index.html:103-1291
//         mixer.frameInterval = 1;
//         mixer.startDrawingFrames();

        setTimeout(() => {
            this.loadComp.emit('Component loaded successfully!');
        }, 100);

    }

    getStream(): void {
        if (this.streamId !== undefined && this.spaceId !== undefined) {
            this.streamService.getStream(this.streamId, this.spaceId)
                .pipe(tap((stream) => this.stream = stream))
                .subscribe(() => {
                    if (this.role === 'owner') {
                        setTimeout(() => {
                            this.mixer = new StreamMixer('canvasOne');
                            this.mixer.start();
                        }, 0);
                    }

                });
        }
    }

    startCamera(settings: DeviceSettings) {
        this.devices.getUserMedia(settings)
            .then((stream: any) => this.mediaStream = stream)
            .then(() => (document.getElementById('video') as HTMLVideoElement))
            .then((element: any) => {
                    if (this.mediaStream) {
                        element.srcObject = this.mediaStream;
                        this.hasMediaStreamSet = true;
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

    join(): void {
        if (!!this.stream && !!this.mediaStream && this.streamId !== undefined && this.spaceId !== undefined) {
            this.lobbyService.add$.pipe(filter(s => s !== null)).subscribe((s: any) => {
                if (s !== null) {
                    this.getOrCreateVideoElement(s.id).srcObject = s;
                }
            });
            this.lobbyService.remove$.pipe(filter(s => s !== null)).subscribe((s: any) => {
                if (s !== null && this.hasVideoElement(s)) {
                    this.removeVideoElement(s);
                }
            });
            const streams = [this.mediaStream];
            if (!!this.mixer) {
                streams.push(this.mixer.getStream());
            }
            this.lobbyService.join(streams, this.spaceId, this.streamId, this.config).then(() => this.isInLobby = true);
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
        const box = document.createElement('div');
        box.classList.add('lobby-quest-video-box');

        const buttonGroup = document.createElement('div');
        buttonGroup.classList.add('btn-group');
        buttonGroup.classList.add('control-bar');
        const buttonLabal = document.createElement('div');
        buttonGroup.classList.add('btn');
        buttonGroup.classList.add('btn-primary');
        buttonGroup.classList.add('active');
        const checkbox = document.createElement('input');
        checkbox.setAttribute('type', 'checkbox');
        checkbox.checked = false;
        checkbox.id = `checkbox-${id}`;
        checkbox.disabled = true;

        const span = document.createElement('span');
        span.innerText = ' active';
        buttonGroup.appendChild(buttonLabal);
        buttonLabal.appendChild(checkbox);
        buttonLabal.appendChild(span);

        buttonLabal.addEventListener('click', (evt) => {
            this.toggleActive(id, `checkbox-${id}`);
        });

        const video = document.createElement('video');
        video.setAttribute('id', id);
        video.setAttribute('muted', '');
        video.setAttribute('autoplay', '');
        box.appendChild(video);
        box.appendChild(buttonGroup);
        const elem = (document.getElementById('lobby-quest-video') as HTMLDivElement);
        elem.appendChild(box);
        return video;
    }

    removeVideoElement(id: string) {
        document.getElementById(id)?.remove();
    }

    private getToken(): string {
        if (typeof this.token !== 'string') {
            console.error('Invalid token: ', this.token);
        }
        return (this.token === undefined) ? 'unauthorized' : this.token;
    }

    toggleSettings() {
        this.displaySettings = !this.displaySettings;
    }

    toggleActive(videoId: string, checkboxId: string) {
        const isChecked = !(document.getElementById(checkboxId) as HTMLInputElement).checked;
        (document.getElementById(checkboxId) as HTMLInputElement).checked = isChecked;

        if (isChecked) {
            this.mixer?.videoElements.set(videoId, document.getElementById(videoId) as HTMLVideoElement);
        } else {
            this.mixer?.videoElements.delete(videoId);
        }
    }

    start(): void {
        // let stream = this.mixer?.getStream();
        // if (stream) {
        //   const video = document.createElement('video');
        //   video.setAttribute('id', 'test');
        //   video.setAttribute('muted', '');
        //   video.setAttribute('autoplay', '');
        //   document.body.appendChild(video);
        //   video.srcObject = stream;
        // }
    }
}
