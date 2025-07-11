import {Component} from '@angular/core';
import {Channel, ChannelService} from '@shigde/core';
import {ActivatedRoute, Router} from '@angular/router';
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {catchError, filter, Observable, of, take, tap} from 'rxjs';
import {FederativeService} from '../../../../providers/federative.service';
import {AlertKind} from '../../../../entities/alert';
import {map} from 'rxjs/operators';
import {AlertService} from '../../../../providers/alert.service';

@Component({
  selector: 'app-edit-channel',
  imports: [
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './edit-channel.component.html',
  styleUrl: './edit-channel.component.scss'
})
export class EditChannelComponent {

  channelForm: FormGroup = new FormGroup({
    name: new FormControl('', [Validators.minLength(4), Validators.required, Validators.maxLength(50)]),
    description: new FormControl('', [Validators.maxLength(250)]),
    support: new FormControl('', [Validators.maxLength(150)]),
    public: new FormControl(false),
    file: new FormControl('')
  });

  channel: Channel | undefined;
  domain: string = '';

  private readonly channelUuid: string;
  public isUploading = false;
  public progress = {upload: 0};


  constructor(
    private readonly channelService: ChannelService,
    private readonly router: Router,
    private readonly alert: AlertService,
    activeRoute: ActivatedRoute,
  ) {
    this.channelUuid = activeRoute.snapshot.params['channelUuid'];
    this.channelService.fetch(this.channelUuid).pipe(
      take(1),
      catchError(_ => this.handleError<null>('Could not load channel!', null)),
      filter((s) => s !== null)
    ).subscribe((c) => {
      this.channel = c.data;
      let split = FederativeService.splitDomainNameToJson(this.channel.name);
      this.domain = split.domain;
      this.channelForm.get('name')?.setValue(split.name);
      this.channelForm.get('description')?.setValue(this.channel.description);
      this.channelForm.get('support')?.setValue(this.channel.support);
      this.channelForm.get('public')?.setValue(this.channel.public);
      this.channelForm.get('name')?.disable();
    });
  }

  get name() {
    return this.channelForm.get('name');
  }

  get support() {
    return this.channelForm.get('support');
  }

  get description() {
    return this.channelForm.get('description');
  }

  save(fileInput: any) {

    if (this.channelForm.valid) {
      this.isUploading = true;
      let fileBlob = null;
      let files: File[] = fileInput.files;
      if (files.length > 0) {
        fileBlob = files[0];
      }

      let channelName = FederativeService.joinDomainNameToString(this.channelForm.get('name')?.value, this.domain);
      // @ts-ignore
      const channel: Channel = {
        ...this.channel,
        name: channelName,
        description: this.channelForm.get('description')?.value,
        support: this.channelForm.get('support')?.value,
        public: this.channelForm.get('public')?.value,
      };
      console.log('#####', this.channelForm.get('public')?.value)
      this.channelService.save(channel, fileBlob, this.progress).pipe(
        take(1),
        tap(_ => this.alert.alert(AlertKind.SUCCESS, 'The Channel has been updated!')),
        map(_ => this.goToChannel()),
        catchError(_ => this.handleError<Channel>('Could not update channel!', channel))
      ).subscribe(() => {
        setTimeout(() => {
          this.isUploading = false; // Stop the progress indicator after a delay
          this.progress.upload = 0; // Reset for the next upload
        }, 1000); // Delay for smoother UX
      });
    }
  }

  goToChannel() {
    this.router.navigate(['/channel/' + this.channelUuid]);
  }

  private handleError<T>(msg: string, rsp: T): Observable<T> {
    this.alert.alert(AlertKind.DANGER, msg);
    return of(rsp);
  }

}
