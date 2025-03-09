import { Component } from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {
  NgbDatepickerModule,
  NgbDropdownModule,
  NgbTimepicker
} from '@ng-bootstrap/ng-bootstrap';
import {FormsModule} from '@angular/forms';
import { JsonPipe } from '@angular/common';

@Component({
  selector: 'app-edit-stream',
  standalone: true,
  imports: [
    NgbTimepicker,
    FormsModule,
    NgbDropdownModule,
    NgbDatepickerModule
  ],
  templateUrl: './edit-stream.component.html',
  styleUrl: './edit-stream.component.scss'
})
export class EditStreamComponent {
  private id: string;
  time = { hour: 13, minute: 30 };
  hours = 1;
  minutes=  1 ;

  constructor(private router: Router, activeRoute: ActivatedRoute) {
    this.id = activeRoute.snapshot.params['channelId'];
  }

  goToChannel() {
    this.router.navigate(['/channel/1234']);
  }
}
