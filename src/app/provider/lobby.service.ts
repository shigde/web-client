import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {environment} from '../../environments/environment';
import {WebrtcConnection} from './webrtc-connection';
import {BehaviorSubject, catchError, lastValueFrom, Observable, of, tap} from 'rxjs';
import {MessageService} from './message.service';
import {ChannelMessenger} from './channel-messenger';
import {ChannelMsg, ChannelMsgType, SdpMsgData} from '../entities/channel.msg';

@Injectable({
  providedIn: 'root'
})
export class LobbyService {
  public add$ = new BehaviorSubject<MediaStream | null>(null)
  public remove$ = new BehaviorSubject<string | null>(null);
  private streamList = new Map<string, MediaStream>();

  private readonly config: RTCConfiguration = {
    iceServers: environment.iceServers
  }

  httpOptions = {
    headers: new HttpHeaders({'Content-Type': 'application/sdp', 'Accept': 'application/sdp'}),
    responseType: 'text'
  };

  constructor(private http: HttpClient, private messageService: MessageService) {
  }

  public join(stream: MediaStream, spaceId: string, streamId: string): Promise<unknown> {
    return this.createSendingConnection(stream, spaceId, streamId)
      .then((messenger) => this.createReceivingConnection(messenger, spaceId, streamId))
  }


  private createSendingConnection(stream: MediaStream, spaceId: string, streamId: string): Promise<ChannelMessenger> {
    const wc = new WebrtcConnection(this.config)
    const messenger = new ChannelMessenger(wc.createDataChannel())
    return wc.createOffer(stream)
      .then((offer) => this.sendWhip(offer, spaceId, streamId))
      .then((answer) => wc.setAnswer(answer))
      .then(() => messenger)
  }

  private createReceivingConnection(messenger: ChannelMessenger, spaceId: string, streamId: string): Promise<unknown> {
    const wc = new WebrtcConnection(this.config);

    messenger.subscribe((msg) => {
      if (msg.type === ChannelMsgType.OfferMsg) {
        wc.setRemoteOffer(msg.data.sdp)
          .then((answer) => ({
            type: ChannelMsgType.AnswerMsg,
            id: msg.id,
            data: {sdp: answer, number: msg.data.number} as SdpMsgData
          }) as ChannelMsg)
          .then((answer) => messenger.send(answer))
      }
    })

    wc.subscribe((event) => {
      if (event.type === 'add') {
        let stream = event.parent?.streams[0];
        if (!stream) {
          return
        }
        stream.addEventListener('removetrack', () => {
          console.log("################# Hallo?")
          if (stream?.getTracks().length === 0) {
            this.remove$.next(stream?.id)
          }
        })

        this.add$.next(stream);
      }
    });

    return this.sendWhepOfferReq(spaceId, streamId)
      .then((offer) => wc.setRemoteOffer(offer))
      .then((answer) => this.sendWhepAnswer(answer, spaceId, streamId))
  }


  sendWhip(offer: RTCSessionDescriptionInit, spaceId: string, streamId: string): Promise<RTCSessionDescription> {
    const whipUrl = `/api/space/${spaceId}/stream/${streamId}/whip`;

    const body = offer.sdp
    // @ts-ignore
    return lastValueFrom(this.http.post(whipUrl, body, this.httpOptions).pipe(
        tap(a => console.log('---', a)),
        catchError(this.handleError<string>('sendWhip', ''))
      )
    ).then(answer => ({type: 'answer', sdp: answer} as RTCSessionDescription));
  }

  sendWhepOfferReq(spaceId: string, streamId: string) {
    const whepUrl = `/api/space/${spaceId}/stream/${streamId}/whep`;

    // @ts-ignore
    return lastValueFrom(this.http.post(whepUrl, null, this.httpOptions).pipe(
        tap(a => console.log('---', a)),
        catchError(this.handleError<string>('sendWhepOfferReq', ''))
      )
    ).then(offer => ({type: 'offer', sdp: offer} as RTCSessionDescription));
  }

  sendWhepAnswer(answer: RTCSessionDescriptionInit, spaceId: string, streamId: string) {
    const whepUrl = `/api/space/${spaceId}/stream/${streamId}/whep`;
    const body = answer.sdp

    // @ts-ignore
    return lastValueFrom(this.http.patch(whepUrl, body, this.httpOptions).pipe(
        tap(a => console.log('---', a)),
        catchError(this.handleError<string>('sendWhepAnswer', ''))
      )
    );
  }

  /**
   * Handle Http operation that failed.
   * Let the app continue.
   *
   * @param operation - name of the operation that failed
   * @param result - optional value to return as the observable result
   */
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {

      // TODO: send the error to remote logging infrastructure
      console.error(error); // log to console instead

      // TODO: better job of transforming error for user consumption
      this.log(`${operation} failed: ${error.message}`);

      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }

  /** Log a LobbyService message with the MessageService */
  private log(message: string) {
    this.messageService.add(`LobbyService: ${message}`);
  }
}
