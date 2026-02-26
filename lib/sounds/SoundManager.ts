"use client";

import {
  DEFAULT_SOUND_PACK,
  SOUND_EVENTS,
  getDefaultSoundSource,
  getSoundPack,
  type SoundEventName,
  type SoundPackId,
} from "@/lib/sounds/packs";

export type CustomSoundMeta = {
  name: string;
  type: string;
  size: number;
  updatedAt: number;
};

export type SoundManagerState = {
  packId: SoundPackId;
  volume: number;
  muted: boolean;
  mappings: Partial<Record<SoundEventName, string>>;
};

type PlayOptions = {
  volumeMultiplier?: number;
};

const MAX_POLYPHONY = 4;

const EVENT_VOLUME_MULTIPLIERS: Partial<Record<SoundEventName, number>> = {
  boot: 0.92,
  login: 0.84,
  lock: 0.75,
  unlock: 0.78,
  startOpen: 0.6,
  startClose: 0.58,
  panelOpen: 0.6,
  panelClose: 0.58,
  openWindow: 0.78,
  closeWindow: 0.74,
  windowFocus: 0.38,
  windowSnap: 0.68,
  windowRestore: 0.7,
  minimize: 0.72,
  maximize: 0.74,
  shutdown: 0.76,
  restart: 0.76,
  error: 1,
  notify: 0.86,
  recycle: 0.76,
  clickSoft: 0.45,
};

export class SoundManager {
  private packId: SoundPackId = DEFAULT_SOUND_PACK;
  private volume = 0.72;
  private muted = false;
  private mappings: Partial<Record<SoundEventName, string>> = {};
  private context: AudioContext | null = null;
  private activeAudioQueue: HTMLAudioElement[] = [];
  private preloadedSources = new Set<string>();

  play(eventName: SoundEventName, options: PlayOptions = {}): void {
    if (typeof window === "undefined") {
      return;
    }

    const source = this.resolveSource(eventName);
    if (!source) {
      return;
    }

    const audio = this.createAudio(source);
    if (!audio) {
      if (eventName === "error") {
        this.playFallbackTone(eventName, options.volumeMultiplier ?? 1);
      }
      return;
    }

    const eventMultiplier = EVENT_VOLUME_MULTIPLIERS[eventName] ?? 1;
    audio.volume = this.muted
      ? 0
      : this.clamp(
          this.volume * eventMultiplier * (options.volumeMultiplier ?? 1),
          0,
          1
        );

    this.enforcePolyphony();
    this.activeAudioQueue.push(audio);

    const release = () => this.releaseAudio(audio);

    audio.onended = release;
    audio.onerror = () => {
      release();
      if (eventName === "error") {
        this.playFallbackTone(eventName, options.volumeMultiplier ?? 1);
      }
    };

    void audio.play().catch(() => {
      release();
      if (eventName === "error") {
        this.playFallbackTone(eventName, options.volumeMultiplier ?? 1);
      }
    });
  }

  setVolume(next: number): number {
    this.volume = this.clamp(next, 0, 1);
    return this.volume;
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    return this.muted;
  }

  setMuted(value: boolean): boolean {
    this.muted = value;
    return this.muted;
  }

  setPack(packId: SoundPackId): SoundPackId {
    this.packId = getSoundPack(packId).id;
    this.preloadCurrentPack();
    return this.packId;
  }

  setMapping(eventName: SoundEventName, source: string | null): void {
    if (source && source.trim()) {
      this.mappings[eventName] = source;
      this.preloadSource(source);
      return;
    }

    delete this.mappings[eventName];
  }

  setMappings(next: Partial<Record<SoundEventName, string>>): void {
    this.mappings = { ...next };
    Object.values(this.mappings).forEach((source) => {
      if (source) {
        this.preloadSource(source);
      }
    });
  }

