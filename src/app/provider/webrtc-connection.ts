import {EventEmitter} from '@angular/core';
import {MediaEvent} from '../entities/media.event';



export class WebrtcConnection extends EventEmitter<MediaEvent>{
  private readonly pc: RTCPeerConnection;
  private dataChannel: RTCDataChannel | undefined

  constructor(
    private readonly config: RTCConfiguration
  ) {
    super(true);
    this.pc = new RTCPeerConnection(this.config);
    this.pc.ontrack = (ev) => this.emit({type: 'add', track: ev.track, parent: ev});
    // @TODO Later
    this.pc.onsignalingstatechange = _ => console.log('onsignalingstatechange');
    this.pc.oniceconnectionstatechange = _ => console.log('oniceconnectionstatechange');
    this.pc.onicecandidate = event => this.onicecandidate(event);
    this.pc.onnegotiationneeded = _ => console.log('onnegotiationneeded');
  }

  public createDataChannel() :void {
    this.dataChannel = this.pc.createDataChannel("whep");
  }

  public createOffer(localStream: MediaStream | undefined = undefined): Promise<RTCSessionDescription> {
    localStream?.getTracks().forEach((track) => {
      this.pc.addTrack(track, localStream);
    });

    // @ts-ignore
    return this.pc.createOffer()
      .then((offer) => this.pc.setLocalDescription(offer))
      .then(_ => this.pc.localDescription)
  }

  // Ice Gathering ----------------------------
  private onicecandidate(event: RTCPeerConnectionIceEvent): void {
    if (event.candidate !== null) {
      // send ice to sfu
    } else {
      return;
    }
  }

  public setAnswer(answer: RTCSessionDescription): Promise<void> {
    console.log('Answer:', answer)
    return this.pc.setRemoteDescription(answer)
  }



  public close(): Promise<void> {
    this.pc.ontrack = null;
    this.pc.oniceconnectionstatechange = null;
    this.pc.onconnectionstatechange = null;
    this.pc.onsignalingstatechange = null;
    this.pc.onicecandidate = null;
    this.pc.onnegotiationneeded = null;
    return new Promise<void>((resolve) => {
      this.pc.close();
      resolve();
    });
  }
}
