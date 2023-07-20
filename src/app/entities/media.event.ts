export interface MediaEvent {
  type: 'add' | 'remove',
  track: MediaStreamTrack,
  stream?: MediaStream,
  parent?: RTCTrackEvent
}
