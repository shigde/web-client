import {Location} from '@angular/common';
import {HttpErrorResponse} from '@angular/common/http';
import {ChangeDetectorRef, Component, DestroyRef, HostListener, inject, OnDestroy, OnInit} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {ActivatedRoute} from '@angular/router';
import {DeviceConnection, DeviceService, DeviceSession} from '@shigde/core';
import {finalize, lastValueFrom} from 'rxjs';

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
  protected media: MediaStream | null = null;
  protected connected = false;
  protected microphoneMuted = false;
  protected retryAvailable = false;

  private connection?: DeviceConnection;
  private joinTimeout?: ReturnType<typeof setTimeout>;
  private exited = false;

  private readonly devices = inject(DeviceService);
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    const token = this.route.snapshot.fragment;
    if (token) {
      this.inviteToken = token;
      this.location.replaceState(this.location.path());
      void this.connect();
    }
  }

  protected async connect(): Promise<void> {
    if (this.exited || this.busy || this.connection || (!this.inviteToken && !this.session)) return;
    this.busy = true;
    this.error = '';
    this.retryAvailable = false;

    try {
      if (this.inviteToken) {
        this.status = 'Checking your invitation…';
        const session = await lastValueFrom(this.devices.redeem(this.inviteToken)
          .pipe(takeUntilDestroyed(this.destroyRef)));
        this.inviteToken = undefined;
        if (this.exited) {
          this.devices.disconnectOnPageExit(session.token);
          return;
        }
        this.session = session;
      }
      const session = this.session;
      if (!session) return;
      this.status = 'Requesting camera and microphone access…';
      this.cdr.markForCheck();
      const media = await navigator.mediaDevices.getUserMedia({video: true, audio: true});
      if (this.session !== session) {
        media.getTracks().forEach(track => track.stop());
        return;
      }
      this.media = media;
      this.status = 'Connecting to the lobby…';
      this.cdr.markForCheck();
      const connection = new DeviceConnection(() => {
        if (this.connection !== connection) return;
        clearTimeout(this.joinTimeout);
        this.connected = true;
        this.status = `${session.deviceName} is sending to the lobby.`;
        this.cdr.markForCheck();
      }, () => {
        if (this.connection !== connection) return;
        this.endSessionOnExit();
        this.status = 'Camera disconnected. Ask the host for a new invitation.';
        this.cdr.markForCheck();
      });
      this.connection = connection;
      const offer = await connection.offer(media, session.deviceName);
      if (this.connection !== connection) return;
      const answer = await lastValueFrom(this.devices.publish(session.token, offer)
        .pipe(takeUntilDestroyed(this.destroyRef)));
      if (this.connection !== connection) return;
      this.joinTimeout = setTimeout(() => {
        this.stopCamera();
        this.status = 'Could not connect to the lobby.';
        this.error = 'The media connection timed out.';
        this.retryAvailable = true;
        this.cdr.markForCheck();
      }, 30_000);
      await connection.answer(answer);
    } catch (error) {
      if (this.exited) return;
      this.stopCamera();
      if (error instanceof HttpErrorResponse && error.status === 401) {
        this.inviteToken = undefined;
        this.clearSession();
        this.status = 'This invitation or device session is no longer valid. Ask the host for a new invitation.';
      } else {
        this.status = this.session ? 'Could not connect to the lobby.' : 'Could not check the invitation.';
        this.error = !this.session ? 'Check your connection and try again.'
          : error instanceof HttpErrorResponse && error.status === 409
          ? 'Could not join. Make sure the host is in the lobby, then try again.'
          : 'Could not connect the camera. Check camera and microphone permissions, then try again.';
        this.retryAvailable = true;
      }
    } finally {
      this.busy = false;
      if (!this.destroyRef.destroyed) this.cdr.markForCheck();
    }
  }

  toggleMicrophone(): void {
    const track = this.media?.getAudioTracks()[0];
    if (!track || !this.connection || !this.connected) return;
    this.microphoneMuted = !this.microphoneMuted;
    this.connection.mute(track, this.microphoneMuted);
  }

  disconnect(): void {
    if (!this.session || this.busy) return;
    this.busy = true;
    this.error = '';
    this.retryAvailable = false;
    this.stopCamera();
    this.status = 'Ending device session…';
    this.devices.disconnect(this.session.token).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.busy = false),
    ).subscribe({
      next: () => this.clearSession(),
      error: () => {
        this.status = 'Camera stopped.';
        this.error = 'Could not end the session. Please try again.';
      },
    });
  }

  ngOnDestroy(): void {
    this.endSessionOnExit();
  }

  @HostListener('window:pagehide')
  endSessionOnExit(): void {
    this.exited = true;
    if (this.session) {
      this.devices.disconnectOnPageExit(this.session.token);
      this.clearSession();
    }
  }

  private clearSession(): void {
    this.stopCamera();
    this.session = undefined;
    this.retryAvailable = false;
    this.status = 'Device session ended.';
  }

  private stopCamera(): void {
    clearTimeout(this.joinTimeout);
    const connection = this.connection;
    this.connection = undefined;
    connection?.close();
    this.media?.getTracks().forEach(track => track.stop());
    this.media = null;
    this.connected = false;
    this.microphoneMuted = false;
  }
}
