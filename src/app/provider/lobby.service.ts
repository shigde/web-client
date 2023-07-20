import {Injectable} from '@angular/core';
import {Stream} from '../entities/stream';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {environment} from '../../environments/environment';
import {WebrtcConnection} from './webrtc-connection';
import {catchError, firstValueFrom, lastValueFrom, Observable, of, tap} from 'rxjs';
import {MessageService} from './message.service';

@Injectable({
  providedIn: 'root'
})
export class LobbyService {
  private readonly config: RTCConfiguration = {
    iceServers: environment.iceServers
  }

  httpOptions = {
    headers: new HttpHeaders({'Content-Type': 'application/sdp', 'Accept' : 'application/sdp'}),
    responseType: 'text'
  };

  constructor(private http: HttpClient, private messageService: MessageService) {
  }


  public join(stream: MediaStream | undefined = undefined, spaceId: string, streamId: string): Promise<unknown> {
    let sending = Promise.resolve<unknown>(null)
    if (stream !== undefined) {
      sending = this.createSendingConnection(stream, spaceId, streamId)
    }
    let receiving = this.createReceivingConnection();
    return Promise.all([sending, receiving]);
  }

  private createSendingConnection(stream: MediaStream, spaceId: string, streamId: string): Promise<void> {
    const wc = new WebrtcConnection(this.config)
    return wc.createOffer(stream)
      .then((offer) => this.sendWhip(offer, spaceId, streamId))
      .then((answer) => wc.setAnswer(answer))
  }

  private createReceivingConnection(): Promise<unknown> {
    // const wc = new WebrtcConnection(this.config)
    // return wc.createOffer()
    //   .then((offer) => sendWhep(offer))
    //   .then((answer) => wc.setAnswer(answer))
    return Promise.resolve()
  }


  sendWhip(offer: RTCSessionDescriptionInit, spaceId: string, streamId: string,): Promise<RTCSessionDescription> {
    const whipUrl = `/api/space/${spaceId}/stream/${streamId}/whip`;
    const headers = new HttpHeaders().set('Content-Type', 'text/plain; charset=utf-8');

    const body = offer.sdp
    // @ts-ignore
    return lastValueFrom(this.http.post(whipUrl, body, this.httpOptions).pipe(
      tap(a => console.log('---', a)),
      catchError(this.handleError<string>('sendWhip', ''))
    )
    ).then(answer => ({type: 'answer', sdp: answer} as RTCSessionDescription));
  }

  sendWhep(spaceId: string, stream: Stream) {
    const whepUrl = `/api/space/${spaceId}/stream/${stream.id}/whep`;
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
