import {InboxListComponent} from '../inbox-list/inbox-list.component';
import {Component, HostListener, inject} from '@angular/core';
import {Observable} from 'rxjs';
import {AsyncPipe, NgIf} from '@angular/common';
import {Router, RouterLink} from '@angular/router';
import {map} from 'rxjs/operators';
import {AvatarComponent} from '../avatar/avatar.component';
import {MessageService, NotificationService, SessionService} from '@shigde/core';
import {SidebarComponent} from '../sidebar/sidebar.component';

@Component({
  selector: 'app-header',
  imports: [
    AsyncPipe,
    NgIf,
    SidebarComponent,
    RouterLink,
    InboxListComponent
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  notificationsOpen = false;
  readonly notificationCounts$ = inject(NotificationService).counts$;
  readonly messageCounts$ = inject(MessageService).counts$;
  @HostListener('document:keydown.escape') closeNotifications(): void { this.notificationsOpen = false; }
  @HostListener('document:click') closeOnOutside(): void { this.notificationsOpen = false; }

  public readonly isUserLogin$: Observable<boolean>;

  constructor(session: SessionService, private router: Router) {
    this.isUserLogin$ = session.getUserName().pipe(
      map((name) => name !== 'anonymous')
    );
  }

  newStream() {
    this.router.navigate(['/stream/new']);
  }
}
