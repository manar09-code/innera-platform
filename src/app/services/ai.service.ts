import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class AiService {
    private selectedModelIndex: number = -1;
    private discoveredModels: string[] = [];

    constructor(private http: HttpClient) { }

    /**
     * Fetches all available Gemini models and filters them by priority.
     */
    private async discoverModels(apiKey: string): Promise<string[]> {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        try {
            const response: any = await firstValueFrom(this.http.get(url));
            const models = response.models || [];

            const priorities = [
                'models/gemini-1.5-flash',
                'models/gemini-1.5-flash-latest',
                'models/gemini-2.0-flash',
                'models/gemini-pro',
                'models/gemini-1.0-pro'
            ];

            const available = priorities.filter(p => models.some((m: any) => m.name === p));

            // Add any other models that support generateContent but aren't in our priority list
            // EXCLUDE models that are audio-only (contain 'tts' or 'audio')
            models.forEach((m: any) => {
                const isAudioOnly = m.name.includes('tts') || m.name.includes('audio');
                if (m.supportedGenerationMethods?.includes('generateContent') && !available.includes(m.name) && !isAudioOnly) {
                    available.push(m.name);
                }
            });

            console.log(`[AiService] Available text models for this key:`, available);
            return available;
        } catch (error) {
            console.error('[AiService] Model discovery failed:', error);
            return ['models/gemini-1.5-flash']; // Last resort fallback
        }
    }

    async getChatResponse(message: string, context: any, geminiKey: string): Promise<string> {
        const trimmedKey = geminiKey.trim();

        // Discover models if not already done
        if (this.discoveredModels.length === 0) {
            this.discoveredModels = await this.discoverModels(trimmedKey);
            this.selectedModelIndex = 0;
        }

        // Try models one by one if they fail with quota/not found errors
        while (this.selectedModelIndex < this.discoveredModels.length) {
            const currentModel = this.discoveredModels[this.selectedModelIndex];
            const url = `https://generativelanguage.googleapis.com/v1beta/${currentModel}:generateContent?key=${trimmedKey}`;

            let systemInstructions = `You are the AI assistant of the Innera Platform. ${context.aiInstructions || ''}`;
            if (context.news) systemInstructions += `\nLatest News: ${context.news}`;

            // ISSUE 3: Inject live statistics for grounding
            if (context.stats) {
                systemInstructions += `\n\nLive Community Stats for ${context.communityName}:` +
                    `\n- Total Posts: ${context.stats.totalPosts}` +
                    `\n- Total Likes: ${context.stats.totalLikes}` +
                    `\n- Total Comments: ${context.stats.totalComments}` +
                    `\n- Image Posts: ${context.stats.totalImagePosts}` +
                    `\n- Text Posts: ${context.stats.totalTextPosts}`;
            }

            if (context.trending && context.trending.length > 0) {
                systemInstructions += `\n\nPopular Posts (Most Liked/Commented):` +
                    context.trending.map((p: any) => `\n- "${p.content.substring(0, 50)}..." by ${p.author} (${p.likes} likes, ${p.comments?.length || p.commentCount || 0} comments)`).join('');
            }

            if (context.members && context.members.length > 0) {
                systemInstructions += `\n\nMost Active Members:` +
                    context.members.map((m: any) => `\n- ${m.name} (${m.count} posts)`).join('');
            }

            if (context.feedPosts && context.feedPosts.length > 0) {
                systemInstructions += `\n\nRecent Feed Posts:` +
                    context.feedPosts.map((p: any) => `\n- "${p.content.substring(0, 50)}..." by ${p.author} [Tags: ${p.tags.join(', ')}]`).join('');
            }

            systemInstructions += `\n\nRules: Only answer based on the data above. If you don't know, say you don't know. Do not hallucinate statistics. Provide specific names/numbers when asked.`;

            const fullPrompt = `${systemInstructions}\n\nUser Question: ${message}`;
            const body = { contents: [{ parts: [{ text: fullPrompt }] }] };
            const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

            try {
                console.log(`[AiService] Attempting chat with model: ${currentModel}`);
                const response: any = await firstValueFrom(this.http.post(url, body, { headers }));

                if (response.candidates && response.candidates[0] && response.candidates[0].content) {
                    return response.candidates[0].content.parts[0].text;
                }
                return "I received an empty response from Gemini.";
            } catch (error: any) {
                const errorMsg = error.error?.error?.message || error.message || '';
                console.warn(`[AiService] Error with model ${currentModel}:`, errorMsg);

                // If it's a Quota, Not Found, Overloaded, or Modality error, try the next model
                const isRetryable =
                    errorMsg.includes('quota') ||
                    errorMsg.includes('not found') ||
                    errorMsg.includes('overloaded') ||
                    errorMsg.includes('modalities') || // Filter out modality mismatches (e.g. TEXT not supported)
                    error.status === 429 ||
                    error.status === 404 ||
                    error.status === 503 ||
                    error.status === 400; // 400 often covers modality errors

                if (isRetryable) {
                    console.log(`[AiService] Model ${currentModel} failed (Retryable error: ${errorMsg}). Trying next...`);
                    this.selectedModelIndex++;
                    continue;
                }

                // For other errors, throw normally
                throw new Error(`Gemini Error: ${errorMsg}`);
            }
        }

        throw new Error('All available Gemini models failed or exceeded quota. Please check your Google AI Studio billing or region support.');
    }
}
