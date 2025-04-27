import {Component, Input} from '@angular/core';
import {StreamPreview} from '@shigde/core';
import {AvatarComponent} from '../avatar/avatar.component';

@Component({
  selector: 'app-stream-preview-card',
  imports: [
    AvatarComponent
  ],
  templateUrl: './stream-preview-card.component.html',
  styleUrl: './stream-preview-card.component.scss'
})
export class StreamPreviewCardComponent {
  @Input() stream!: StreamPreview;
}
