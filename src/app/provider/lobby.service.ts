import { Injectable } from '@angular/core';
import {Stream} from '../entities/stream';
import {HttpHeaders} from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class LobbyService {

  private whipUrl = 'api/space/';  // URL to web api
  private whepUrl = 'api/space/123/stream';  // URL to web api

  httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/sdp' })
  };

  constructor() { }

  join(stream: Stream) {

  }
}
