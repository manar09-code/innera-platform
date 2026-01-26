// Import tools from Angular: Component for creating UI parts, signal for reactive data that updates automatically
import { Component, signal } from '@angular/core';
// Import RouterOutlet to show different pages based on the URL
import { RouterOutlet } from '@angular/router';
// Import the AI Assistant component so we can use it in this main app
import { AiAssistantComponent } from './pages/ai-assistant/ai-assistant';

// This decorator tells Angular that this class is a component (a building block of the app)
@Component({
  // The HTML tag name to use this component, like <app-root> in the browser
  selector: 'app-root',
  // Standalone means this component handles its own imports, not relying on a big module
  standalone: true,
  // List of other components or tools this component needs to work
  imports: [RouterOutlet, AiAssistantComponent],
  // Path to the HTML file that defines what this component looks like
  templateUrl: './app.html',
  // Path to the CSS file for styling this component
  styleUrl: './app.css',
})
// Define the main App class, which is the root of our Angular application
export class App {
  // A signal (reactive variable) that holds the app's title, protected so only this class can change it, readonly means it can't be directly modified
  protected readonly title = signal('innera-platform');

  constructor() {
    this.runAppDiagnostic();
  }

  async runAppDiagnostic() {
    try {
      const { firestore } = await import('./firebase.config');
      const { getDocs, collection, query, limit } = await import('firebase/firestore');

      console.log('--- ROOT APP DIAGNOSTIC ---');
      console.log('Project ID:', firestore.app.options.projectId);
      console.log('API Key:', firestore.app.options.apiKey);

      const snap = await getDocs(query(collection(firestore, 'posts'), limit(1)));
      console.log('Connection Test:', snap.empty ? 'SUCCESS (But collection empty)' : 'SUCCESS (Data found!)');
    } catch (e: any) {
      console.error('--- ROOT APP DIAGNOSTIC FAILED ---');
      console.error('Error:', e.message);
    }
  }
}
