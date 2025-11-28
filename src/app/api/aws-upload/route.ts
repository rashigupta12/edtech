/*eslint-disable @typescript-eslint/no-explicit-any */
/*eslint-disable @typescript-eslint/no-unused-vars */
// src/app/api/aws-upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';

// AWS S3 Client setup
const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

interface CompressionLog {
  iteration: number;
  quality: number;
  format: string;
  sizeKB: number;
  compressionTime: number;
  targetMet: boolean;
  resized?: string;
}

interface CompressionResult {
  buffer: Buffer;
  type: string;
  extension: string;
  skippedCompression: boolean;
  logs: CompressionLog[];
  totalTime: number;
  totalIterations: number;
  finalQuality?: number;
  reason?: string;
  resolutionReduced?: boolean;
}

function getExtension(type: string): string {
  const extensions: { [key: string]: string } = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'video/mp4': '.mp4',
    'video/mpeg': '.mpeg',
    'video/quicktime': '.mov',
    'video/x-msvideo': '.avi',
    'video/webm': '.webm',
    'video/x-matroska': '.mkv'
  };
  return extensions[type] || '.bin';
}

function isImageType(type: string): boolean {
  return type.startsWith('image/');
}

function isVideoType(type: string): boolean {
  return type.startsWith('video/');
}

function isThumbnail(fileName: string, fileType?: string): boolean {
  const lowerName = fileName.toLowerCase();
  
  // Check filename for thumbnail indicators
  if (lowerName.includes('thumbnail') || lowerName.includes('thumb') || lowerName.includes('maxresdefault')) {
    return true;
  }
  
  // YouTube thumbnail detection
  if (fileName.includes('img.youtube.com') || fileName.includes('youtube')) {
    return true;
  }
  
  return false;
}


// Optimized compression for thumbnails - aggressive to keep under 50KB
async function compressImageThumbnail(buffer: Buffer, originalType: string): Promise<CompressionResult> {
  const startTime = Date.now();
  const logs: CompressionLog[] = [];
  
  try {
    const originalSizeKB = Math.round(buffer.length / 1024);
    
    // Skip if already tiny
    if (originalSizeKB <= 50) {
      return { 
        buffer, 
        type: originalType, 
        extension: getExtension(originalType),
        skippedCompression: true,
        logs: [],
        totalTime: Date.now() - startTime,
        totalIterations: 0,
        reason: 'Thumbnail already optimized'
      };
    }

    let image = sharp(buffer);
    const metadata = await image.metadata();

    // Resize to common thumbnail dimension (640x360 or 640x480)
    const aspectRatio = (metadata.width || 640) / (metadata.height || 360);
    const width = 640;
    const height = Math.round(640 / aspectRatio);

    image = image.resize(width, height, {
      fit: 'cover',
      withoutEnlargement: true,
    });

    // Aggressive compression for thumbnails
    const finalBuffer = await image
      .webp({ 
        quality: 70,  // Balanced for thumbnails
        effort: 6,    // Maximum compression effort
        nearLossless: false,
        alphaQuality: 100
      })
      .toBuffer();

    const finalSizeKB = Math.round(finalBuffer.length / 1024);
    const totalTime = Date.now() - startTime;

    const log: CompressionLog = {
      iteration: 1,
      quality: 70,
      format: 'WebP',
      sizeKB: finalSizeKB,
      compressionTime: totalTime,
      targetMet: finalSizeKB <= 50,
      resized: `${metadata.width}x${metadata.height} → ${width}x${height}`
    };
    logs.push(log);

    // If still over 50KB, reduce quality more
    if (finalSizeKB > 50) {
      const secondStart = Date.now();
      const secondBuffer = await sharp(buffer)
        .resize(width, height, { fit: 'cover', withoutEnlargement: true })
        .webp({ quality: 60, effort: 6 })
        .toBuffer();

      const secondSizeKB = Math.round(secondBuffer.length / 1024);
      const secondTime = Date.now() - secondStart;

      logs.push({
        iteration: 2,
        quality: 60,
        format: 'WebP',
        sizeKB: secondSizeKB,
        compressionTime: secondTime,
        targetMet: secondSizeKB <= 50
      });

      if (secondSizeKB < finalSizeKB) {
        return {
          buffer: secondBuffer,
          type: 'image/webp',
          extension: '.webp',
          skippedCompression: false,
          logs,
          totalTime: Date.now() - startTime,
          totalIterations: 2,
          finalQuality: 60,
          resolutionReduced: true
        };
      }
    }

    return {
      buffer: finalBuffer,
      type: 'image/webp',
      extension: '.webp',
      skippedCompression: false,
      logs,
      totalTime,
      totalIterations: 1,
      finalQuality: 70,
      resolutionReduced: true
    };

  } catch (error) {
    console.error('💥 Thumbnail compression failed:', error);
    return { 
      buffer, 
      type: originalType, 
      extension: getExtension(originalType),
      skippedCompression: false,
      logs,
      totalTime: Date.now() - startTime,
      totalIterations: 0,
      reason: 'Compression error'
    };
  }
}

