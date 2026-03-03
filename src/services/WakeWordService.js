import WakeWord from '../plugins/WakeWord';
import { Capacitor } from '@capacitor/core';

class WakeWordService {
  constructor() {
    this.isInitialized = false;
    this.isActive = false;
    this.onWakeWordCallback = null;
  }

  async initialize(onWakeWordDetected) {
    // Only works on Android
    if (!Capacitor.isNativePlatform()) {
      console.warn('⚠️ Wake word detection only works on Android');
      return false;
    }

    try {
      // Initialize Porcupine with "Hey Ammu" model
      await WakeWord.initialize();

      // Store callback
      this.onWakeWordCallback = onWakeWordDetected;

      // Add listener for "Hey Ammu" detection
      await WakeWord.addListener('ammuWakeDetected', (event) => {
        console.log('🎙️ Hey Ammu detected!', event);

        if (this.onWakeWordCallback) {
          this.onWakeWordCallback(event);
        }
      });

      this.isInitialized = true;
      console.log('✅ Hey Ammu wake word service initialized');
      return true;

    } catch (error) {
      console.error('❌ Failed to initialize wake word service:', error);
      return false;
    }
  }

  async start() {
    if (!this.isInitialized) {
      console.error('Wake word service not initialized');
      return false;
    }

    try {
      await WakeWord.start();
      this.isActive = true;
      console.log('🎙️ Wake word detection started - say "Hey Ammu" to activate');
      return true;
    } catch (error) {
      console.error('❌ Failed to start wake word detection:', error);
      return false;
    }
  }

  async stop() {
    try {
      await WakeWord.stop();
      this.isActive = false;
      console.log('🎙️ Wake word detection stopped');
      return true;
    } catch (error) {
      console.error('Failed to stop wake word detection:', error);
      return false;
    }
  }

  async isListening() {
    try {
      const result = await WakeWord.isListening();
      return result.isListening;
    } catch (error) {
      return false;
    }
  }
}

export default new WakeWordService();

