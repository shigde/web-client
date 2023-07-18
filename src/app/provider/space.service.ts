import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {MessageService} from './message.service';
import {catchError, map, Observable, of, tap} from 'rxjs';
import {Space} from '../entities/space';

@Injectable({providedIn: 'root'})
export class SpaceService {
  private spacesUrl = 'api';  // URL to web api

  httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  };

  constructor(
    private http: HttpClient,
    private messageService: MessageService) { }

  /** GET Spaces from the server */
  getSpaces(): Observable<Space[]> {
    return this.http.get<Space[]>(this.spacesUrl + '/spaces')
      .pipe(
        tap(_ => this.log('fetched spaces')),
        catchError(this.handleError<Space[]>('getSpaces', []))
      );
  }

  /** GET space by id. Return `undefined` when id not found */
  getSpaceNo404<Data>(id: string): Observable<Space> {
    const url = `${this.spacesUrl}/?id=${id}`;
    return this.http.get<Space[]>(url)
      .pipe(
        map(spaces => spaces[0]), // returns a {0|1} element array
        tap(h => {
          const outcome = h ? 'fetched' : 'did not find';
          this.log(`${outcome} space id=${id}`);
        }),
        catchError(this.handleError<Space>(`getSpace id=${id}`))
      );
  }

  /** GET space by id. Will 404 if id not found */
  getSpace(id: string): Observable<Space> {
    const url = `${this.spacesUrl}/${id}`;
    return this.http.get<Space>(url).pipe(
      tap(_ => this.log(`fetched space id=${id}`)),
      catchError(this.handleError<Space>(`getSpace id=${id}`))
    );
  }

  /* GET spacees whose name contains search term */
  searchSpaces(term: string): Observable<Space[]> {
    if (!term.trim()) {
      // if not search term, return empty space array.
      return of([]);
    }
    return this.http.get<Space[]>(`${this.spacesUrl}/?name=${term}`).pipe(
      tap(x => x.length ?
        this.log(`found spaces matching "${term}"`) :
        this.log(`no spaces matching "${term}"`)),
      catchError(this.handleError<Space[]>('searchSpaces', []))
    );
  }

  //////// Save methods //////////

  /** POST: add a new space to the server */
  addSpace(space: Space): Observable<Space> {
    return this.http.post<Space>(this.spacesUrl, space, this.httpOptions).pipe(
      tap((newSpace: Space) => this.log(`added space w/ id=${newSpace.id}`)),
      catchError(this.handleError<Space>('addSpace'))
    );
  }

  /** DELETE: delete the space from the server */
  deleteSpace(id: string): Observable<Space> {
    const url = `${this.spacesUrl}/${id}`;

    return this.http.delete<Space>(url, this.httpOptions).pipe(
      tap(_ => this.log(`deleted space id=${id}`)),
      catchError(this.handleError<Space>('deleteSpace'))
    );
  }

  /** PUT: update the space on the server */
  updateSpace(space: Space): Observable<any> {
    return this.http.put(this.spacesUrl, space, this.httpOptions).pipe(
      tap(_ => this.log(`updated space id=${space.id}`)),
      catchError(this.handleError<any>('updateSpace'))
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

  /** Log a SpaceService message with the MessageService */
  private log(message: string) {
    this.messageService.add(`SpaceService: ${message}`);
  }
}
