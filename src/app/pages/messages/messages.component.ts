import {Component} from '@angular/core';
import {InboxListComponent} from '../../component/inbox-list/inbox-list.component';
@Component({selector: 'app-messages', imports: [InboxListComponent], template: `<div class="container px-4 py-5"><h2 class="border-bottom pb-3">Messages</h2><p>Stream invitations and other account messages.</p><app-inbox-list kind="messages" /></div>`})
export class MessagesComponent {}
