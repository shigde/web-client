import {Component, OnInit, inject} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {UserService} from '@shigde/core';

type Mode = 'request' | 'open' | 'locked';

@Component({
  selector: 'app-admin-streaming-settings',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './streaming-settings.component.html'
})
export class StreamingSettingsComponent implements OnInit {
  private readonly service = inject(UserService);
  mode: Mode = 'request';
  loading = true;
  saving = false;
  error = '';
  message = '';

  ngOnInit(): void {
    this.service.getStreamingPolicy().subscribe({
      next: policy => { this.mode = policy.mode; this.loading = false; },
      error: () => { this.error = 'Streaming policy could not be loaded.'; this.loading = false; }
    });
  }

  save(): void {
    if (this.saving) return;
    const warning = this.mode === 'locked'
      ? 'Hard reset: all non-admin live streams will stop, public streams and recordings will be unpublished, and individual approvals will be cleared. Continue?'
      : this.mode === 'open'
        ? 'Open streaming: every channel may publish without approval, except channels explicitly blocked. Continue?'
        : 'Request approval: channels without an individual approval will need to ask before publishing. Continue?';
    if (!confirm(warning)) return;
    this.saving = true; this.error = ''; this.message = '';
    this.service.setStreamingPolicy(this.mode).subscribe({
      next: () => { this.message = 'Streaming policy saved.'; this.saving = false; },
      error: () => { this.error = 'Streaming policy could not be saved.'; this.saving = false; }
    });
  }
}
