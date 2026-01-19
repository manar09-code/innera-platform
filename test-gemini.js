const https = require('https');

async function listModels(apiKey) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    const models = JSON.parse(data);
                    console.log('Available Models:', JSON.stringify(models, null, 2));
                    resolve(models);
                } else {
                    console.error('Error listing models:', res.statusCode, data);
                    reject(data);
                }
            });
        }).on('error', (err) => {
            console.error('HTTPS Error:', err);
            reject(err);
        });
    });
}

// I don't have the key here, so I'll ask the user to run this or try to get it from firestore in another step.
// Actually, I can't easily get it here without firebase-admin.
// I'll just provide this as a way for the user to help me if needed,
// but first I'll try one more guess: gemini-1.5-flash-8b
