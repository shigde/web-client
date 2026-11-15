import {Location} from '@angular/common';
import {HttpErrorResponse} from '@angular/common/http';
import {ChangeDetectorRef, Component, DestroyRef, HostListener, inject, OnDestroy, OnInit} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {ActivatedRoute} from '@angular/router';
import {DeviceConnection, DeviceService, DeviceSession} from '@shigde/core';
import {lastValueFrom, timeout} from 'rxjs';

type CameraFacing = 'environment' | 'user';

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
  protected cameraFacing: CameraFacing = 'environment';
  protected switchingCamera = false;
  protected retryAvailable = false;
  protected closed = false;

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
      const media = await navigator.mediaDevices.getUserMedia({
        video: {facingMode: {ideal: 'environment'}},
        audio: true,
      });
      if (this.session !== session) {
        media.getTracks().forEach(track => track.stop());
        return;
      }
      this.media = media;
      this.cameraFacing = media.getVideoTracks()[0]?.getSettings().facingMode === 'user' ? 'user' : 'environment';
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
        this.status = 'The connection to the lobby ended. You can close this page.';
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

  protected async switchCamera(facing: CameraFacing): Promise<void> {
    const {connection, media} = this;
    const previousTrack = media?.getVideoTracks()[0];
    if (!connection || !media || !previousTrack || !this.connected || this.switchingCamera) return;
    if (facing === this.cameraFacing && previousTrack.readyState === 'live') return;

    this.switchingCamera = true;
    this.error = '';
    const previousDevice = previousTrack.getSettings().deviceId;
    // Some phones can only open one camera at a time. Keep the microphone running.
    previousTrack.stop();
    try {
      await this.replaceCamera(connection, media, {facingMode: {exact: facing}}, facing);
    } catch {
      if (this.connection !== connection) return;
      try {
        const constraints = previousDevice ? {deviceId: {exact: previousDevice}} : {facingMode: {ideal: this.cameraFacing}};
        await this.replaceCamera(connection, media, constraints, this.cameraFacing);
        if (this.connection === connection) this.error = 'Could not switch cameras. The previous camera was restored.';
      } catch {
        if (this.connection === connection) this.error = 'Could not open the camera. Select a camera to try again.';
      }
    } finally {
      this.switchingCamera = false;
      if (!this.destroyRef.destroyed) this.cdr.markForCheck();
    }
  }

  private async replaceCamera(
    connection: DeviceConnection, media: MediaStream, constraints: MediaTrackConstraints, facing: CameraFacing,
  ): Promise<void> {
    const camera = await navigator.mediaDevices.getUserMedia({video: constraints, audio: false});
    let adopted = false;
    try {
      if (this.connection !== connection) return;
      const video = camera.getVideoTracks()[0];
      if (!video) throw new Error('No camera track was returned.');
      const replacement = new MediaStream([video, ...media.getAudioTracks()]);
      await connection.replaceStream(replacement);
      if (this.connection !== connection) return;
      this.media = replacement;
      const actualFacing = video.getSettings().facingMode;
      this.cameraFacing = actualFacing === 'user' || actualFacing === 'environment' ? actualFacing : facing;
      adopted = true;
    } finally {
      if (!adopted) camera.getTracks().forEach(track => track.stop());
    }
  }

  toggleMicrophone(): void {
    const track = this.media?.getAudioTracks()[0];
    if (!track || !this.connection || !this.connected) return;
    this.error = '';
    try {
      this.connection.mute(track, track.enabled);
    } catch {
      this.error = 'The microphone changed locally, but the lobby could not be notified.';
    } finally {
      this.microphoneMuted = !track.enabled;
      this.cdr.markForCheck();
    }
  }

  async disconnect(): Promise<void> {
    const session = this.session;
    if (!session || this.busy) return;
    this.busy = true;
    this.error = '';
    this.retryAvailable = false;
    this.stopCamera();
    this.status = 'Ending device session…';
    try {
      await lastValueFrom(this.devices.disconnect(session.token).pipe(
        timeout(5000),
        takeUntilDestroyed(this.destroyRef),
      ));
    } catch (error) {
      if (!this.exited && !(error instanceof HttpErrorResponse && error.status === 401)) {
        this.devices.disconnectOnPageExit(session.token);
        this.error = 'The server did not confirm the end of the session.';
      }
    } finally {
      if (!this.exited) this.clearSession();
      if (!this.destroyRef.destroyed) this.cdr.markForCheck();
    }
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
    this.exited = true;
    this.stopCamera();
    this.inviteToken = undefined;
    this.session = undefined;
    this.busy = false;
    this.retryAvailable = false;
    this.closed = true;
    this.status = 'Your camera and microphone are off. You can close this page.';
  }

  private stopCamera(): void {
    clearTimeout(this.joinTimeout);
    const connection = this.connection;
    this.connection = undefined;
    this.media?.getTracks().forEach(track => track.stop());
    this.media = null;
    this.connected = false;
    this.microphoneMuted = false;
    void connection?.close().catch(error => console.warn('Could not close camera connection', error));
  }
}
