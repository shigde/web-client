import {Component, OnInit, inject} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {RouterLink} from '@angular/router';
import {UserService} from '@shigde/core';

type Mode = 'request' | 'open' | 'locked';

@Component({
  selector: 'app-admin-streaming-settings',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './streaming-settings.component.html'
})
export class StreamingSettingsComponent implements OnInit {
  private readonly service = inject(UserService);
  mode: Mode = 'request';
  publicContentEnabled = true;
  loading = true;
  saving = false;
  error = '';
  message = '';

  ngOnInit(): void {
    this.service.getStreamingPolicy().subscribe({
      next: policy => { this.mode = policy.mode; this.publicContentEnabled = policy.publicContentEnabled; this.loading = false; },
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

  savePublicContent(): void {
    if (this.saving) return;
    if (!this.publicContentEnabled && !confirm('Disable public access? All streams and replays will become private. Published replays will stay published and remain visible to logged-in users. Re-enabling public access will leave existing content private. The web dashboard will require login. Continue?')) return;
    this.saving = true; this.error = ''; this.message = '';
    this.service.setPublicContentEnabled(this.publicContentEnabled).subscribe({
      next: () => { this.message = this.publicContentEnabled ? 'Public access enabled. Existing content remains private; new streams can be public.' : 'Public access disabled. Streams and replays are private; published replays remain published for logged-in users. The dashboard requires login.'; this.saving = false; },
      error: () => { this.error = 'Public access setting could not be saved.'; this.saving = false; }
    });
  }
}
