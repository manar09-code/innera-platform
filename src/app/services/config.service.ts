import { Injectable } from '@angular/core';
import { Firestore, doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { firestore } from '../firebase.config';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {

  constructor() { }

  // Save AI configuration (instructions and news) to Firestore
  async saveConfig(instructions: string, news: string, openaiKey: string = ''): Promise<void> {
    try {
      const configRef = doc(firestore, 'config', 'ai');
      // Using setDoc to overwrite/create the document
      await setDoc(configRef, {
        instructions: instructions,
        news: news,
        openaiKey: openaiKey,
        updatedAt: new Date()
      });
    } catch (error: any) {
      console.error('Error saving AI config:', error);
      throw new Error(`Failed to save config: ${error.message || error}`);
    }
  }

  // Get AI configuration from Firestore
  async getConfig(): Promise<{ instructions: string; news: string; openaiKey: string }> {
    try {
      const configRef = doc(firestore, 'config', 'ai');
      const docSnap = await getDoc(configRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          instructions: data['instructions'] || '',
          news: data['news'] || '',
          openaiKey: data['openaiKey'] || ''
        };
      }
      return { instructions: '', news: '', openaiKey: '' };
    } catch (error) {
      console.error('Error getting AI config:', error);
      return { instructions: '', news: '', openaiKey: '' };
    }
  }

  // Listen to real-time updates for AI configuration
  listenToConfig(callback: (config: { instructions: string; news: string }) => void): () => void {
    const configRef = doc(firestore, 'config', 'ai');
    const unsubscribe = onSnapshot(configRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        callback({
          instructions: data['instructions'] || '',
          news: data['news'] || ''
        });
      } else {
        callback({ instructions: '', news: '' });
      }
    });
    return unsubscribe;
  }
}
