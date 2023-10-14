import {AfterViewInit, Component, Input, OnInit} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {Observable, Subscription, tap} from 'rxjs';
import {
    DeviceSettings,
    DeviceSettingsOptions,
    DeviceSettingsService, IndexStoreService,
    SelectValue
} from '@shig/core';
import {map} from 'rxjs/operators';

export type DeviceSettingsCbk = (s: DeviceSettings) => void;

@Component({
    selector: 'app-device-settings',
    templateUrl: './device-settings.component.html',
    styleUrls: ['./device-settings.component.scss']
})
export class DeviceSettingsComponent implements OnInit, AfterViewInit {
    @Input() cbk: undefined | DeviceSettingsCbk;
    @Input() closeCbk: undefined | (() => void);
// tslint:disable-next-line:no-output-on-prefix
    public onSelectChange?: (settings: DeviceSettings) => void;
    public settings = DeviceSettings.buildDefault();
    public readonly settingsOptions = new DeviceSettingsOptions();
    public readonly settingForm = new FormGroup({
        camera: new FormControl(''),
        microphone: new FormControl(''),
        audioDevice: new FormControl(),
        quality: new FormControl(),
        videoCodec: new FormControl(),
        bandwidth: new FormControl(),
        audio: new FormControl(),
    });

    public isSaving = false;
    private changeSub: Subscription[] = [];


    constructor(
        protected media: DeviceSettingsService,
        private store: IndexStoreService,
    ) {
    }

    ngOnInit(): void {
        if(!!this.cbk) {
            this.onSelectChange = this.cbk;
        }

        this.store.get()
            .pipe(map((setting): DeviceSettings => {
                    if (setting === undefined) {

                        setting = DeviceSettings.buildDefault();
                        // this.store.save(setting);
                    }
                    this.settings = setting;
                    this.updateForm(this.settings);
                    return setting;
                })
            ).subscribe(() => {
        });

    }

    public updateForm(settings: DeviceSettings): void {
        this.settingForm.patchValue({
            camera: settings.camera,
            microphone: settings.microphone,
            audioDevice: settings.audioDevice,
            quality: settings.quality,
            videoCodec: settings.videoCodec,
            bandwidth: settings.bandwidth,
            audio: settings.audio
        });
    }

    ngAfterViewInit(): void {

        this.media.enumerateDevices()
            .then((devices: any) => {
                devices.videoDevices.forEach((device: any, index: any) => this.settingsOptions.addCamera(this.mapDevicesToSettings(device, `Camera ${index + 1}`)));
                devices.audioDevices.forEach((device: any, index: any) => this.settingsOptions.addMicrophone(this.mapDevicesToSettings(device, `Microphone ${index + 1}`)));
                devices.audioOutputDevices.forEach((device: any, index: any) => this.settingsOptions.addAudioDevice(this.mapDevicesToSettings(device, `Audio ${index + 1}`)));
            })
            .catch((err: any) => {
                // this.alert.addAlert({type: 'danger', message: err.message});
            });

        this.subscribeFormField(this.settingForm.get('camera')?.valueChanges);
        this.subscribeFormField(this.settingForm.get('microphone')?.valueChanges);
        this.subscribeFormField(this.settingForm.get('audioDevice')?.valueChanges);
        this.subscribeFormField(this.settingForm.get('quality')?.valueChanges);
        this.subscribeFormField(this.settingForm.get('videoCodec')?.valueChanges);
        this.subscribeFormField(this.settingForm.get('bandwidth')?.valueChanges);
        this.subscribeFormField(this.settingForm.get('audio')?.valueChanges);
    }

    public onChange(): void {
        if (this?.onSelectChange && this.settings) {
            this.settings.camera = this.settingForm.value.camera;
            this.settings.microphone = this.settingForm.get('microphone')?.value;
            this.settings.audioDevice = this.settingForm.get('audioDevice')?.value;
            this.settings.quality = this.settingForm.get('quality')?.value;
            this.settings.videoCodec = this.settingForm.get('videoCodec')?.value;
            this.settings.bandwidth = this.settingForm.get('bandwidth')?.value;
            this.settings.audio = this.settingForm.get('audio')?.value;
            this.store.update(this.settings);
            this.onSelectChange(this.settings);
        }
    }

    public close() {
        if(this.closeCbk) {
            this.closeCbk();
        }
    }

    public selectMicrofone(deviceId: string): void {

    }

    public selectAudioDevice(deviceId: string): void {

    }

    public save(): void {
    }

    public cancel(): void {
    }

    private mapDevicesToSettings(device: MediaDeviceInfo, labal: string): SelectValue {
        const viewValue = device.label.length === 0 ? labal : device.label;
        return {value: device.deviceId, viewValue};
    }

    private hasVideoTrack(media: MediaStream): boolean {
        return media.getVideoTracks().length > 0;
    }

    private subscribeFormField(field: Observable<any> | undefined): void {
        if (!!field) {
            this.changeSub.push(field.subscribe(() => {
                this.onChange();
            }));
        }
    }
}
