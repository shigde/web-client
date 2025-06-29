import {Component, Input, OnInit} from '@angular/core';
import {StreamPreview} from '@shigde/core';
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
export class StreamPreviewCardComponent implements OnInit {

  @Input() stream!: StreamPreview;
  public thumbnail = '';

  ngOnInit(): void {
    this.thumbnail = `${window.location.origin}/static/${this.stream?.thumbnail}`;
  }

}
