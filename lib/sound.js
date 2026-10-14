// Audio feedback and Desktop Push Notification manager using Web Audio API and Notification API
// Zero external assets or dependencies required

class SoundFX {
  constructor() {
    this.ctx = null;
    this.hasUnlocked = false;

    // Attach one-time unlock listener in browser environment
    if (typeof window !== "undefined") {
      const unlock = () => {
        this.init();
        if (this.ctx && this.ctx.state === "suspended") {
          this.ctx.resume().catch(() => {});
        }
        this.hasUnlocked = true;
        window.removeEventListener("click", unlock);
        window.removeEventListener("keydown", unlock);
        window.removeEventListener("touchstart", unlock);
      };
      window.addEventListener("click", unlock, { passive: true });
      window.addEventListener("keydown", unlock, { passive: true });
      window.addEventListener("touchstart", unlock, { passive: true });
    }
  }

  init() {
    if (typeof window !== "undefined" && !this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
  }

  // Request browser desktop push notification permission
  async requestNotificationPermission() {
    this.init();
    if (this.ctx && this.ctx.state === "suspended") {
      try {
        await this.ctx.resume();
      } catch {}
    }

    if (typeof window === "undefined" || !("Notification" in window)) {
      return "unsupported";
    }

    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch {
      return "denied";
    }
  }

  // Send desktop push notification
  sendPushNotification(title, { body, tag, icon, requireInteraction = true, onClick } = {}) {
    if (typeof window === "undefined" || !("Notification" in window)) return null;

    if (Notification.permission === "granted") {
      try {
        const notif = new Notification(title, {
          body: body || "",
          icon: icon || "/favicon.ico",
          tag: tag || `notif_${Date.now()}`,
          requireInteraction: requireInteraction
        });

        notif.onclick = () => {
          try {
            window.focus();
          } catch {}
          if (onClick) onClick();
          notif.close();
        };

        return notif;
      } catch (e) {
        console.warn("Could not dispatch desktop notification:", e.message);
      }
    }
    return null;
  }

  // Multi-pulse loud & clear dispatch alert chime for support incoming broadcasts
  playIncomingAlert() {
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === "suspended") this.ctx.resume();

      const now = this.ctx.currentTime;

      // Pulse 1: Dual harmonized chime (880Hz A5 + 1046.5Hz C6)
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();

      osc1.type = "sine";
      osc1.frequency.setValueAtTime(880, now);
      osc1.frequency.exponentialRampToValueAtTime(1046.5, now + 0.15);

      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(440, now);
      osc2.frequency.exponentialRampToValueAtTime(523.25, now + 0.15);

      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.35, now + 0.04);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

      osc1.connect(gain1);
      osc2.connect(gain1);
      gain1.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.35);
      osc2.stop(now + 0.35);

      // Pulse 2: Second higher-pitch confirm chime (1046.5Hz C6 + 1318.5Hz E6)
      const osc3 = this.ctx.createOscillator();
      const osc4 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();

      const pulse2Time = now + 0.18;
      osc3.type = "sine";
      osc3.frequency.setValueAtTime(1046.5, pulse2Time);
      osc3.frequency.exponentialRampToValueAtTime(1318.51, pulse2Time + 0.18);

      osc4.type = "sine";
      osc4.frequency.setValueAtTime(523.25, pulse2Time);
      osc4.frequency.exponentialRampToValueAtTime(659.25, pulse2Time + 0.18);

      gain2.gain.setValueAtTime(0, pulse2Time);
      gain2.gain.linearRampToValueAtTime(0.38, pulse2Time + 0.04);
      gain2.gain.exponentialRampToValueAtTime(0.001, pulse2Time + 0.45);

      osc3.connect(gain2);
      osc4.connect(gain2);
      gain2.connect(this.ctx.destination);

      osc3.start(pulse2Time);
      osc4.start(pulse2Time);
      osc3.stop(pulse2Time + 0.48);
      osc4.stop(pulse2Time + 0.48);
    } catch {
      // Audio playback fails silently if browser policy blocks autoplay before interaction
    }
  }

  // Continuously play incoming broadcast alert ring until stopped
  startRingingAlert(intervalMs = 1800) {
    if (this.isRinging) return;
    this.isRinging = true;

    // Play immediately on first trigger
    this.playIncomingAlert();

    if (this.ringingIntervalId) {
      clearInterval(this.ringingIntervalId);
    }

    this.ringingIntervalId = setInterval(() => {
      if (!this.isRinging) {
        clearInterval(this.ringingIntervalId);
        this.ringingIntervalId = null;
        return;
      }
      this.playIncomingAlert();
    }, intervalMs);
  }

  // Stop continuous alert ringing immediately (e.g. when chat is accepted by any agent)
  stopRingingAlert() {
    this.isRinging = false;
    if (this.ringingIntervalId) {
      clearInterval(this.ringingIntervalId);
      this.ringingIntervalId = null;
    }
  }

  playMessageSound() {
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === "suspended") this.ctx.resume();

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.14);
    } catch {
      // ignore
    }
  }

  playSuccessSound() {
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === "suspended") this.ctx.resume();

      const now = this.ctx.currentTime;
      [440, 554.37, 659.25, 880].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0, now + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.22, now + idx * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.25);
      });
    } catch {
      // ignore
    }
  }

  playClaimedAlert() {
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === "suspended") this.ctx.resume();

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.linearRampToValueAtTime(180, now + 0.25);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    } catch {
      // ignore
    }
  }
}

export const sound = new SoundFX();
