This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Configuration

### Environment Variables

1.  Copy `.env` (or create one) and ensure the following keys are set:

    ```bash
    # Upload-Post API Key (Required for scheduling)
    # Get your API key from https://upload-post.com/dashboard/api-keys
    UPLOAD_POST_API_KEY=your_api_key_here
    ```

## Social Media Scheduling

This project integrates with [Upload-Post.com](https://upload-post.com) to schedule and publish content to multiple social media platforms (Instagram, TikTok, LinkedIn, etc.).

### Using the Scheduling Service

The `UploadPostService` provides a robust interface for managing scheduled posts.

```typescript
import { UploadPostService } from '@/lib/scheduler/uploadPostService';

// Initialize the service
const scheduler = new UploadPostService({
  apiKey: process.env.UPLOAD_POST_API_KEY!
});

// 1. Create a Scheduled Post
const result = await scheduler.createScheduledPost(
  {
    type: 'image',
    imageUrl: 'https://example.com/image.jpg', // URL or local path in public/
    caption: 'My awesome post!',
    hashtags: ['awesome', 'social'],
    description: '...'
  },
  ['instagram', 'linkedin'], // Target platforms
  new Date('2025-01-01T12:00:00Z') // Schedule time (UTC)
);

console.log('Scheduled Job ID:', result.job_id);

// 2. List Scheduled Posts
const posts = await scheduler.listScheduledPosts();
console.log(posts);

// 3. Update a Scheduled Post
await scheduler.updateScheduledPost('job_id_here', {
  title: 'New Title',
  scheduled_date: '2025-01-02T10:00:00Z'
});

// 4. Cancel a Scheduled Post
await scheduler.cancelScheduledPost('job_id_here');
```

### Features

*   **Robust Error Handling**: Handles API errors (401, 404, etc.) gracefully with typed errors.
*   **Retry Logic**: Automatically retries transient network errors (e.g. 500, timeouts) with exponential backoff.
*   **File Handling**: Supports scheduling via remote URLs or local files (in `public/uploads`).

## Testing

Unit and integration tests for the scheduling service are available in `scripts/test-upload-post.ts`.

To run the tests:

```bash
npx tsx scripts/test-upload-post.ts
```

This script runs a series of tests against a mock API implementation to verify:
*   Listing posts
*   Creating posts
*   Retry logic (network failures)
*   Error handling (authentication, not found)

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
