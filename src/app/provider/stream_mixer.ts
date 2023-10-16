const WIDTH = 1920;
const HEIGHT = 1080;

export class StreamMixer {

    private readonly canvas: HTMLCanvasElement;
    private readonly context: CanvasRenderingContext2D;
    private readonly mediaStream: MediaStream;
    public readonly videoElements: Map<string, HTMLVideoElement> = new Map<string, HTMLVideoElement>();

    constructor(elementId: string) {
        this.canvas = window.document.getElementById(elementId) as HTMLCanvasElement;
        this.canvas.width = WIDTH;
        this.canvas.height = HEIGHT;
        this.context = this.canvas.getContext('2d') as CanvasRenderingContext2D;
        this.context.imageSmoothingEnabled = true;
        this.mediaStream = new MediaStream();
    }

    start() {
        this.drawScreen();
    }

    drawScreen() {
        //Background
        this.context.fillStyle = '#ffffff';
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const cols = this.videoElements.size;
        const rows = 1;
        const xPad = 2;
        const yPad = 1;
        const startXOffset = 0;
        const startYOffset = 0;
        let partWidth = this.canvas.width / cols;
        let partHeight = this.canvas.height / rows;
        let board = new Array();

        //Initialize Board
        for (var i = 0; i < cols; i++) {
            board[i] = new Array();
            for (let j = 0; j < rows; j++) {
                board[i][j] = {finalCol: i, finalRow: j, selected: false};
            }
        }

        const videos = this.videoElements.values();
        for (let c = 0; c < cols; c++) {
            for (let r = 0; r < rows; r++) {
                let tempPiece = board[c][r];
                let v = videos.next().value as HTMLVideoElement;
                // let target_width: number;
                // let target_height: number;
                // let ratio = v.offsetWidth / v.offsetHeight;
                // if (v.offsetWidth > v.offsetHeight) {
                //     target_width = partWidth;
                //     target_height = partWidth / ratio;
                //     //y_of_video = (c.height - target_height) / 2 ;
                // } else {
                //     target_width = partHeight * ratio;
                //     target_height = partHeight;
                //     //x_of_video = (c.width - target_width) / 2 ;
                // }
                //
                //
                // let imageX = tempPiece.finalCol * target_width;
                // let imageY = tempPiece.finalRow * target_height;
                let placeX = c * partWidth + c * xPad + startXOffset;
                let placeY = r * partHeight + r * yPad + startYOffset;
                let sx, sy, sw, sh, dx, dy, dw, dh;
                let xDiff = v.videoWidth - partWidth;
                let yDiff = v.videoHeight - partHeight;

                // x coordinate
                if (xDiff >= 0) {
                    sx = xDiff / 2;
                    sw = v.videoWidth - xDiff / 2;
                    dx = placeX;
                    dw = partWidth;
                } else {
                    sx = 0;
                    sw = v.videoWidth;
                    dx = placeX;
                    dw = partWidth;
                }

                // y coordinate
                if (yDiff > 0) {
                    sy = yDiff / 2;
                    sh = v.videoHeight - yDiff / 2;
                    dy = placeY;
                    dh = partHeight;
                } else {
                    sy = 0;
                    sh = v.videoHeight;
                    dy = placeY - (cols - 1) * yDiff / cols;
                    dh = partHeight + (cols - 1) * yDiff;
                }

                // this.context.drawImage(v, 0, 0, v.videoHeight, v.videoWidth, placeX, placeY, partWidth, partHeight);
                this.context.drawImage(v, sx, sy, sw, sh, dx, dy, dw, dh);
                if (tempPiece.selected) {
                    this.context.strokeStyle = '#FFFF00';
                    this.context.strokeRect(placeX, placeY, partWidth, partHeight);
                }
            }
        }

        window.requestAnimationFrame(() => {
            this.drawScreen();
        });
    }

    getStream(): MediaStream {
        return this.canvas.captureStream(60);
    }
}

// https://stackoverflow.com/questions/49474980/how-do-i-split-a-video-into-blocks-using-drawimage-in-html5
// https://antmedia.io/how-to-merge-live-stream-and-canvas-in-webrtc-easily/
