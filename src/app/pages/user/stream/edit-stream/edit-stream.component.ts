import {Component, ViewChild} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {
  NgbDatepickerModule, NgbDateStruct,
  NgbDropdownModule,
  NgbTimepicker
} from '@ng-bootstrap/ng-bootstrap';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import {
  ApiResponse, SessionService,
  SettingsService,
  Stream,
  StreamLatency, StreamLicence,
  StreamProtocol,
  StreamService, User,
  Weekday
} from '@shigde/core';
import {AlertService} from '../../../../providers/alert.service';
import {map} from 'rxjs/operators';
import {catchError, filter, Observable, of, take, tap} from 'rxjs';
import {AlertKind} from '../../../../entities/alert';
import {v4 as uuidv4} from 'uuid';
import {TimeService} from '../../../../providers/time.service';

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
  @ViewChild('timepicker') timepicker!: NgbTimepicker;

  public isEdit = false;
  public stream!: Stream;
  private currentUser: User | null = null;

  public streamUuid!: string;
  public time = {hour: 13, minute: 30};
  public isUploading = false;
  public progress = {upload: 0};

  public streamForm: FormGroup = new FormGroup({
    title: new FormControl('', [Validators.minLength(4), Validators.required, Validators.maxLength(50)]),
    thumbnail: new FormControl(''),
    description: new FormControl('', [Validators.maxLength(250)]),
    support: new FormControl('', [Validators.maxLength(150)]),
    day: new FormControl(new Date(), [Validators.required]),
    isRepeating: new FormControl(false),
    repeat: new FormControl(`${Weekday.MONDAY}`),
    isPublic: new FormControl(false),
    streamKey: new FormControl('', [Validators.required]),
    isShig: new FormControl(true),
    url: new FormControl('', [Validators.required]),
    protocol: new FormControl(`${StreamProtocol.WHIP}`),
    permanentLive: new FormControl(false),
    saveReplay: new FormControl(false),
    latencyMode: new FormControl(`${StreamLatency.STANDARD}`),
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
    private readonly session: SessionService,
    private readonly alert: AlertService,
    activeRoute: ActivatedRoute) {

    this.session.getUser().pipe(take(1)).subscribe(user => {
      this.currentUser = user;
    });

    if (activeRoute.snapshot.params['streamUuid']) {
      this.isEdit = true;
      const streamUuid = activeRoute.snapshot.params['streamUuid'];
      this.streamUuid = streamUuid;

      streamService.getStream(streamUuid).pipe(
        take(1),
        map(d => d.data),
        filter(s => s !== null),
        tap(d => this.stream = d),
        tap(d => this.setStreamInFormular(d)),
        catchError(_ => this.handleError<null>('Could not load stream!', null)),

      ).subscribe();
    }

    // Set default values
    if (!this.isEdit) {
      this.setDayInForm(new Date());
      this.setDefaultStreamingEndpoint(uuidv4());
    }

    // Disable fields because changes on there are currently not supported!
    this.streamForm.get('isRepeating')?.disable();
    this.streamForm.get('isShig')?.disable();
    this.streamForm.get('url')?.disable();
    this.streamForm.get('streamKey')?.disable();
    this.streamForm.get('protocol')?.disable();
    this.streamForm.get('permanentLive')?.disable();
    this.streamForm.get('saveReplay')?.disable();
    this.streamForm.get('latencyMode')?.disable();

    this.streamForm.get('guest1')?.disable();
    this.streamForm.get('guest2')?.disable();
    this.streamForm.get('guest3')?.disable();
    this.streamForm.get('guest4')?.disable();
    this.streamForm.get('guest5')?.disable();
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
        repeat: Number(this.streamForm.get('repeat')?.value),

        date: this.streamForm.get('day')?.value,

        isPublic: this.streamForm.get('isPublic')?.value,
        metaData: {
          isShig: this.streamForm.get('isShig')?.value,
          streamKey: this.streamForm.get('streamKey')?.value,
          url: this.streamForm.get('url')?.value,
          protocol: Number(this.streamForm.get('protocol')?.value),
          permanentLive: this.streamForm.get('permanentLive')?.value,
          saveReplay: this.streamForm.get('saveReplay')?.value,
          latencyMode: Number(this.streamForm.get('latencyMode')?.value),
        },
        thumbnail: this.streamForm.get('thumbnail')?.value,
      };

      const day: NgbDateStruct = this.streamForm.get('day')?.value;
      stream.date = TimeService.buildDaytime(new Date(day.year, day.month - 1, day.day), this.time.hour, this.time.minute);

      let save: Observable<ApiResponse<Stream> | null>;
      if (this.isEdit) {
        save = this.streamService.updateStream(stream, fileBlob, this.progress);
      } else {
        stream.uuid = '';
        stream.viewer = 0;
        stream.likes = 0;
        stream.dislikes = 0;
        stream.licence = StreamLicence.DEFAULT;
        stream.isLive = false;
        stream.ownerUuid = <string>this.currentUser?.uuid;
        stream.channelUuid = <string>this.currentUser?.channel_uuid;

        save = this.streamService.createStream(stream, fileBlob, this.progress);
      }
      this.handleSave(save);
    } else {
      // this.streamForm.markAsDirty();
      this.streamForm.markAllAsTouched();
      let errorString = '';

      for (const [key, control] of Object.entries(this.streamForm.controls)) {
        const errors = control.errors;
        if (!errors) continue;

        for (const errorName of Object.keys(errors)) {
          switch (errorName) {
            case 'required':
              errorString += `\n  * The field ${key} is required!`;
              break;
            case 'minlength':
              errorString += `\n  * The field ${key} has a min length of ${errors['minlength']['requiredLength']} characters!`;
              break;
            case 'maxlength':
              errorString += `\n  * The field ${key} has a max length of ${errors['maxlength']['requiredLength']} characters!`;
              break;
            case 'ngbDate':
              errorString += `\n  * The field ${key} must be a valid date (Ex: yyyy-mm-dd)`;
              break;
            default:
              errorString += `\n  * The field ${key} has an error: ${errorName}`;
              break;
          }
        }
      }

      this.alert.alert(AlertKind.DANGER, `Could not ${this.isEdit ? 'update' : 'create'} the Stream! Please fill all required fields! ${errorString}`);
    }
  }

  goToStream() {
    if (this.streamUuid) {
      this.router.navigate(['/stream/' + this.streamUuid]);
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.streamForm.get(fieldName);
    return field ? field.invalid && (field.dirty || field.touched) : false;
  }

  getFieldError(fieldName: string, errorType: string): boolean {
    const field = this.streamForm.get(fieldName);
    return field ? field.hasError(errorType) : false;
  }

  public setDefaultStreamingEndpoint(streamUuid: string) {
    let urlProtocol = 'https';
    const protocol = Number(this.streamForm.get('protocol')?.value);
    if (protocol == StreamProtocol.RTMP) {
      urlProtocol = 'rtmps';
    }
    let key = uuidv4();
    this.streamForm.get('url')?.setValue(`${window.location.origin}/livestream/${streamUuid}`);
    this.streamForm.get('streamKey')?.setValue(key);

    this.settingsService.getSettings().pipe(take(1)).subscribe((s) => {
      this.streamForm.get('url')?.setValue(`${urlProtocol}://${s.domain}/livestream/${uuidv4()}`);
      this.streamForm.get('streamKey')?.setValue(uuidv4());
    });
  }

  private setStreamInFormular(stream: Stream): void {
    this.setDayInForm(stream.date);
    this.streamForm.get('title')?.setValue(stream.title);
    this.streamForm.get('description')?.setValue(stream.description);
    this.streamForm.get('thumbnail')?.setValue(stream.thumbnail);
    this.streamForm.get('support')?.setValue(stream.support);
    this.streamForm.get('isRepeating')?.setValue(stream.isRepeating);
    this.streamForm.get('repeat')?.setValue(`${stream.repeat}`);
    this.streamForm.get('isPublic')?.setValue(stream.isPublic);
    this.streamForm.get('isShig')?.setValue(stream.metaData.isShig);
    this.streamForm.get('streamKey')?.setValue(stream.metaData.streamKey);
    this.streamForm.get('url')?.setValue(stream.metaData.url);
    this.streamForm.get('protocol')?.setValue(`${stream.metaData.protocol}`);
    this.streamForm.get('permanentLive')?.setValue(stream.metaData.permanentLive);
    this.streamForm.get('saveReplay')?.setValue(stream.metaData.saveReplay);
    this.streamForm.get('latencyMode')?.setValue(`${stream.metaData.latencyMode}`);

    // this.streamForm.get('guest1')?.setValue(stream.guest1);
    // this.streamForm.get('guest2')?.setValue(stream.guest2);
    // this.streamForm.get('guest3')?.setValue(stream.guest3);
    // this.streamForm.get('guest4')?.setValue(stream.guest4);
    // this.streamForm.get('guest5')?.setValue(stream.guest5);
  }

  private setDayInForm(day: Date): void {
    this.time.hour = day.getHours();
    this.time.minute = day.getMinutes();

    this.timepicker?.updateHour(`${day.getHours()}`)
    this.timepicker?.updateMinute(`${day.getMinutes()}`)

    let streamDay: NgbDateStruct = {
      year: day.getFullYear(),
      month: day.getMonth() + 1,
      day: day.getDate()
    };

    this.streamForm.get('day')?.setValue(streamDay);
  }

  private handleSave(observer: Observable<ApiResponse<Stream> | null>) {
    observer.pipe(
      take(1),
      tap(s => {
        if (s !== null) {
            this.streamUuid = s.data.uuid;
        }
      }),
      tap(_ => this.alert.alert(AlertKind.SUCCESS, `The Stream has been ${this.isEdit ? 'updated' : 'created'}!`)),
      map(_ => this.goToStream()),
      catchError(_ => this.handleError<Stream>(`Could not ${this.isEdit ? 'updated' : 'created'} Stream!`, {} as Stream))
    ).subscribe(() => {
      setTimeout(() => {
        this.isUploading = false; // Stop the progress indicator after a delay
        this.progress.upload = 0; // Reset for the next upload
      }, 1000); // Delay for smoother UX
    });
  }

  private handleError<T>(msg: string, resp: T): Observable<T> {
    this.alert.alert(AlertKind.DANGER, msg);
    return of(resp);
  }
}
