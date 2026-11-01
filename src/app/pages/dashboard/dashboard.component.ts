import {Component, OnInit} from '@angular/core';
import {RecordedVideoPreview, StreamPreview, StreamService, VideoService} from '@shigde/core';
import {catchError, map, Observable, of, take, tap} from 'rxjs';
import {AlertKind} from '../../entities/alert';
import {AlertService} from '../../providers/alert.service';


@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  standalone: false
})
export class DashboardComponent implements OnInit {
  streams: StreamPreview[] = [];
  hasStreams: boolean = false;
  videos: RecordedVideoPreview[] = [];
  streamsLoaded = false;
  videosLoaded = false;

  constructor(
    private readonly streamService: StreamService,
    private readonly alert: AlertService,
    private readonly videoService: VideoService,
  ) {
  }

  ngOnInit(): void {
    this.getStreams().subscribe(() => this.streamsLoaded = true);
    this.videoService.getPreviewList().pipe(
      take(1),
      catchError(() => {
        this.alert.alert(AlertKind.DANGER, 'Could not load replays!');
        return of([]);
      }),
    ).subscribe(videos => {
      this.videos = videos;
      this.videosLoaded = true;
    });
  }

  getStreams(): Observable<StreamPreview[]> {
    return this.streamService.getStreamPreviewList()
      .pipe(
        take(1),
        map((resp) => resp.data.filter(stream => stream.type !== 'video')),
        tap((streams) => this.hasStreams = streams.length > 0),
        tap((streams) => this.streams = streams),
        catchError(_ => this.handleError()),
      );
  }

  private handleError(): Observable<StreamPreview[]> {
    this.alert.alert(AlertKind.DANGER, 'Could not load public streams!');
    return of([]);
  }
}
