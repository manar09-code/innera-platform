import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import OpenAI from 'openai';
import * as cors from 'cors';

admin.initializeApp();

const openai = new OpenAI({
  apiKey: functions.config().openai?.key || process.env.OPENAI_API_KEY,
});

const corsHandler = cors({ origin: true });

export const aiChat = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    try {
      const { message, context } = req.body;

      if (!message) {
        res.status(400).json({ error: 'Message is required' });
        return;
      }

      const systemPrompt =
        data.instructions ||
        `You are the AI assistant of the Innera Platform. You help users understand features, profiles, feeds, authentication, and dashboard. Be short, clear, and friendly.`;

      let enhancedPrompt = systemPrompt;
      if (context) {
        enhancedPrompt += ` Current context: Page - ${context.page || 'unknown'}, User role - ${
          context.role || 'unknown'
        }.`;
      }

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: enhancedPrompt },
          { role: 'user', content: message },
        ],
        max_tokens: 150,
        temperature: 0.7,
      });

      const reply =
        completion.choices[0]?.message?.content?.trim() ||
        'Sorry, I could not generate a response.';

      console.log(`Request received: ${req.method} ${req.path}`);
      res.status(200).json({ reply });
    } catch (error) {
      console.error('Error calling OpenAI:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
});
