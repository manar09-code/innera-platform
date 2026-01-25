
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function diagnose() {
    console.log('--- DIAGNOSING MESSAGES ---');
    const messages = await db.collection('messages').get();
    console.log(`Total messages in DB: ${messages.size}`);
    messages.forEach(doc => {
        const data = doc.data();
        console.log(`- ID: ${doc.id}, Sender: ${data.senderName}, Comm: "${data.communityName}", Receiver: ${data.receiverId}`);
    });

    console.log('\n--- DIAGNOSING POSTS ---');
    const posts = await db.collection('posts').get();
    console.log(`Total posts in DB: ${posts.size}`);
    posts.forEach(doc => {
        const data = doc.data();
        console.log(`- ID: ${doc.id}, Author: ${data.author}, Comm: "${data.communityName}", Type: ${data.type}`);
    });

    console.log('\n--- DIAGNOSING USERS ---');
    const users = await db.collection('users').get();
    console.log(`Total users in DB: ${users.size}`);
    users.forEach(doc => {
        const data = doc.data();
        console.log(`- ProfileDocID: ${doc.id}, UID: ${data.id}, Name: ${data.username || data.adminName}, Comm: "${data.communityName}", Role: ${data.role}`);
    });
}

diagnose();
