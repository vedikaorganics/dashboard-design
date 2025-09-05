# Migration Plan: Cloudflare Stream to Mux (Direct Upload)

## Overview
Replace Cloudflare Stream with Mux using Direct Upload approach - videos upload directly from browser to Mux, while images continue through our server to Cloudflare Images.

## New Upload Flow

### Before (Current)
```
Browser → Our Server (FormData) → Cloudflare Images/Stream
```

### After (New)
```
Images: Browser → Our Server (FormData) → Cloudflare Images
Videos: Browser → Mux (Direct Upload)
```

## Migration Plan - Direct Browser Upload for Videos

### Phase 1: Install Dependencies (5 min)
```bash
npm install @mux/mux-node
npm install @mux/upchunk  # For chunked uploads in browser
```

### Phase 2: Create Upload URL Endpoint (15 min)
New file `/api/cms/media/upload-url/route.ts`:
- Creates Mux Direct Upload URL
- Returns upload URL and upload ID
- Sets asset settings (playback policy, etc.)

### Phase 3: Update MediaUploader Component (20 min)
Split upload logic by file type:
- Images → Keep FormData to our API
- Videos → Get upload URL, then upload directly to Mux
- Use @mux/upchunk for chunked uploads
- Show progress for both types

### Phase 4: Create Completion Endpoint (10 min)
New file `/api/cms/media/complete-upload/route.ts`:
- Receives upload ID after Mux upload completes
- Fetches asset details from Mux
- Saves metadata to MongoDB
- Returns playback URLs

### Phase 5: Update src/lib/mux.ts (10 min)
Helper functions:
- createDirectUpload()
- getAssetDetails()
- deleteAsset()
- getMuxPlaybackUrl()
- getMuxThumbnailUrl()

### Phase 6: Update Delete Endpoint (5 min)
`/api/cms/media/[id]/route.ts`:
- Check asset type
- Images → deleteImageFromCloudflare()
- Videos → deleteVideoFromMux()

### Phase 7: Clean Up Cloudflare Video Code (5 min)
In `cloudflare.ts`:
- Remove all video-related functions
- Keep all image functions

### Phase 8: Update next.config.ts (3 min)
- Remove CLOUDFLARE_STREAM_CUSTOMER_CODE
- Remove cloudflarestream.com domains
- Add Mux domains (stream.mux.com, image.mux.com)

### Phase 9: Test Complete Flow (10 min)
- Upload mixed files (images + videos)
- Verify images go to Cloudflare
- Verify videos go to Mux
- Test preview and delete

### Phase 10: Add Upload Progress UI (15 min)
Create persistent toast notifications for upload progress:
- Show individual progress for each file
- Stack multiple file uploads in bottom-right corner
- Display file name, size, and progress percentage
- Show upload speed and time remaining
- Success/error states for each file
- Ability to cancel ongoing uploads
- Use Sonner's toast.promise or custom toast component

Example implementation:
```tsx
// For each file being uploaded
toast.custom((t) => (
  <div className="flex items-center gap-3 p-3">
    <FileVideo className="w-4 h-4" />
    <div className="flex-1">
      <p className="text-sm font-medium">{file.name}</p>
      <Progress value={progress} className="h-1 mt-1" />
    </div>
    <span className="text-xs">{progress}%</span>
  </div>
), {
  duration: Infinity,
  position: 'bottom-right'
})
```

**Total: ~98 minutes**

## Benefits of Direct Upload
1. **Reduced Server Load** - Videos bypass our server
2. **Faster Uploads** - Direct path to Mux CDN
3. **Better Progress Tracking** - Real-time from browser
4. **Resumable Uploads** - Can resume interrupted uploads
5. **No Temp Storage** - No temporary files on server

---

## Status: Planning Complete ✅