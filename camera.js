class Camera {
  constructor () {
    this.video = document.createElement('video');
    this.video.setAttribute('muted', true);
    this.video.setAttribute('playsinline', true);
    
    this.selfie = false;
  }
  _startCapture() {
    return navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: this.selfie ? "user" : "environment",
        frameRate: {
          ideal: 1,
          max: 5,
        }
      }
    }).then(stream => {
      this.stream = stream;
      this.video.srcObject = stream;
      this.video.play();
    });
  }
  init () {
    return this._startCapture();
  }
  flip () {
    this.selfie = !this.selfie;
    this._startCapture();
  }
}
