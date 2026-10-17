import {ChangeDetectorRef, Component, DestroyRef, Input, OnChanges} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {RelayService, StreamPreview} from '@shigde/core';
import {Subscription} from 'rxjs';
import {AvatarComponent} from '../avatar/avatar.component';
import {DatePipe, NgOptimizedImage} from '@angular/common';

@Component({
  selector: 'app-stream-preview-card',
  imports: [
    AvatarComponent,
    DatePipe,
    NgOptimizedImage
  ],
  templateUrl: './stream-preview-card.component.html',
  styleUrl: './stream-preview-card.component.scss'
})
export class StreamPreviewCardComponent implements OnChanges {

  @Input() stream!: StreamPreview;
  public thumbnail = '';
  public isLive = false;
  private statusSubscription?: Subscription;

  constructor(private relay: RelayService, private destroyRef: DestroyRef, private cdr: ChangeDetectorRef) {}

  ngOnChanges(): void {
    this.statusSubscription?.unsubscribe();
    this.thumbnail = `${window.location.origin}/static/${this.stream?.thumbnail}`;
    this.isLive = this.stream?.isLive ?? false;
    if (this.stream) {
      this.statusSubscription = this.relay.pollHasAnnouncement(this.stream.channelUuid, this.stream.uuid)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(live => {
          this.isLive = live;
          this.cdr.markForCheck();
        });
    }
  }

}
