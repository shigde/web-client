import {EventEmitter} from '@angular/core';

import {ChannelMsg, ChannelMsgType, SdpMsgData} from '../entities/channel.msg';

export class ChannelMessenger extends EventEmitter<ChannelMsg> {

  constructor(private dc: RTCDataChannel) {
    super();
    dc.onmessage = this.onReceiveChannelMessageCallback.bind(this)
  }

  private onReceiveChannelMessageCallback(me: MessageEvent<any>): void {
    const msg = JSON.parse(new TextDecoder().decode(me.data as ArrayBuffer)) as ChannelMsg
    if (msg?.type === ChannelMsgType.OfferMsg) {
      msg.data = msg.data as SdpMsgData
      this.emit(msg);
    }
  }

  public send(msg: ChannelMsg): void {
    const data = new TextEncoder().encode(JSON.stringify(msg)) as ArrayBuffer
    this.dc.send(data)
  }
}
