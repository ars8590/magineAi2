const API_URL = 'http://localhost:4000';

async function verify() {
    try {
        const timestamp = Date.now();
        const user = {
            name: `Test User ${timestamp}`,
            email: `test${timestamp}@example.com`,
            password: 'password123'
        };

        console.log('1. Signing up user...');
        let res = await fetch(`${API_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user)
        });

        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Signup failed: ${res.status} ${res.statusText} - ${text}`);
        }
        const signupData = await res.json();
        const token = signupData.token;
        console.log('   Success! Token:', token.substring(0, 10) + '...');

        console.log('2. Generating content...');
        const genPayload = {
            age: 25,
            genre: 'SciFi',
            theme: 'Space Exploration',
            keywords: 'Mars, Colony',
            language: 'English',
            pages: 5
        };

        res = await fetch(`${API_URL}/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(genPayload)
        });

        if (!res.ok) throw new Error(`Generation failed: ${await res.text()}`);
        const generateData = await res.json();
        console.log('   Success! Content ID:', generateData.id);

        console.log('3. Fetching Library...');
        res = await fetch(`${API_URL}/library`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error(`Library fetch failed: ${res.statusText}`);
        const items = await res.json();
        console.log(`   Fetched ${items.length} items.`);

        const found = items.find(i => i.id === generateData.id);
        if (found) {
            console.log('   ✅ Verification PASSED: Created item found in library.');
            console.log(`   Genereted Images Count (Legacy): ${found.image_urls.length}`);

            // Structured Magazine Check
            try {
                const magazine = JSON.parse(found.main_story);
                console.log(`   ✅ Structured Magazine Detected: ${magazine.totalPages} pages.`);
                if (magazine.pages.length !== 5) {
                    console.warn(`   ⚠️ Pages mismatch in structure: Expected 5 but got ${magazine.pages.length}`);
                } else {
                    console.log(`   ✅ Correct number of structured pages (5).`);
                }
            } catch (e) {
                console.warn('   ⚠️ content.main_story is NOT valid JSON (Legacy format?)');
            }
        } else {
            console.error('   ❌ Verification FAILED: Created item NOT found in library.');
            process.exit(1);
        }

    } catch (error) {
        console.error('Verification failed:', error);
        process.exit(1);
    }
}

verify();
