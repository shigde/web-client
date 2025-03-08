import { Component } from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';

@Component({
  selector: 'app-edit-stream',
  imports: [],
  templateUrl: './edit-stream.component.html',
  styleUrl: './edit-stream.component.scss'
})
export class EditStreamComponent {
  private id: string;

  constructor(private router: Router, activeRoute: ActivatedRoute) {
    this.id = activeRoute.snapshot.params['channelId'];
  }

  goToChannel() {
    this.router.navigate(['/channel/1234']);
  }
}
