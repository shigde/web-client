import {Component, Input} from '@angular/core';
import {StreamPreview} from '@shigde/core';

@Component({
    selector: 'app-stream-card',
    imports: [],
    templateUrl: './stream-card.component.html',
    styleUrl: './stream-card.component.scss'
})
export class StreamCardComponent {
  @Input() stream!: StreamPreview;
}
