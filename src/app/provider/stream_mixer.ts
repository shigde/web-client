const WIDTH = 1920;
const HEIGHT = 1080;

export class StreamMixer {

    private readonly canvas: HTMLCanvasElement;
    private readonly context: CanvasRenderingContext2D;
    public readonly videoElements: Map<string, HTMLVideoElement> = new Map<string, HTMLVideoElement>();

    private mediaStreams: Map<string, MediaStream> = new Map<string, MediaStream>();
    private audioContext: any;
    private audioDestination: any;
    private audioSources?: Array<any>;
    private gainNode?: GainNode;
    private useGainNode = false;

    constructor(elementId: string) {
        this.canvas = window.document.getElementById(elementId) as HTMLCanvasElement;
        this.canvas.width = WIDTH;
        this.canvas.height = HEIGHT;
        this.context = this.canvas.getContext('2d') as CanvasRenderingContext2D;
        this.context.imageSmoothingEnabled = true;
    }

    start() {
        this.drawScreen();
    }

    drawScreen() {
        //Background
        this.context.fillStyle = '#ffffff';
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        const gridParams = this.calculateGridParams(this.videoElements.size, this.canvas.width, this.canvas.height);

        const videos = this.videoElements.values();
        for (let c = 0; c < gridParams.cols; c++) {
            for (let r = 0; r < gridParams.rows; r++) {
                let v = videos.next().value as HTMLVideoElement;
                let placeX = c * gridParams.partWidth + c * gridParams.xPad;
                let placeY = r * gridParams.partHeight + r * gridParams.yPad;
                if (!!v) {
                    this.context.drawImage(v, placeX, placeY, gridParams.partWidth, gridParams.partHeight);
                }
            }
        }

        window.requestAnimationFrame(() => {
            this.drawScreen();
        });
    }

    calculateGridParams(videos: number, width: number, height: number): GridParams {
        // drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)
        // https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage
        let params: GridParams = {
            cols: 1,
            rows: 1,
            xPad: 2,
            yPad: 2,
            partWidth: 0,
            partHeight: 0
        };

        switch (videos) {
            case 0 :
            case 1: {
                return {...params, partWidth: width, partHeight: height};
            }
            case 2 : {
                params = {...params, cols: 2, rows: 1};
                break;
            }
            case 3 : {
                params = {...params, cols: 2, rows: 2};
                break;
            }
            case 4 : {
                params = {...params, cols: 2, rows: 2};
                break;
            }
            default:
                break;
        }

        params.partWidth = width / params.cols;
        params.partHeight = height / params.rows;
        return params;
    }

    getStream(): MediaStream {
        return this.canvas.captureStream(60);
    }

    getMixedStream() {
        let mixedAudioStream = this.getMixedAudioStream();
        let mixedVideoStream = this.canvas.captureStream(60);
        if (mixedAudioStream) {
            mixedAudioStream.getTracks().filter((t) => t.kind === 'audio').forEach((track) => {
                mixedVideoStream.addTrack(track);
            });
        }
        return mixedVideoStream;
    }

    private getMixedAudioStream(): MediaStream | undefined {
        // via: @pehrsons
        if (this.audioContext == undefined) this.audioContext = this.getAudioContext();
        this.audioSources = new Array<any>();
        if (this.useGainNode) {
            this.gainNode = this.audioContext.createGain();
            // @ts-ignore
            this.gainNode.connect(this.audioContext.destination);
            // @ts-ignore
            this.gainNode.gain.value = 0; // don't hear self
        }

        let audioTracksLength = 0;
        this.mediaStreams.forEach((stream) => {
            if (stream.getTracks().filter((t) => t.kind === 'audio').length === 0) {
                return;
            }
            audioTracksLength++;
            let _audioSource = this.audioContext.createMediaStreamSource(stream);
            if (this.gainNode !== undefined) {
                _audioSource.connect(this.gainNode);
            }
            // @ts-ignore
            this.audioSources.push(_audioSource);
        });

        if (!audioTracksLength) {
            return undefined;
        }
        this.audioDestination = this.audioContext.createMediaStreamDestination();
        this.audioSources.forEach(_audioSource => {
            _audioSource.connect(this.audioDestination);
        });
        return this.audioDestination.stream;
    }

    getAudioContext(): any {
        if (typeof AudioContext !== 'undefined') {
            return new AudioContext();
        } else if (typeof (<any>window).webkitAudioContext !== 'undefined') {
            return new (<any>window).webkitAudioContext();
        } else if (typeof (<any>window).mozAudioContext !== 'undefined') {
            return new (<any>window).mozAudioContext();
        }
    }

    appendStream(stream: MediaStream) {
        if (this.mediaStreams.has(stream.id)) {
            return;
        }
        this.mediaStreams.set(stream.id, stream);
        if (stream.getTracks().filter((t) => t.kind === 'audio').length > 0 && this.audioContext) {
            let audioSource = this.audioContext.createMediaStreamSource(stream);
            audioSource.connect(this.audioDestination);
            this.audioSources?.push(audioSource);
        }
    };

    removeStream(stream: MediaStream) {
        if (this.mediaStreams.has(stream.id)) {
            this.mediaStreams.delete(stream.id)
        }
    }

    private releaseStreams(): void {
        if (this.gainNode !== undefined) {
            this.gainNode.disconnect();
            // @ts-ignore
            this.gainNode = null;
        }

        if (this.audioSources?.length) {
            this.audioSources.forEach(source => {
                source.disconnect();
            });
            this.audioSources = [];
        }

        if (this.audioDestination !== undefined) {
            this.audioDestination.disconnect();
            this.audioDestination = null;
        }

        if (this.audioContext !== undefined) {
            this.audioContext.close();
        }

        this.audioContext = undefined;

        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

interface GridParams {
    cols: number;
    rows: number;
    xPad: number;
    yPad: number;
    partWidth: number;
    partHeight: number;
}
