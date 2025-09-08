import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { parseExcelFile, parseCsvFile, analyzeExcelData, hashFile, getCachedAnalysis, cacheAnalysis, testOpenAIConnection } from '../services/openai';
import { processWithExternalAPIs } from '../services/externalApiDemo';
import type { SpendAnalysis, SummaryMetrics } from '../types';

interface FileUploadProps {
  onFilesUploaded: (files: File[]) => void;
  uploadedFiles: File[];
  onAnalysisComplete?: (analysis: SpendAnalysis[], summary: SummaryMetrics) => void;
  useEnhancedAnalysis?: boolean;
}

const FileUpload = ({ onFilesUploaded, uploadedFiles, onAnalysisComplete, useEnhancedAnalysis = false }: FileUploadProps) => {
  const [processingFiles, setProcessingFiles] = useState<string[]>([]);
  const [analysisStatus, setAnalysisStatus] = useState<Record<string, 'processing' | 'completed' | 'error'>>({});
  const [errorMessages, setErrorMessages] = useState<Record<string, string>>({});
  const [lastAnalysisData, setLastAnalysisData] = useState<{ analysis: SpendAnalysis[], summary: SummaryMetrics } | null>(null);

  const processDataFile = async (file: File) => {
    console.log(`[FileUpload] Starting to process data file: ${file.name}, type: ${file.type}`);
    
    try {
      // Check cache first
      const fileHash = await hashFile(file);
      const cachedAnalysis = await getCachedAnalysis(fileHash);
      
      if (cachedAnalysis) {
        console.log('[FileUpload] Using cached analysis:', cachedAnalysis);
        setAnalysisStatus(prev => ({ ...prev, [file.name]: 'completed' }));
        setLastAnalysisData(cachedAnalysis);
        // Don't auto-navigate, let user click Continue
        // if (onAnalysisComplete) {
        //   onAnalysisComplete(cachedAnalysis.analysis, cachedAnalysis.summary);
        // }
        return;
      }
      
      // Parse file based on type
      console.log('[FileUpload] Parsing file...');
      let parsedData;
      
      if (file.type.includes('csv') || file.name.toLowerCase().endsWith('.csv')) {
        console.log('[FileUpload] Processing as CSV file');
        parsedData = await parseCsvFile(file);
      } else if (
        file.type.includes('excel') || 
        file.type.includes('spreadsheet') ||
        file.name.toLowerCase().match(/\.(xls|xlsx|xlsm|xlsb)$/)
      ) {
        console.log('[FileUpload] Processing as Excel file');
        parsedData = await parseExcelFile(file);
      } else {
        throw new Error(`Unsupported file type: ${file.type}`);
      }
      
      console.log('[FileUpload] Data parsed:', parsedData.slice(0, 3));
      
      // Choose analysis method based on toggle
      let analysis;
      if (useEnhancedAnalysis) {
        console.log('[FileUpload] Using Enhanced Analysis with external APIs...');
        analysis = await processWithExternalAPIs(parsedData);
      } else {
        // Check if we have OpenAI API key
        if (!import.meta.env.VITE_OPENAI_API_KEY) {
          console.warn('[FileUpload] No OpenAI API key found. Please set VITE_OPENAI_API_KEY in .env file');
          console.log('[FileUpload] Parsed data structure:', {
            totalRows: parsedData.length,
            columns: Object.keys(parsedData[0] || {}),
            sampleData: parsedData.slice(0, 3)
          });
          setAnalysisStatus(prev => ({ ...prev, [file.name]: 'error' }));
          setErrorMessages(prev => ({ ...prev, [file.name]: 'OpenAI API key not configured. Check console for parsed data.' }));
          return;
        }
        
        // Test OpenAI connectivity first
        console.log('[FileUpload] Using Standard Analysis with OpenAI...');
        const isConnected = await testOpenAIConnection();
        if (!isConnected) {
          console.error('[FileUpload] OpenAI API connection failed - check API key and network');
          setAnalysisStatus(prev => ({ ...prev, [file.name]: 'error' }));
          setErrorMessages(prev => ({ ...prev, [file.name]: 'OpenAI API connection failed. Check API key and network.' }));
          return;
        }
        
        // Analyze with OpenAI
        analysis = await analyzeExcelData(parsedData);
      }
      
      console.log('[FileUpload] Analysis complete:', analysis);
      
      // Cache the result
      cacheAnalysis(fileHash, analysis);
      
      setAnalysisStatus(prev => ({ ...prev, [file.name]: 'completed' }));
      setLastAnalysisData(analysis);
      
      // Don't auto-navigate, let user click Continue
      // if (onAnalysisComplete) {
      //   onAnalysisComplete(analysis.analysis, analysis.summary);
      // }
    } catch (error) {
      console.error('[FileUpload] Error processing file:', error);
      setAnalysisStatus(prev => ({ ...prev, [file.name]: 'error' }));
      setErrorMessages(prev => ({ ...prev, [file.name]: error instanceof Error ? error.message : 'Failed to process file' }));
    } finally {
      setProcessingFiles(prev => prev.filter(name => name !== file.name));
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const newFiles = [...uploadedFiles, ...acceptedFiles];
    onFilesUploaded(newFiles);
    
    // Process Excel files
    for (const file of acceptedFiles) {
      if (file.type.includes('excel') || file.type.includes('spreadsheet') || file.type.includes('csv') || 
          file.name.toLowerCase().match(/\.(xlsx|xls|xlsm|xlsb|csv)$/)) {
        setProcessingFiles(prev => [...prev, file.name]);
        setAnalysisStatus(prev => ({ ...prev, [file.name]: 'processing' }));
        // Process asynchronously without blocking
        processDataFile(file);
      } else {
        // For non-Excel files, just mark as completed after a delay
        setProcessingFiles(prev => [...prev, file.name]);
        setTimeout(() => {
          setProcessingFiles(prev => prev.filter(name => name !== file.name));
          setAnalysisStatus(prev => ({ ...prev, [file.name]: 'completed' }));
          // For non-Excel files, set empty analysis data so button can be enabled
          if (!lastAnalysisData) {
            setLastAnalysisData({
              analysis: [],
              summary: {
                pastSpend: 0,
                projectedSpend: 0,
                potentialSavings: {
                  min: 0,
                  max: 0
                },
                roi: 0
              }
            });
          }
        }, 2000);
      }
    }
  }, [uploadedFiles, onFilesUploaded, onAnalysisComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.ms-excel': ['.xls'], 
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel.sheet.macroEnabled.12': ['.xlsm'],
      'application/vnd.ms-excel.sheet.binary.macroEnabled.12': ['.xlsb'],
      'text/csv': ['.csv'],
      'text/plain': ['.txt'],
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
    if (file.type.includes('excel') || file.type.includes('spreadsheet') || file.name.toLowerCase().match(/\.(xls|xlsx|xlsm|xlsb)$/)) return '📊';
    if (file.type.includes('csv') || file.name.toLowerCase().endsWith('.csv')) return '📈';
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
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
          isDragActive 
            ? 'border-purple-400 bg-purple-500/10' 
            : 'border-white/20 hover:border-purple-400/50 bg-white/5'
        }`}
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
          Supports Excel (.xlsx, .xls, .xlsm), CSV, PDF, and image files
        </p>
      </div>

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
                      <span className="text-sm">
                        {useEnhancedAnalysis ? 'Enhanced analysis...' : 'Analyzing...'}
                      </span>
                    </div>
                  ) : analysisStatus[file.name] === 'error' ? (
                    <div className="flex items-center space-x-2 text-red-400">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm" title={errorMessages[file.name]}>Error</span>
                    </div>
                  ) : analysisStatus[file.name] === 'completed' ? (
                    <div className="flex items-center space-x-2 text-green-400">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm">
                        {useEnhancedAnalysis ? '✨ Enhanced' : 'Analyzed'}
                      </span>
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
        <div className="space-y-4">
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
          
          {/* Continue button - only enable when processing is complete */}
          <button
            onClick={() => {
              if (onAnalysisComplete && lastAnalysisData) {
                onAnalysisComplete(lastAnalysisData.analysis, lastAnalysisData.summary);
              }
            }}
            disabled={processingFiles.length > 0 || !lastAnalysisData}
            className={`w-full font-semibold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2 group ${
              processingFiles.length > 0 || !lastAnalysisData
                ? 'bg-gray-600 cursor-not-allowed text-gray-300'
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}
          >
            {processingFiles.length > 0 ? (
              <>
                <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                Analyzing Files...
              </>
            ) : !lastAnalysisData ? (
              <>
                <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin opacity-50" />
                Waiting for Analysis...
              </>
            ) : (
              <>
                Continue to Dashboard
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default FileUpload;