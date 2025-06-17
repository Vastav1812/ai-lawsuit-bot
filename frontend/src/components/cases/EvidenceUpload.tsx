// src/components/cases/EvidenceUpload.tsx
import { useState, useCallback } from 'react';
import { Upload, File, X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EvidenceUploadProps {
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
  maxSize?: number; // in MB
  acceptedTypes?: string[];
  className?: string;
}

export function EvidenceUpload({
  onFilesChange,
  maxFiles = 5,
  maxSize = 10,
  acceptedTypes = ['.pdf', '.png', '.jpg', '.jpeg', '.txt', '.json'],
  className
}: EvidenceUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      return `File ${file.name} exceeds ${maxSize}MB limit`;
    }

    // Check file type
    const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`;
    if (!acceptedTypes.includes(fileExtension)) {
      return `File type ${fileExtension} not supported`;
    }

    return null;
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setError(null);

    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  }, [files]);

  const handleFiles = (newFiles: File[]) => {
    const totalFiles = files.length + newFiles.length;
    if (totalFiles > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`);
      return;
    }

    // Validate each file
    for (const file of newFiles) {
      const error = validateFile(file);
      if (error) {
        setError(error);
        return;
      }
    }

    const updatedFiles = [...files, ...newFiles];
    setFiles(updatedFiles);
    onFilesChange(updatedFiles);
  };

  const removeFile = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    onFilesChange(updatedFiles);
    setError(null);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    handleFiles(selectedFiles);
  };

  return (
    <div className={className}>
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-6 transition-colors",
          dragActive ? "border-blue-500 bg-blue-500/10" : "border-gray-700",
          "hover:border-gray-600"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple
          onChange={handleFileInput}
          className="hidden"
          id="evidence-upload"
          accept={acceptedTypes.join(',')}
        />
        <label
          htmlFor="evidence-upload"
          className="flex flex-col items-center cursor-pointer"
        >
          <Upload className={cn(
            "h-10 w-10 mb-3",
            dragActive ? "text-blue-500" : "text-gray-400"
          )} />
          <p className="text-sm font-medium mb-1">
            {dragActive ? "Drop files here" : "Upload evidence files"}
          </p>
          <p className="text-xs text-gray-500">
            or click to browse
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {acceptedTypes.join(', ')} • Max {maxSize}MB per file • Max {maxFiles} files
          </p>
        </label>
      </div>

      {error && (
        <div className="mt-3 flex items-center gap-2 text-red-400 text-sm">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium">Uploaded Files ({files.length}/{maxFiles})</p>
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between bg-gray-800 rounded-lg p-3"
            >
              <div className="flex items-center gap-3">
                <File className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button
                onClick={() => removeFile(index)}
                className="p-1 hover:bg-gray-700 rounded transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}