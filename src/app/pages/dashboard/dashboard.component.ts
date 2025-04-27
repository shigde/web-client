import {Component, OnInit} from '@angular/core';
import {Stream, StreamPreview, StreamService} from '@shigde/core';
import {catchError, map, Observable, of, take} from 'rxjs';
import {v4 as uuidv4} from 'uuid';
import {AlertKind} from '../../entities/alert';
import {AlertService} from '../../providers/alert.service';


@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  standalone: false
})
export class DashboardComponent implements OnInit {
  streams$: Observable<StreamPreview[]> = of([]);

  constructor(
    private readonly streamService: StreamService,
    private readonly alert: AlertService,
  ) {
  }

  ngOnInit(): void {
    this.streams$ = this.getStreams();
  }

  getStreams(): Observable<StreamPreview[]> {
    return this.streamService.getPublicStreams()
      .pipe(
        take(1),
        map((resp) => resp.data),
        catchError(_ => this.handleError()),
      );
  }

  private handleError(): Observable<StreamPreview[]> {
    this.alert.alert(AlertKind.DANGER, 'Could not load public streams!');
    return of([]);
  }
}
