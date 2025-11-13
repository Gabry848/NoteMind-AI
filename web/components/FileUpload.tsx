/**
 * File upload component with drag & drop
 */
"use client";

import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: number;
  acceptImages?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  accept = ".pdf,.txt,.docx,.json,.md,.py,.js,.ts",
  maxSize = 10 * 1024 * 1024, // 10MB
  acceptImages = false,
}) => {
  // If acceptImages is true, add image formats to accept list
  const effectiveAccept = acceptImages 
    ? `${accept},.jpg,.jpeg,.png,.webp`
    : accept;
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0]);
      }
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: effectiveAccept.split(",").reduce((acc, ext) => ({ ...acc, [ext.trim()]: [] }), {}),
    maxSize,
    multiple: false,
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] ${
        isDragActive
          ? "border-blue-500 bg-blue-50"
          : isDragReject
          ? "border-red-500 bg-red-50"
          : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
      }`}
    >
      <input {...getInputProps()} />
      <div className="space-y-3">
        <svg
          className={`mx-auto h-12 w-12 ${
            isDragActive ? "text-blue-500" : "text-gray-400"
          }`}
          stroke="currentColor"
          fill="none"
          viewBox="0 0 48 48"
        >
          <path
            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {isDragActive ? (
          <p className="text-blue-600 font-medium">Drop your file here...</p>
        ) : isDragReject ? (
          <p className="text-red-600 font-medium">File type not supported</p>
        ) : (
          <>
            <p className="text-gray-600">
              <span className="font-medium text-blue-600">Click to upload</span> or drag
              and drop
            </p>
            <p className="text-sm text-gray-500">
              {acceptImages 
                ? "PDF, TXT, DOCX, MD, JPG, PNG (max 10MB)" 
                : "PDF, TXT, DOCX, JSON, MD (max 10MB)"}
            </p>
          </>
        )}
      </div>
    </div>
  );
};
