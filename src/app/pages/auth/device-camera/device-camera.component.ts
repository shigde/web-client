import {Location} from '@angular/common';
import {Component, DestroyRef, HostListener, inject, OnDestroy, OnInit} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {ActivatedRoute} from '@angular/router';
import {DeviceService, DeviceSession} from '@shigde/core';
import {finalize} from 'rxjs';

@Component({
  selector: 'app-device-camera',
  standalone: true,
  templateUrl: './device-camera.component.html',
})
export class DeviceCameraComponent implements OnInit, OnDestroy {
  status = 'Open an invitation from the stream host.';
  error = '';
  busy = false;
  protected inviteToken?: string;
  protected session?: DeviceSession;

  private readonly devices = inject(DeviceService);
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    const token = this.route.snapshot.fragment;
    if (token) {
      this.inviteToken = token;
      this.location.replaceState(this.location.path());
      this.status = 'Authorize this device for the stream.';
    }
  }

  authorize(): void {
    if (!this.inviteToken || this.busy) return;
    this.busy = true;
    this.error = '';
    this.devices.redeem(this.inviteToken).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.busy = false),
    ).subscribe({
      next: session => {
        this.inviteToken = undefined;
        this.session = session;
        this.status = `${session.deviceName} is authorized for the stream.`;
      },
      error: response => {
        this.error = response.error?.message || 'Could not authorize this device. Please try again.';
        if (response.status === 401) {
          this.inviteToken = undefined;
          this.status = 'Ask the host for a new invitation.';
        }
      },
    });
  }

  disconnect(): void {
    if (!this.session || this.busy) return;
    this.busy = true;
    this.error = '';
    this.devices.disconnect(this.session.token).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.busy = false),
    ).subscribe({
      next: () => this.clearSession(),
      error: () => this.error = 'Could not end the session. Please try again.',
    });
  }

  ngOnDestroy(): void {
    this.endSessionOnExit();
  }

  @HostListener('window:pagehide')
  endSessionOnExit(): void {
    if (this.session) {
      this.devices.disconnectOnPageExit(this.session.token);
      this.clearSession();
    }
  }

  private clearSession(): void {
    this.session = undefined;
    this.status = 'Device session ended.';
  }
}
