import { UploadPostService } from '../src/lib/scheduler/uploadPostService';
import assert from 'assert';

// Mock Fetch Implementation
const originalFetch = global.fetch;
let mockResponses: any[] = [];

function mockFetch(url: string | Request | URL, options?: RequestInit): Promise<Response> {
    const mock = mockResponses.shift();
    if (!mock) {
        throw new Error(`Unexpected fetch call to ${url}`);
    }

    if (mock.error) {
        return Promise.reject(new Error(mock.error));
    }

    return Promise.resolve({
        ok: mock.ok,
        status: mock.status || 200,
        statusText: mock.statusText || 'OK',
        json: () => Promise.resolve(mock.data),
        blob: () => Promise.resolve(new Blob(['mock-content'])),
    } as Response);
}

// Helper to run tests
async function runTests() {
    console.log('Running UploadPostService Tests...');
    
    // Setup Mock
    global.fetch = mockFetch as any;

    const service = new UploadPostService({ apiKey: 'test-api-key' });

    try {
        // Test 1: List Scheduled Posts
        console.log('\nTest 1: List Scheduled Posts');
        mockResponses.push({
            ok: true,
            data: [
                { job_id: 'job1', scheduled_date: '2025-01-01T10:00:00Z', title: 'Test Post' }
            ]
        });

        const posts = await service.listScheduledPosts();
        assert.strictEqual(posts.length, 1);
        assert.strictEqual(posts[0].job_id, 'job1');
        console.log('✅ Passed');

        // Test 2: Create Scheduled Post
        console.log('\nTest 2: Create Scheduled Post');
        // Mock fetch for image download
        mockResponses.push({ ok: true }); 
        // Mock fetch for upload API
        mockResponses.push({
            ok: true,
            data: { success: true, job_id: 'job2' }
        });

        const result = await service.createScheduledPost(
            {
                type: 'image',
                imageUrl: 'http://example.com/image.jpg',
                caption: 'Test Caption',
                hashtags: ['test'],
                description: 'desc'
            },
            ['twitter'],
            new Date('2025-01-02T10:00:00Z')
        );

        assert.strictEqual(result.success, true);
        assert.strictEqual(result.job_id, 'job2');
        console.log('✅ Passed');

        // Test 3: Retry Logic
        console.log('\nTest 3: Retry Logic');
        // Fail once
        mockResponses.push({ error: 'Network Error' });
        // Succeed second time
        mockResponses.push({
            ok: true,
            data: { success: true }
        });

        await service.cancelScheduledPost('job3');
        console.log('✅ Passed (Retried successfully)');

        // Test 4: Error Handling (401)
        console.log('\nTest 4: Error Handling (401)');
        mockResponses.push({
            ok: false,
            status: 401,
            statusText: 'Unauthorized'
        });

        try {
            await service.listScheduledPosts();
            console.error('❌ Failed (Should have thrown)');
        } catch (e: any) {
            assert.ok(e.message.includes('Unauthorized'));
            console.log('✅ Passed (Caught expected error)');
        }

        // Test 5: Get Job Status
        console.log('\nTest 5: Get Job Status');
        mockResponses.push({
            ok: true,
            data: { status: 'published', job_id: 'job4' }
        });

        const status = await service.getJobStatus('job4');
        assert.strictEqual(status.status, 'published');
        console.log('✅ Passed');

        // Test 6: Missing Image URL Validation
        console.log('\nTest 6: Missing Image URL Validation');
        try {
            await service.createScheduledPost(
                {
                    type: 'image',
                    imageUrl: '', // Empty URL
                    caption: 'Test',
                    hashtags: [],
                    description: 'desc'
                },
                ['instagram'],
                new Date('2025-01-01T10:00:00Z')
            );
            console.error('❌ Failed (Should have thrown)');
        } catch (e: any) {
            assert.ok(e.message.includes('Image URL is required'));
            console.log('✅ Passed (Caught expected validation error)');
        }

    } catch (error) {
        console.error('❌ Test Failed:', error);
        process.exit(1);
    } finally {
        // Restore fetch
        global.fetch = originalFetch;
    }
}

// Run the tests
runTests().catch(console.error);
