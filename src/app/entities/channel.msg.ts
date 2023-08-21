export interface ChannelMsg {
  id: number
  type: ChannelMsgType
  data: any
}

export enum ChannelMsgType {
  OfferMsg = 1,
  AnswerMsg
}

export interface SdpMsgData {
  number: number
  sdp: RTCSessionDescription
}
