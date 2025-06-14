import {Component} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {
  NgbDatepickerModule,
  NgbDropdownModule,
  NgbTimepicker
} from '@ng-bootstrap/ng-bootstrap';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';
import {SettingsService, Stream, StreamLatency, StreamProtocol, StreamService, Weekday} from '@shigde/core';
import {AlertService} from '../../../../providers/alert.service';
import {map} from 'rxjs/operators';
import {catchError, filter, Observable, of, take, tap} from 'rxjs';
import {AlertKind} from '../../../../entities/alert';
import {v4 as uuidv4} from 'uuid';
import {TimeService} from '../../../../providers/time.service';
import {formatDate} from '@angular/common';

@Component({
  selector: 'app-edit-stream',
  standalone: true,
  imports: [
    NgbTimepicker,
    FormsModule,
    NgbDropdownModule,
    NgbDatepickerModule,
    ReactiveFormsModule
  ],
  templateUrl: './edit-stream.component.html',
  styleUrl: './edit-stream.component.scss'
})
export class EditStreamComponent {
  public today = formatDate(new Date(), 'yyyy-MM-dd', 'en-US');
  public isEdit = false;
  public stream!: Stream;
  public streamUuid!: string;
  public time = {hour: 13, minute: 30};
  public isUploading = false;
  public progress = {upload: 0};

  public streamForm: FormGroup = new FormGroup({
    title: new FormControl('', [Validators.minLength(4), Validators.required, Validators.maxLength(50)]),
    thumbnail: new FormControl(''),
    description: new FormControl('', [Validators.maxLength(250)]),
    support: new FormControl('', [Validators.maxLength(150)]),
    day: new FormControl(this.today, [Validators.required, this.createDayValidator()]),
    isRepeating: new FormControl('false'),
    repeat: new FormControl(Weekday.MONDAY),
    isPublic: new FormControl(false),
    streamKey: new FormControl('', [Validators.required]),
    isShig: new FormControl(true),
    url: new FormControl('', [Validators.required]),
    protocol: new FormControl(StreamProtocol.RTMP),
    permanentLive: new FormControl(false),
    saveReplay: new FormControl(false),
    latencyMode: new FormControl(StreamLatency.STANDARD),
    guest1: new FormControl(),
    guest2: new FormControl(),
    guest3: new FormControl(),
    guest4: new FormControl(),
    guest5: new FormControl(),
  });

  constructor(
    private readonly router: Router,
    private readonly streamService: StreamService,
    private readonly settingsService: SettingsService,
    private readonly alert: AlertService,
    activeRoute: ActivatedRoute) {

    if (activeRoute.snapshot.params['streamUuid']) {
      this.isEdit = true;
      const streamUuid = activeRoute.snapshot.params['streamUuid'];
      this.streamUuid = streamUuid;

      streamService.getStream(streamUuid).pipe(
        map(d => d.data),
        tap(d => this.stream = d),
        tap(d => this.setStreamInFormular(d)),
        catchError(_ => this.handleError<null>('Could not load channel!', null)),
        filter(s => s !== null),
      );
    }

    // Set default values
    if (!this.isEdit) {
      let date = new Date();
      this.time.hour = date.getHours();
      this.time.minute = date.getMinutes();
      this.setDefaultStreamingEndpoint();
    }
  }

