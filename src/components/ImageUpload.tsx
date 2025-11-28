// components/courses/ImageUpload.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, Loader2 } from "lucide-react";
import { useState } from "react";
import Image from "next/image";

interface ImageUploadProps {
  label?: string;
  value: string;
  onChange: (url: string) => void;
  isThumbnail?: boolean;
}

export function ImageUpload({ 
  label = "Image", 
  value, 
  onChange,
  isThumbnail = true 
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string>(value);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/aws-upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const data = await response.json();
      
      // Update both preview and form value
      setPreview(data.url);
      onChange(data.url);

      console.log('Upload successful:', data);
    } catch (error) {
      console.error('Upload error:', error);
      alert(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview('');
    onChange('');
  };

  const handleManualInput = (url: string) => {
    setPreview(url);
    onChange(url);
  };

  // Determine aspect ratio based on thumbnail flag
  const aspectRatio = isThumbnail ? '56.25%' : '75%'; // 16:9 for thumbnails, 4:3 for documents

  return (
    <div className="space-y-3">
      <Label className="text-sm text-gray-700">{label}</Label>
      
      {/* Manual URL Input */}
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => handleManualInput(e.target.value)}
          placeholder="https://... or upload an image"
          className="flex-1"
        />
        {preview && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleRemove}
            className="flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Upload Button */}
      <div className="flex items-center gap-2">
        <Input
          id={`image-upload-${label}`}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          disabled={uploading}
          className="hidden"
        />
        <Label
          htmlFor={`image-upload-${label}`}
          className="cursor-pointer"
        >
          <Button
            type="button"
            variant="outline"
            disabled={uploading}
            className="w-full sm:w-auto"
            asChild
          >
            <span>
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Image
                </>
              )}
            </span>
          </Button>
        </Label>
        <span className="text-xs text-gray-500">
          Max 10MB • JPEG, PNG, WebP
        </span>
      </div>

      {/* Preview */}
      {preview && (
        <div className="relative w-full max-w-md rounded-lg overflow-hidden border border-gray-200">
          <div className="relative w-full" style={{ paddingBottom: aspectRatio }}>
            <Image
              src={preview}
              alt="Preview"
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        </div>
      )}
    </div>
  );
}