// Fast compression function for images
async function compressImageFast(buffer: Buffer, originalType: string): Promise<CompressionResult> {
  const startTime = Date.now();
  const logs: CompressionLog[] = [];
  let iterationCount = 0;
  
  try {
    const originalSizeKB = Math.round(buffer.length / 1024);
    
    if (originalSizeKB <= 400) {
      return { 
        buffer, 
        type: originalType, 
        extension: getExtension(originalType),
        skippedCompression: true,
        logs: [],
        totalTime: Date.now() - startTime,
        totalIterations: 0,
        reason: 'Image already under 400KB'
      };
    }

    let image = sharp(buffer);
    const metadata = await image.metadata();

    let resolutionReduced = false;
    let resolutionInfo = '';

    if (originalSizeKB > 3000) {
      const maxDimension = originalSizeKB > 6000 ? 1920 : 2560;
      
      if (metadata.width! > maxDimension || metadata.height! > maxDimension) {
        image = image.resize(maxDimension, maxDimension, {
          fit: 'inside',
          withoutEnlargement: true,
        });
        
        const newMeta = await image.metadata();
        resolutionReduced = true;
        resolutionInfo = `${metadata.width}x${metadata.height} → ${newMeta.width}x${newMeta.height}`;
      }
    }

    let targetQuality: number;
    let targetFormat: 'webp' | 'jpeg';

    if (originalSizeKB > 5000) {
      targetQuality = 45;
      targetFormat = 'webp';
    } else if (originalSizeKB > 2000) {
      targetQuality = 55;
      targetFormat = 'webp';
    } else {
      targetQuality = 65;
      targetFormat = originalType.includes('gif') ? 'jpeg' : 'webp';
    }

    iterationCount = 1;
    const compressionStart = Date.now();

    let finalBuffer: Buffer;
    let finalType: string;
    let finalExtension: string;

    if (targetFormat === 'webp' && (originalType !== 'image/gif' || (metadata.pages && metadata.pages <= 1))) {
      finalBuffer = await image
        .webp({ 
          quality: targetQuality, 
          effort: 4,
          nearLossless: false
        })
        .toBuffer();
      finalType = 'image/webp';
      finalExtension = '.webp';
    } else {
      finalBuffer = await image
        .jpeg({ 
          quality: targetQuality, 
          progressive: true, 
          mozjpeg: true,
          overshootDeringing: false,
          optimizeScans: false
        })
        .toBuffer();
      finalType = 'image/jpeg';
      finalExtension = '.jpg';
    }

    const compressionTime = Date.now() - compressionStart;
    const finalSizeKB = Math.round(finalBuffer.length / 1024);
    const targetMet = finalSizeKB <= 1000;

    const log: CompressionLog = {
      iteration: 1,
      quality: targetQuality,
      format: targetFormat.toUpperCase(),
      sizeKB: finalSizeKB,
      compressionTime,
      targetMet,
      resized: resolutionReduced ? resolutionInfo : undefined
    };
    logs.push(log);
    
    if (finalSizeKB > 1000 && targetQuality > 35) {
      iterationCount++;
      const secondStart = Date.now();

      let secondBuffer: Buffer;
      if (targetFormat === 'webp') {
        secondBuffer = await image.webp({ quality: 35, effort: 3 }).toBuffer();
      } else {
        secondBuffer = await image.jpeg({ quality: 35, progressive: true, mozjpeg: true }).toBuffer();
      }

      const secondTime = Date.now() - secondStart;
      const secondSizeKB = Math.round(secondBuffer.length / 1024);
      const secondTargetMet = secondSizeKB <= 1000;

      const secondLog: CompressionLog = {
        iteration: 2,
        quality: 35,
        format: targetFormat.toUpperCase(),
        sizeKB: secondSizeKB,
        compressionTime: secondTime,
        targetMet: secondTargetMet
      };
      logs.push(secondLog);

      if (secondSizeKB <= 1000 || secondSizeKB < finalSizeKB) {
        finalBuffer = secondBuffer;
        targetQuality = 35;
      }
    }

    const finalTime = Date.now() - startTime;
    
    return {
      buffer: finalBuffer,
      type: finalType,
      extension: finalExtension,
      skippedCompression: false,
      logs,
      totalTime: finalTime,
      totalIterations: iterationCount,
      finalQuality: targetQuality,
      resolutionReduced
    };

  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error('💥 Fast compression failed:', error);
    
    return { 
      buffer, 
      type: originalType, 
      extension: getExtension(originalType),
      skippedCompression: false,
      logs,
      totalTime,
      totalIterations: iterationCount,
      reason: 'Compression failed due to error'
    };
  }
}

