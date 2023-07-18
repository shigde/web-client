import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {MessageService} from './message.service';
import {catchError, map, Observable, of, tap} from 'rxjs';
import {Stream} from '../entities/stream';

@Injectable({providedIn: 'root'})
export class StreamService {
  private streamsUrl = 'api/space/';  // URL to web api

  httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  };

  constructor(
    private http: HttpClient,
    private messageService: MessageService) { }

  /** GET Streams from the server */
  getStreams(spaceId: string ): Observable<Stream[]> {
    return this.http.get<Stream[]>(this.streamsUrl + spaceId + '/streams')
      .pipe(
        tap(_ => this.log('fetched streams')),
        catchError(this.handleError<Stream[]>('getStreams', []))
      );
  }

  /** GET stream by id. Return `undefined` when id not found */
  getStreamNo404<Data>(id: number): Observable<Stream> {
    const url = `${this.streamsUrl}/?id=${id}`;
    return this.http.get<Stream[]>(url)
      .pipe(
        map(streams => streams[0]), // returns a {0|1} element array
        tap(h => {
          const outcome = h ? 'fetched' : 'did not find';
          this.log(`${outcome} stream id=${id}`);
        }),
        catchError(this.handleError<Stream>(`getStream id=${id}`))
      );
  }

  /** GET stream by id. Will 404 if id not found */
  getStream(id: number): Observable<Stream> {
    const url = `${this.streamsUrl}/${id}`;
    return this.http.get<Stream>(url).pipe(
      tap(_ => this.log(`fetched stream id=${id}`)),
      catchError(this.handleError<Stream>(`getStream id=${id}`))
    );
  }

  /* GET streames whose name contains search term */
  searchStreams(term: string): Observable<Stream[]> {
    if (!term.trim()) {
      // if not search term, return empty stream array.
      return of([]);
    }
    return this.http.get<Stream[]>(`${this.streamsUrl}/?name=${term}`).pipe(
      tap(x => x.length ?
        this.log(`found streams matching "${term}"`) :
        this.log(`no streams matching "${term}"`)),
      catchError(this.handleError<Stream[]>('searchStreams', []))
    );
  }

  //////// Save methods //////////

  /** POST: add a new stream to the server */
  addStream(stream: Stream): Observable<Stream> {
    return this.http.post<Stream>(this.streamsUrl, stream, this.httpOptions).pipe(
      tap((newStream: Stream) => this.log(`added stream w/ id=${newStream.id}`)),
      catchError(this.handleError<Stream>('addStream'))
    );
  }

  /** DELETE: delete the stream from the server */
  deleteStream(id: number): Observable<Stream> {
    const url = `${this.streamsUrl}/${id}`;

    return this.http.delete<Stream>(url, this.httpOptions).pipe(
      tap(_ => this.log(`deleted stream id=${id}`)),
      catchError(this.handleError<Stream>('deleteStream'))
    );
  }

  /** PUT: update the stream on the server */
  updateStream(stream: Stream): Observable<any> {
    return this.http.put(this.streamsUrl, stream, this.httpOptions).pipe(
      tap(_ => this.log(`updated stream id=${stream.id}`)),
      catchError(this.handleError<any>('updateStream'))
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

  /** Log a StreamService message with the MessageService */
  private log(message: string) {
    this.messageService.add(`StreamService: ${message}`);
  }


}
