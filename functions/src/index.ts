import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import OpenAI from 'openai';
import * as cors from 'cors';
import { seedPosts } from './seed-posts';

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

      // Load AI instructions and community info from Firestore or use defaults
      let aiInstructions = '';
      let communityInfo = null;
      
      try {
        // Try to get AI instructions from Firestore (stored by admin)
        const instructionsDoc = await admin.firestore().collection('aiConfig').doc('instructions').get();
        if (instructionsDoc.exists) {
          aiInstructions = instructionsDoc.data()?.instructions || '';
        }
        
        // Try to get community info
        const communityDoc = await admin.firestore().collection('aiConfig').doc('community').get();
        if (communityDoc.exists) {
          communityInfo = communityDoc.data();
        }
      } catch (error) {
        console.log('Could not load AI config from Firestore, using defaults');
      }
      
      // Also check if instructions/community info are passed in context (from localStorage)
      if (context?.aiInstructions) {
        aiInstructions = context.aiInstructions;
      }
      if (context?.communityInfo) {
        communityInfo = context.communityInfo;
      }

      let systemPrompt = `You are the AI assistant of the Innera Platform. You help users understand features, profiles, feeds, authentication, and user management. Be short, clear, and friendly.`;
      
      // Add custom instructions if available
      if (aiInstructions) {
        systemPrompt = `${aiInstructions}\n\nBase context: ${systemPrompt}`;
      }
      
      // Add community information if available
      if (communityInfo) {
        systemPrompt += `\n\nCommunity Information:\n- Description: ${communityInfo.description || 'Not provided'}\n- Rules: ${communityInfo.rules || 'Not provided'}\n- Member Count: ${communityInfo.memberCount || 0}`;
      }

      let enhancedPrompt = systemPrompt;
      if (context) {
        enhancedPrompt += `\n\nCurrent context: Page - ${context.page || 'unknown'}, User role - ${
          context.role || 'unknown'
        }.`;

        // Add recent posts context for community questions
        if (context.feedPosts && context.feedPosts.length > 0) {
          enhancedPrompt += `\n\nRecent community posts (last ${context.feedPosts.length}):`;
          context.feedPosts.forEach((post: any, index: number) => {
            enhancedPrompt += `\n${index + 1}. ${post.author}: "${post.content}" (${post.likes} likes, ${post.comments} comments)`;
            if (post.tags && post.tags.length > 0) {
              enhancedPrompt += ` [Tags: ${post.tags.join(', ')}]`;
            }
          });
          enhancedPrompt += `\n\nYou can reference these posts when answering questions about community content, discussions, or popular topics.`;
        }
      }

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: enhancedPrompt },
          { role: 'user', content: message },
        ],
        max_tokens: 300,
        temperature: 0.7,
      });

      const reply =
        completion.choices[0]?.message?.content?.trim() ||
        'Sorry, I could not generate a response.';

      // If user is sending message, save to admin messages
      if (context.role === 'user') {
        await admin
          .firestore()
          .collection('adminMessages')
          .add({
            message,
            userEmail: context.userEmail || 'unknown',
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
          });
      }

      console.log(`Request received: ${req.method} ${req.path}`);
      res.status(200).json({ reply });
    } catch (error) {
      console.error('Error calling OpenAI:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
});
