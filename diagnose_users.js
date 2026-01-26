const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

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
    console.log('--- DIAGNOSING USERS ---');
    try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        console.log(`Total users found: ${querySnapshot.size}`);
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            console.log(`- DocID: ${doc.id}`);
            console.log(`  UID (id field): ${data.id}`);
            console.log(`  Email: ${data.email}`);
            console.log(`  Role: ${data.role}`);
            console.log(`  Community: "${data.communityName}"`);
            console.log(`  Name: ${data.username || data.adminName}`);
            console.log('-------------------');
        });
    } catch (err) {
        console.error('Error fetching users:', err.message);
    }
    process.exit(0);
}

diagnose();
