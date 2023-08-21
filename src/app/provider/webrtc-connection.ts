import {EventEmitter} from '@angular/core';
import {MediaEvent} from '../entities/media.event';
import {ChannelMsg, ChannelMsgType} from '../entities/channel.msg';


export class WebrtcConnection extends EventEmitter<MediaEvent> {
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
    this.pc.ondatachannel = (event) => {
      console.log('Receive Channel Callback');
      this.dataChannel = event.channel;
      this.dataChannel.onmessage = this.onReceiveChannelMessageCallback;
      this.dataChannel.onopen = this.onReceiveChannelStateChange;
      this.dataChannel.onclose = this.onReceiveChannelStateChange;
    }
  }

  public createDataChannel(): RTCDataChannel {
    this.dataChannel = this.pc.createDataChannel('whep');
    this.dataChannel.onmessage = this.onReceiveChannelMessageCallback;
    this.dataChannel.onopen = this.onReceiveChannelStateChange;
    this.dataChannel.onclose = this.onReceiveChannelStateChange;
    return this.dataChannel;
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

  setRemoteOffer(offer: RTCSessionDescription) {
    let aw: RTCSessionDescriptionInit
    return this.pc.setRemoteDescription(offer)
      .then(() => this.pc.createAnswer())
      .then((answer) => aw = answer)
      .then((_) => this.pc.setLocalDescription(aw))
      .then(() => aw)
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

  private onReceiveChannelMessageCallback(me: MessageEvent<any>): void {
    const msg = JSON.parse(new TextDecoder().decode(me.data as ArrayBuffer)) as ChannelMsg
    if (msg?.type === ChannelMsgType.OfferMsg) {

    }
  }

  private onReceiveChannelStateChange(ev: Event): void {
    console.log('onReceiveChannelStateChange', ev)
  }
}
