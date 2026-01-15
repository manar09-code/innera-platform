import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AiAssistantComponent } from './pages/ai-assistant/ai-assistant';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, AiAssistantComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('innera-platform');
}