  preloadCurrentPack(): void {
    if (typeof window === "undefined") {
      return;
    }

    for (const eventName of SOUND_EVENTS) {
      const customSource = this.mappings[eventName];
      if (customSource) {
        this.preloadSource(customSource);
      } else {
        this.preloadSource(getDefaultSoundSource(this.packId, eventName));
      }
    }
  }

  async setCustomSound(
    eventName: SoundEventName,
    file: File
  ): Promise<{ src: string; meta: CustomSoundMeta } | null> {
    if (typeof window === "undefined") {
      return null;
    }

    try {
      const src = await this.fileToDataUrl(file);
      const meta: CustomSoundMeta = {
        name: file.name,
        type: file.type,
        size: file.size,
        updatedAt: Date.now(),
      };
      this.setMapping(eventName, src);
      return { src, meta };
    } catch {
      return null;
    }
  }

  applyState(next: SoundManagerState): void {
    this.setPack(next.packId);
    this.setVolume(next.volume);
    this.setMuted(next.muted);
    this.setMappings(next.mappings);
    this.preloadCurrentPack();
  }

  getState(): SoundManagerState {
    return {
      packId: this.packId,
      volume: this.volume,
      muted: this.muted,
      mappings: { ...this.mappings },
    };
  }

  private resolveSource(eventName: SoundEventName): string | null {
    const custom = this.mappings[eventName];
    if (custom) {
      return custom;
    }

    return getDefaultSoundSource(this.packId, eventName);
  }

  private preloadSource(source: string) {
    if (typeof window === "undefined" || this.preloadedSources.has(source)) {
      return;
    }

    const audio = this.createAudio(source);
    if (!audio) {
      return;
    }
    audio.preload = "auto";
    try {
      audio.load();
      this.preloadedSources.add(source);
    } catch {
      // Ignore preload failures silently.
    }
  }

  private createAudio(source: string): HTMLAudioElement | null {
    try {
      return new Audio(source);
    } catch {
      return null;
    }
  }

  private enforcePolyphony() {
    while (this.activeAudioQueue.length >= MAX_POLYPHONY) {
      const oldest = this.activeAudioQueue.shift();
      if (!oldest) {
        break;
      }
      try {
        oldest.pause();
        oldest.currentTime = 0;
      } catch {
        // Ignore and continue.
      }
      this.releaseAudio(oldest);
    }
  }

  private releaseAudio(audio: HTMLAudioElement) {
    audio.onended = null;
    audio.onerror = null;
    const index = this.activeAudioQueue.indexOf(audio);
    if (index >= 0) {
      this.activeAudioQueue.splice(index, 1);
    }
  }

  private async fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = () => reject(new Error("Could not read uploaded sound."));
      reader.readAsDataURL(file);
    });
  }

  private playFallbackTone(eventName: SoundEventName, volumeMultiplier: number) {
    if (eventName !== "error" || this.muted || typeof window === "undefined") {
      return;
    }

    const Ctx =
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;

    if (!Ctx) {
      return;
    }

    try {
      if (!this.context) {
        this.context = new Ctx();
      }

      const osc = this.context.createOscillator();
      const gain = this.context.createGain();

      const baseFrequency = 180;
      const targetVolume = this.clamp(this.volume * volumeMultiplier * 0.2, 0, 1);
      const startAt = this.context.currentTime;
      const endAt = startAt + 0.14;

      osc.type = "sine";
      osc.frequency.value = baseFrequency;
      gain.gain.value = 0.0001;

      osc.connect(gain);
      gain.connect(this.context.destination);

      gain.gain.exponentialRampToValueAtTime(
        Math.max(targetVolume, 0.0001),
        startAt + 0.01
      );
      gain.gain.exponentialRampToValueAtTime(0.0001, endAt);

      osc.start(startAt);
      osc.stop(endAt);
    } catch {
      // Silent fallback on purpose.
    }
  }

  private clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
  }
}

export const soundManager = new SoundManager();
