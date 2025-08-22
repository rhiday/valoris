import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, X, CheckCircle, AlertCircle } from 'lucide-react';

interface FileUploadProps {
  onFilesUploaded: (files: File[]) => void;
  uploadedFiles: File[];
}

const FileUpload: React.FC<FileUploadProps> = ({ onFilesUploaded, uploadedFiles }) => {
  const [processingFiles, setProcessingFiles] = useState<string[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = [...uploadedFiles, ...acceptedFiles];
    onFilesUploaded(newFiles);
    
    // Simulate processing
    acceptedFiles.forEach(file => {
      setProcessingFiles(prev => [...prev, file.name]);
      setTimeout(() => {
        setProcessingFiles(prev => prev.filter(name => name !== file.name));
      }, 2000 + Math.random() * 1000);
    });
  }, [uploadedFiles, onFilesUploaded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/csv': ['.csv'],
      'image/*': ['.png', '.jpg', '.jpeg']
    },
    multiple: true
  });

  const removeFile = (index: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    onFilesUploaded(newFiles);
  };

  const getFileIcon = (file: File) => {
    if (file.type.includes('pdf')) return '📄';
    if (file.type.includes('excel') || file.type.includes('spreadsheet')) return '📊';
    if (file.type.includes('csv')) return '📈';
    if (file.type.includes('image')) return '🖼️';
    return '📁';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <motion.div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
          isDragActive 
            ? 'border-purple-400 bg-purple-500/10' 
            : 'border-white/20 hover:border-purple-400/50 bg-white/5'
        }`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <input {...getInputProps()} />
        <Upload className={`w-16 h-16 mx-auto mb-4 ${isDragActive ? 'text-purple-400' : 'text-gray-400'}`} />
        <h3 className="text-xl font-semibold text-white mb-2">
          {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
        </h3>
        <p className="text-gray-400 mb-4">
          or click to browse your computer
        </p>
        <p className="text-sm text-gray-500">
          Supports PDF, Excel, CSV, and image files
        </p>
      </motion.div>

      <AnimatePresence>
        {uploadedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            <h4 className="text-lg font-semibold text-white">Uploaded Files</h4>
            {uploadedFiles.map((file, index) => (
              <motion.div
                key={`${file.name}-${index}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg p-4"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getFileIcon(file)}</span>
                  <div>
                    <p className="text-white font-medium">{file.name}</p>
                    <p className="text-gray-400 text-sm">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {processingFiles.includes(file.name) ? (
                    <div className="flex items-center space-x-2 text-yellow-400">
                      <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm">Processing...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 text-green-400">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm">Ready</span>
                    </div>
                  )}
                  <button
                    onClick={() => removeFile(index)}
                    className="p-1 hover:bg-red-500/20 rounded text-red-400 hover:text-red-300 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {uploadedFiles.length > 0 && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <p className="text-green-200">
              <strong>{uploadedFiles.length} file{uploadedFiles.length !== 1 ? 's' : ''} ready for analysis</strong>
            </p>
          </div>
          <p className="text-green-300/80 text-sm mt-1">
            Our AI will extract and analyze procurement data from these files to identify cost optimization opportunities.
          </p>
        </div>
      )}
    </div>
  );
};

export default FileUpload;