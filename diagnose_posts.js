
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
const fs = require('fs');

const firebaseConfig = {
    apiKey: 'AIzaSyCg1cSQ5-QWS36inKYa358kITk8-NfHVXA',
    authDomain: 'innera-platform.firebaseapp.com',
    projectId: 'innera-platform',
    storageBucket: 'innera-platform.firebasestorage.app',
    messagingSenderId: '355196161108',
    appId: '1:355196161108:web:92626193ed0841b7d331c1',
    measurementId: 'G-CYNZVBXF76',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function diagnose() {
    let output = '--- ALL POSTS IN DB ---\n';
    try {
        const querySnapshot = await getDocs(collection(db, 'posts'));
        output += `Total posts found: ${querySnapshot.size}\n`;
        let count = 0;
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            if (count < 10) {
                output += `ID: ${doc.id} | DATA: ${JSON.stringify(data)}\n`;
            } else {
                output += `ID: ${doc.id} | Author: ${data.author} | Comm: "${data.communityName}" | UserID: "${data.userId}"\n`;
            }
            count++;
        });
    } catch (err) {
        output += `Error fetching posts: ${err.message}\n`;
    }
    fs.writeFileSync('db_diagnostic.txt', output);
    console.log('Done.');
    process.exit(0);
}

diagnose();
