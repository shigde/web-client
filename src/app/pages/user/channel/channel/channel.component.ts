import {Component} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';

@Component({
  selector: 'app-channel',
  imports: [],
  templateUrl: './channel.component.html',
  styleUrl: './channel.component.scss'
})
export class ChannelComponent {
  private id: string;

  constructor(private router: Router, activeRoute: ActivatedRoute) {
    this.id = activeRoute.snapshot.params['channelId'];
  }

  editChannel() {
    this.router.navigate(['/channel/' + this.id + '/edit']);
  }
}