export async function POST(request: NextRequest) {
  const uploadStartTime = Date.now();
  
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    console.log(`📁 File: ${file.name} (${Math.round(file.size / 1024)}KB, ${file.type})`);

    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif'];
    const allowedVideoTypes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'video/x-matroska'];
    const allowedTypes = [...allowedImageTypes, ...allowedVideoTypes];
    
    const maxSize = 200 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Allowed: JPEG, PNG, GIF, WebP, MP4, MPEG, MOV, AVI, WebM, MKV' 
      }, { status: 400 });
    }

    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large (max 200MB)' }, { status: 400 });
    }

    const originalBuffer = Buffer.from(await file.arrayBuffer());
    const originalSizeKB = Math.round(originalBuffer.length / 1024);
    const isImage = isImageType(file.type);
    const isVideo = isVideoType(file.type);
    const isThumbnailFile = isThumbnail(file.name, file.type);

    let finalBuffer: Buffer = originalBuffer;
    let finalType: string = file.type;
    let finalExtension: string = getExtension(file.type);
    let optimization: any = {};
    let performance: any = {};

    // Process images with compression
    if (isImage) {
      let compressed: CompressionResult;
      
      // Use thumbnail compression for thumbnail files
      if (isThumbnailFile) {
        console.log(`🎬 Using thumbnail compression for ${originalSizeKB}KB`);
        compressed = await compressImageThumbnail(originalBuffer, file.type);
      }
 else if (originalSizeKB > 5000) {
        console.log(`⚡ Using ultra-fast compression for ${originalSizeKB}KB image`);
        compressed = await compressImageFast(originalBuffer, file.type);
      } else {
        console.log(`🚀 Using fast compression for ${originalSizeKB}KB image`);
        compressed = await compressImageFast(originalBuffer, file.type);
      }

      finalBuffer = compressed.buffer;
      finalType = compressed.type;
      finalExtension = compressed.extension;

      const finalSizeKB = Math.round(finalBuffer.length / 1024);
      const compressionRatio = ((1 - finalBuffer.length / originalBuffer.length) * 100);

      optimization = {
        originalSize: `${originalSizeKB}KB`,
        finalSize: `${finalSizeKB}KB`,
        compressionRatio: `${compressionRatio.toFixed(1)}%`,
        targetAchieved: isThumbnailFile ? finalSizeKB <= 50 : finalSizeKB <= 1000,
        finalFormat: finalType,
        compressionSkipped: compressed.skippedCompression,
        resolutionReduced: compressed.resolutionReduced,
        finalQuality: compressed.finalQuality,
      };

      performance = {
        totalIterations: compressed.totalIterations,
        compressionTime: `${compressed.totalTime}ms`,
        strategy: isThumbnailFile ? 'thumbnail-optimized' : (originalSizeKB > 5000 ? 'ultra-fast' : 'fast'),
        iterationLogs: compressed.logs,
      };
    } 
    else if (isVideo) {
      console.log(`🎬 Processing video: ${file.name}`);

      optimization = {
        originalSize: `${originalSizeKB}KB`,
        finalSize: `${originalSizeKB}KB`,
        compressionRatio: '0%',
        finalFormat: finalType,
        compressionSkipped: true,
        reason: 'Videos are uploaded without compression'
      };

      performance = {
        processingTime: '0ms',
        note: 'Direct upload without processing'
      };
    }

    // Generate filename and S3 key
    const baseName = file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9-]/g, '');
    const fileName = `${Date.now()}-${baseName}${finalExtension}`;
    const mediaType = isImage ? 'images' : 'videos';
    const folderType = isThumbnailFile ? 'thumbnails' : mediaType;
    const key = `futuretek/images/${folderType}/${fileName}`;

    console.log("Upload URL:", key);

    // Upload to S3
    const uploadStart = Date.now();
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME!,
      Key: key,
      Body: finalBuffer,
      ContentType: finalType,
      CacheControl: 'public, max-age=31536000, immutable', 
    });

    await s3Client.send(command);
    
    const uploadTime = Date.now() - uploadStart;
    const totalTime = Date.now() - uploadStartTime;

    const publicUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    console.log(`✅ Upload complete: ${fileName}`);

    return NextResponse.json({
      message: 'File uploaded successfully',
      url: publicUrl,
      key,
      fileName,
      fileType: isImage ? 'image' : 'video',
      isThumbnail: isThumbnailFile,
      optimization,
      performance: {
        ...performance,
        uploadTime: `${uploadTime}ms`,
        totalProcessTime: `${totalTime}ms`,
      },
    });

  } catch (error) {
    const totalTime = Date.now() - uploadStartTime;
    console.error(`💥 Error after ${totalTime}ms:`, error);
    
    return NextResponse.json(
      { 
        error: 'Upload failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        processingTime: `${totalTime}ms`
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'AWS Media Upload API - Images & Videos',
    features: {
      images: 'Automatic compression with 1MB target (JPEG, PNG, GIF, WebP)',
      thumbnails: 'Aggressive compression targeting <50KB with 640x360 resize',
      videos: 'Direct upload without compression (MP4, MPEG, MOV, AVI, WebM, MKV)',
      maxSize: '200MB',
      storage: 'Simple S3 storage without database dependency',
      caching: 'Long-term cache (1 year) for thumbnails'
    }
  });
}