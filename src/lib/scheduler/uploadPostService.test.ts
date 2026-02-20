
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UploadPostService } from './uploadPostService';

// Mock global fetch and FormData
global.fetch = vi.fn(() =>
    Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
        status: 200,
        statusText: 'OK'
    } as Response)
);
global.FormData = class FormData {
    private data = new Map<string, any>();
    append(key: string, value: any) {
        this.data.set(key, value);
    }
    get(key: string) {
        return this.data.get(key);
    }
} as any;

describe('UploadPostService', () => {
    let service: any;
    const mockApiKey = 'test-api-key';

    beforeEach(() => {
        service = new UploadPostService({ apiKey: mockApiKey, username: 'test-user' });
        vi.clearAllMocks();
    });

    it('should upload valid base64 file successfully using files[] field', async () => {
        const mockResponse = { success: true, job_id: 'job-123' };

        // Setup sequential mocks
        (global.fetch as any).mockReset();
        (global.fetch as any)
            .mockResolvedValueOnce({ ok: true, json: async () => ({}) }) // Profile check
            .mockResolvedValueOnce({ ok: true, json: async () => mockResponse }); // Upload

        // Mock resolveFile to return a blob
        vi.spyOn(service as any, 'resolveFile').mockResolvedValue(new Blob(['test'], { type: 'image/png' }));

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
        (global.fetch as any).mockReset();
        (global.fetch as any)
            .mockResolvedValueOnce({ ok: true, json: async () => ({}) }) // Profile check
            .mockResolvedValueOnce({ // Upload fails
                ok: false,
                status: 400,
                json: async () => ({ error: 'Photo files or URLs are required' })
            })
            .mockResolvedValueOnce({ // Retry succeeds
                ok: true,
                json: async () => ({ success: true, job_id: 'job-retry' })
            });

        vi.spyOn(service as any, 'resolveFile').mockResolvedValue(new Blob(['test'], { type: 'image/png' }));

        const content = {
            type: 'image',
            imageUrl: 'https://example.com/image.png', // Must be http for URL retry
            caption: 'Test',
            hashtags: []
        };

        const result = await service.createScheduledPost(content, ['twitter'], new Date());

        expect(result.success).toBe(true);
        expect(result.job_id).toBe('job-retry');
        expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('should throw error if file is missing and cannot fallback', async () => {
        (global.fetch as any).mockReset();
        (global.fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ({}) }); // Profile check
        vi.spyOn(service as any, 'resolveFile').mockResolvedValue(new Blob([], { type: '' }));

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