  save(fileInput: any) {
    if (this.streamForm.valid) {
      this.isUploading = true;
      let fileBlob = null;
      let files: File[] = fileInput.files;
      if (files.length > 0) {
        fileBlob = files[0];
      }

      // @ts-ignore
      const stream: Stream = {
        ...this.stream,
        title: this.streamForm.get('title')?.value,
        description: this.streamForm.get('description')?.value,
        support: this.streamForm.get('support')?.value,
        isRepeating: this.streamForm.get('isRepeating')?.value,
        repeat: this.streamForm.get('repeat')?.value,

        date: this.streamForm.get('day')?.value,

        isPublic: this.streamForm.get('isPublic')?.value,
        metaData: {
          isShig: this.streamForm.get('isShig')?.value,
          streamKey: this.streamForm.get('streamKey')?.value,
          url: this.streamForm.get('url')?.value,
          protocol: this.streamForm.get('protocol')?.value,
          permanentLive: this.streamForm.get('permanentLive')?.value,
          saveReplay: this.streamForm.get('saveReplay')?.value,
          latencyMode: this.streamForm.get('latencyMode')?.value,
        },
        thumbnail: this.streamForm.get('thumbnail')?.value,
      };

      let day: Date;
      if (stream.isRepeating) {
        day = new Date();
      } else {
        stream.date = new Date();
      }

      this.streamService.save(stream, fileBlob, this.progress).pipe(
        take(1),
        tap(_ => this.alert.alert(AlertKind.SUCCESS, 'The Stream has been updated!')),
        map(_ => this.goToStream()),
        catchError(_ => this.handleError<Stream>('Could not update stream!', stream))
      ).subscribe(() => {
        setTimeout(() => {
          this.isUploading = false; // Stop the progress indicator after a delay
          this.progress.upload = 0; // Reset for the next upload
        }, 1000); // Delay for smoother UX
      });
    } else {
      //this.streamForm.markAsDirty();
      this.streamForm.markAllAsTouched();
      this.alert.alert(AlertKind.DANGER, 'Could not save the Stream! Please fill all required fields!');
    }
  }

  goToStream() {
    if (this.streamUuid) {
      this.router.navigate(['/stream/' + this.streamUuid]);
    }
  }

  // Getter
  get title() {
    return this.streamForm.get('title');
  }

  get thumbnail() {
    return this.streamForm.get('thumbnail');
  }

  get description() {
    return this.streamForm.get('description');
  }

  get support() {
    return this.streamForm.get('support');
  }

  get day() {
    return this.streamForm.get('day');
  }

  get isRepeating() {
    return this.streamForm.get('isRepeating');
  }

  get repeat() {
    return this.streamForm.get('repeat');
  }

  get isPublic() {
    return this.streamForm.get('isPublic');
  }

  get streamKey() {
    return this.streamForm.get('streamKey');
  }

  get isShig() {
    return this.streamForm.get('isShig');
  }

  get url() {
    return this.streamForm.get('url');
  }

  get protocol() {
    return this.streamForm.get('protocol');
  }

  get permanentLive() {
    return this.streamForm.get('permanentLive');
  }

  get saveReplay() {
    return this.streamForm.get('saveReplay');
  }

  get latencyMode() {
    return this.streamForm.get('latencyMode');
  }

  // Hilfsmethode zur Validierung des Formulars
  isFieldInvalid(fieldName: string): boolean {
    const field = this.streamForm.get(fieldName);
    return field ? field.invalid && (field.dirty || field.touched) : false;
  }

  // Hilfsmethode zum Abrufen spezifischer Validierungsfehler
  getFieldError(fieldName: string, errorType: string): boolean {
    const field = this.streamForm.get(fieldName);
    return field ? field.hasError(errorType) : false;
  }

  get date() {
    let day = this.streamForm.get('day')?.value;
    let time = this.streamForm.get('time')?.value;
    let date = new Date(day.getFullYear(), day.getMonth(), day.getDate(), time.hour, time.minute);
    return date;
  }


  public setDefaultStreamingEndpoint() {
    let urlProtocol = 'https';
    const protocol = this.streamForm.get('protocol')?.value;
    if (protocol == StreamProtocol.RTMP) {
      urlProtocol = 'rtmps';
    }

    this.settingsService.getSettings().subscribe((s) => {
      this.streamForm.get('url')?.setValue(`${urlProtocol}://${s.domain}/livestream/${uuidv4()}`);
      this.streamForm.get('streamKey')?.setValue(uuidv4());
    });
  }

  private setStreamInFormular(stream: Stream): void {

  }

  private handleError<T>(msg: string, resp: T): Observable<T> {
    this.alert.alert(AlertKind.DANGER, msg);
    return of(resp);
  }

  private createDayValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {

      const value = control.value;

      if (!value) {
        return null;
      }

      const hasUpperCase = /[A-Z]+/.test(value);

      const hasLowerCase = /[a-z]+/.test(value);

      const hasNumeric = /[0-9]+/.test(value);

      const passwordValid = hasUpperCase && hasLowerCase && hasNumeric;

      return !passwordValid ? {passwordStrength: true} : null;
    };
  }
}
