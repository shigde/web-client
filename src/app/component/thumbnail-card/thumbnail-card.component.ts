import {Component, Input} from '@angular/core';
import {Stream} from '@shigde/core';

@Component({
    selector: 'app-thumbnail-card',
    imports: [],
    templateUrl: './thumbnail-card.component.html',
    styleUrl: './thumbnail-card.component.scss'
})
export class ThumbnailCardComponent {
  @Input() stream!: Stream;
}
