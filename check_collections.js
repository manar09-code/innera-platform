const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, limit, query } = require('firebase/firestore');

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

async function checkCollections() {
    const collections = ['users', 'posts', 'messages', 'admins', 'adminMessages', 'config'];
    console.log('--- CHECKING COLLECTIONS ---');
    for (const name of collections) {
        try {
            const snap = await getDocs(query(collection(db, name), limit(1)));
            console.log(`Collection "${name}": ${snap.empty ? 'EMPTY' : 'HAS DATA'}`);
        } catch (err) {
            console.log(`Collection "${name}": ERROR (${err.message})`);
        }
    }
    process.exit(0);
}

checkCollections();
