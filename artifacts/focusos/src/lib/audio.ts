import { Howl } from 'howler';

const TRACKS = {
  ambient: '/sounds/ambient-loop.wav',
  lofi: '/sounds/lofi-loop.wav',
  rain: '/sounds/rain-loop.wav',
};

const CUE_TRACKS = {
  start: '/sounds/focus-start.wav',
  break: '/sounds/focus-break.wav',
  complete: '/sounds/focus-complete.wav',
} as const;

class AudioPlayer {
  private currentTrack: Howl | null = null;
  private currentTrackId: string | null = null;
  private cueSounds: Record<keyof typeof CUE_TRACKS, Howl>;

  constructor() {
    this.cueSounds = {
      start: this.createCueSound(CUE_TRACKS.start, 0.95),
      break: this.createCueSound(CUE_TRACKS.break, 1),
      complete: this.createCueSound(CUE_TRACKS.complete, 1),
    };
  }

  private createCueSound(src: string, volume: number) {
    return new Howl({
      src: [src],
      preload: true,
      html5: false,
      volume,
    });
  }

  play(trackId: keyof typeof TRACKS) {
    if (this.currentTrackId === trackId && this.currentTrack?.playing()) return;

    if (this.currentTrack) {
      this.currentTrack.stop();
    }

    this.currentTrackId = trackId;
    this.currentTrack = new Howl({
      src: [TRACKS[trackId]],
      loop: true,
      volume: 0.5
    });

    this.currentTrack.play();
  }

  pause() {
    if (this.currentTrack) {
      this.currentTrack.pause();
    }
  }

  resume() {
    if (this.currentTrack) {
      this.currentTrack.play();
    }
  }

  setVolume(volume: number) {
    if (this.currentTrack) {
      this.currentTrack.volume(volume);
    }
  }

  stop() {
    if (this.currentTrack) {
      this.currentTrack.stop();
      this.currentTrack = null;
      this.currentTrackId = null;
    }
  }

  primeCues() {
    Object.values(this.cueSounds).forEach((cue) => {
      void cue.load();
    });
  }

  playCue(type: 'start' | 'break' | 'complete') {
    const cue = this.cueSounds[type];
    cue.stop();
    void cue.seek(0);
    void cue.play();
  }
}

export const audioPlayer = new AudioPlayer();
