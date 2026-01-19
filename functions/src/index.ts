import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import OpenAI from 'openai';

admin.initializeApp();

// Access config safely
const firebaseConfig = (functions.config() as any);
const openaiKey = firebaseConfig.openai?.key || process.env.OPENAI_API_KEY;

const openai = new OpenAI({
  apiKey: openaiKey || '',
});

export const aiChat = functions.https.onCall(async (data: any, context: any) => {
  if (!openaiKey) {
    console.error('Missing OpenAI API Key in Cloud Functions config.');
    throw new functions.https.HttpsError('failed-precondition', 'OpenAI API key is not configured on the server.');
  }

  const { message, context: clientContext } = data;

  if (!message) {
    throw new functions.https.HttpsError('invalid-argument', 'Message is required');
  }

  try {
    // Load AI instructions, news, and community info from Firestore or use defaults
    let aiInstructions = '';
    let aiNews = '';
    let communityInfo = null;

    try {
      const db = admin.firestore();
      const configDoc = await db.collection('config').doc('ai').get();
      if (configDoc.exists) {
        const configData = configDoc.data();
        aiInstructions = configData?.instructions || '';
        aiNews = configData?.news || '';
      }

      const communityDoc = await db.collection('config').doc('community').get();
      if (communityDoc.exists) {
        communityInfo = communityDoc.data();
      }
    } catch (error) {
      console.log('Could not load AI config from Firestore, using defaults');
    }

    // Client-side overrides/fallbacks
    if (clientContext?.aiInstructions) aiInstructions = clientContext.aiInstructions;
    if (clientContext?.news) aiNews = clientContext.news;
    if (clientContext?.communityInfo) communityInfo = clientContext.communityInfo;

    let systemPrompt = `You are the AI assistant of the Innera Platform. You help users understand features, profiles, feeds, authentication, and user management. You are also helpful and can answer general questions, assist with coding, or provide creative content if asked. Be polite, direct, and fast answering.`;

    if (aiInstructions) {
      systemPrompt = `${aiInstructions}\n\nBase context: ${systemPrompt}`;
    }

    if (aiNews) {
      systemPrompt += `\n\nLATEST COMMUNITY NEWS:\n${aiNews}\n(Use this to answer questions about what's new)`;
    }

    if (communityInfo) {
      systemPrompt += `\n\nCommunity Information:\n- Description: ${communityInfo.description || 'Not provided'}\n- Rules: ${communityInfo.rules || 'Not provided'}\n- Member Count: ${communityInfo.memberCount || 0}`;
    }

    // Dynamic context
    let dynamicContext = `\n\n[REAL-TIME CONTEXT]\nDate: ${new Date().toDateString()}\nTime: ${new Date().toLocaleTimeString()}\nAdmin Contact: admin@innera.com`;

    try {
      const db = admin.firestore();
      const postsRef = db.collection('posts');
      const recentSnap = await postsRef.orderBy('time', 'desc').limit(5).get();
      if (!recentSnap.empty) {
        dynamicContext += `\n\nRecent Posts:\n`;
        const tags = new Set<string>();
        recentSnap.docs.forEach((d: any) => {
          const postData = d.data();
          const date = postData.time && typeof postData.time.toDate === 'function' ? postData.time.toDate().toDateString() : 'Unknown date';
          dynamicContext += `- [${date}] ${postData.author}: ${postData.content}\n`;
          if (postData.tags && Array.isArray(postData.tags)) postData.tags.forEach((t: string) => tags.add(t));
        });
        if (tags.size > 0) dynamicContext += `\nTrending Hashtags: ${Array.from(tags).join(', ')}`;
      }

      const adminPostSnap = await postsRef.where('authorRole', '==', 'admin').orderBy('time', 'desc').limit(1).get();
      if (!adminPostSnap.empty) {
        const lastAdminPost = adminPostSnap.docs[0].data();
        const date = lastAdminPost.time && typeof lastAdminPost.time.toDate === 'function' ? lastAdminPost.time.toDate().toDateString() : 'Unknown';
        dynamicContext += `\n\nLast Admin Post: "${lastAdminPost.content}" on ${date}`;
      }
    } catch (e) {
      console.error("Error fetching dynamic context for AI:", e);
    }

    systemPrompt += dynamicContext;

    let enhancedPrompt = systemPrompt;
    if (clientContext) {
      enhancedPrompt += `\n\nCurrent context: Page - ${clientContext.page || 'unknown'}, User role - ${clientContext.role || 'unknown'}.`;

      if (clientContext.feedPosts && clientContext.feedPosts.length > 0) {
        enhancedPrompt += `\n\nRecent community posts (last ${clientContext.feedPosts.length}):`;
        clientContext.feedPosts.forEach((post: any, index: number) => {
          enhancedPrompt += `\n${index + 1}. ${post.author}: "${post.content}" (${post.likes} likes, ${post.comments} comments)`;
          if (post.tags && post.tags.length > 0) enhancedPrompt += ` [Tags: ${post.tags.join(', ')}]`;
        });
      }
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: enhancedPrompt },
        { role: 'user', content: message },
      ],
      max_tokens: 400,
      temperature: 0.7,
    });

    const reply = completion.choices[0]?.message?.content?.trim() || 'Sorry, I could not generate a response.';

    // If user is sending message, save to admin messages (logging)
    if (clientContext?.role === 'user') {
      await admin.firestore().collection('adminMessages').add({
        message,
        reply,
        userEmail: clientContext.userEmail || 'unknown',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    return { reply };
  } catch (error: any) {
    console.error('Error calling OpenAI:', error);
    throw new functions.https.HttpsError('internal', error.message || 'Internal server error');
  }
});
