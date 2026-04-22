import { Howl } from 'howler';

const TRACKS = {
  ambient: 'https://cdn.freesound.org/previews/518/518306_11406915-lq.mp3', // Example placeholder
  lofi: 'https://cdn.freesound.org/previews/607/607212_11406915-lq.mp3',
  rain: 'https://cdn.freesound.org/previews/401/401490_5121236-lq.mp3'
};

class AudioPlayer {
  private currentTrack: Howl | null = null;
  private currentTrackId: string | null = null;

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
}

export const audioPlayer = new AudioPlayer();
