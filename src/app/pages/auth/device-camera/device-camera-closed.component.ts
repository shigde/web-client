import {Location} from '@angular/common';
import {Component, inject} from '@angular/core';

@Component({
  selector: 'app-device-camera-closed',
  standalone: true,
  template: `
    <section class="min-vh-100 d-flex align-items-start justify-content-center bg-body-secondary px-3 py-5">
      <div class="card shadow w-100" style="max-width: 32rem">
        <div class="card-body p-4">
          <h1 class="fw-bold mb-3 fs-2">Camera closed</h1>
          <p class="mb-0">Thanks for using Shig Camera. You can close this page.</p>
          @if (unconfirmed) {
            <p class="text-body-secondary mt-2 mb-0">The server did not confirm the end of the session.</p>
          }
        </div>
      </div>
    </section>
  `,
})
export class DeviceCameraClosedComponent {
  protected readonly unconfirmed =
    (inject(Location).getState() as {unconfirmed?: boolean} | null)?.unconfirmed === true;
}
