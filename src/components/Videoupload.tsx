// components/ui/file-upload.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Upload, X, Check } from "lucide-react";

interface FileUploadProps {
  onUploadComplete: (url: string) => void;
  accept?: string;
  maxSize?: number; // in MB
  label?: string;
  value?: string;
}

export function FileUpload({
  onUploadComplete,
  accept = "video/*,image/*",
  maxSize = 200, // 200MB default
  label = "Upload File",
  value,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(value || null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    const maxSizeBytes = maxSize * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setError(`File size exceeds ${maxSize}MB limit`);
      return;
    }

    // Validate file type
    const acceptTypes = accept.split(",").map(type => type.trim());
    if (!acceptTypes.some(type => {
      if (type.includes("/*")) {
        const mainType = type.split("/")[0];
        return file.type.startsWith(mainType + "/");
      }
      return file.type === type;
    })) {
      setError(`Invalid file type. Accepted: ${accept}`);
      return;
    }

    await uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    setProgress(0);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch("/api/aws-upload", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      const data = await response.json();
      setProgress(100);
      setUploadedUrl(data.url);
      onUploadComplete(data.url);

      // Reset progress after success
      setTimeout(() => setProgress(0), 1000);
    } catch (err: any) {
      setError(err.message || "Upload failed. Please try again.");
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setUploadedUrl(null);
    onUploadComplete("");
    setError(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      uploadFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  return (
    <div className="space-y-3">
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          uploading
            ? "border-blue-300 bg-blue-50"
            : error
            ? "border-red-300 bg-red-50"
            : uploadedUrl
            ? "border-green-300 bg-green-50"
            : "border-gray-300 hover:border-gray-400 bg-gray-50"
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        {uploading ? (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
              <span className="text-sm text-gray-600">Uploading...</span>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-gray-500">
              {progress === 100 ? "Processing..." : `${progress}% uploaded`}
            </p>
          </div>
        ) : uploadedUrl ? (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 text-green-600">
              <Check className="h-5 w-5" />
              <span className="text-sm font-medium">Upload Complete!</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className="text-xs text-gray-600 truncate max-w-[200px]">
                {uploadedUrl.split("/").pop()}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <Upload className="h-8 w-8 mx-auto text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-700">{label}</p>
              <p className="text-xs text-gray-500 mt-1">
                Drag & drop or click to browse
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Max size: {maxSize}MB • {accept}
              </p>
            </div>
            <Input
              type="file"
              accept={accept}
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => document.getElementById("file-upload")?.click()}
              disabled={uploading}
            >
              Browse Files
            </Button>
          </div>
        )}
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
          {error}
        </div>
      )}

      {uploadedUrl && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500">Preview:</p>
          {uploadedUrl.match(/\.(mp4|mov|avi|webm|mkv)$/i) ? (
            <video
              src={uploadedUrl}
              className="w-full rounded border"
              controls
              preload="metadata"
            />
          ) : uploadedUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
            <img
              src={uploadedUrl}
              alt="Uploaded"
              className="w-full rounded border max-h-48 object-contain"
            />
          ) : (
            <a
              href={uploadedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline"
            >
              View uploaded file
            </a>
          )}
        </div>
      )}
    </div>
  );
}