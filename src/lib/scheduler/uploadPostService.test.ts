
import { UploadPostService } from './uploadPostService';

// Mock global fetch and FormData
global.fetch = jest.fn();
global.FormData = class FormData {
    constructor() {
        this.data = new Map();
    }
    append(key, value) {
        this.data.set(key, value);
    }
    get(key) {
        return this.data.get(key);
    }
};

describe('UploadPostService', () => {
    let service;
    const mockApiKey = 'test-api-key';

    beforeEach(() => {
        service = new UploadPostService({ apiKey: mockApiKey, username: 'test-user' });
        jest.clearAllMocks();
    });

    it('should upload valid base64 file successfully using files[] field', async () => {
        const mockResponse = { success: true, job_id: 'job-123' };
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => mockResponse
        });

        // Mock resolveFile to return a blob
        jest.spyOn(service as any, 'resolveFile').mockResolvedValue(new Blob(['test'], { type: 'image/png' }));

        const content = {
            type: 'image',
            imageUrl: 'data:image/png;base64,test',
            caption: 'Test',
            hashtags: []
        };

        const result = await service.createScheduledPost(content, ['twitter'], new Date());

        expect(result.success).toBe(true);
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/upload_photos'),
            expect.objectContaining({
                method: 'POST',
                body: expect.any(FormData)
            })
        );
    });

    it('should retry with URL upload on 400 "Photo files or URLs are required" error', async () => {
        // First call fails
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: false,
            status: 400,
            json: async () => ({ error: 'Photo files or URLs are required' })
        });

        // Second call (retry) succeeds
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true, job_id: 'job-retry' })
        });

        jest.spyOn(service as any, 'resolveFile').mockResolvedValue(new Blob(['test'], { type: 'image/png' }));

        const content = {
            type: 'image',
            imageUrl: 'https://example.com/image.png', // Must be http for URL retry
            caption: 'Test',
            hashtags: []
        };

        const result = await service.createScheduledPost(content, ['twitter'], new Date());

        expect(result.success).toBe(true);
        expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should throw error if file is missing and cannot fallback', async () => {
        jest.spyOn(service as any, 'resolveFile').mockResolvedValue(new Blob([], { type: '' }));

        const content = {
            type: 'image',
            imageUrl: 'invalid-url',
            caption: 'Test',
            hashtags: []
        };

        await expect(service.createScheduledPost(content, ['twitter'], new Date()))
            .rejects.toThrow('Failed to resolve file');
    });
});
