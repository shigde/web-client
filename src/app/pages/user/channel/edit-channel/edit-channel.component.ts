import {Component} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';

@Component({
  selector: 'app-edit-channel',
  imports: [],
  templateUrl: './edit-channel.component.html',
  styleUrl: './edit-channel.component.scss'
})
export class EditChannelComponent {
  private id: string;

  constructor(private router: Router, activeRoute: ActivatedRoute) {
    this.id = activeRoute.snapshot.params['channelId'];
  }

  goToChannel() {
    this.router.navigate(['/channel/' + this.id]);
  }

}
