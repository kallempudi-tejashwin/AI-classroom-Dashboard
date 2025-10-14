
import React, { useState, useCallback } from 'react';
import { categorizeFile } from '../../services/geminiService';
import { DocumentTextIcon } from '../icons';

interface FileAnalysis {
  name: string;
  category: string;
  tags: string[];
  isDuplicate: boolean;
}

const ContentTab: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<FileAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileChange = (selectedFile: File | null) => {
    if (selectedFile) {
      setFile(selectedFile);
      handleAnalyze(selectedFile);
    }
  };
  
  const handleAnalyze = async (fileToAnalyze: File) => {
    setIsLoading(true);
    setAnalysis(null);
    const result = await categorizeFile(fileToAnalyze.name);
    setAnalysis({ name: fileToAnalyze.name, ...result });
    setIsLoading(false);
  };
  
  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const onDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  }, []);

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold mb-4">Smart Content Management</h2>
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg transition-colors duration-300 ${isDragOver ? 'border-teal-400 bg-teal-500/10' : 'border-white/20 hover:border-white/40'}`}
      >
        <input
          type="file"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={(e) => handleFileChange(e.target.files ? e.target.files[0] : null)}
        />
        <DocumentTextIcon className="w-12 h-12 text-gray-500 mb-3" />
        <p className="text-lg font-semibold">Drag & drop a file here</p>
        <p className="text-gray-400">or click to select a file</p>
      </div>

      {(isLoading || analysis) && (
        <div className="mt-6 p-4 bg-white/5 rounded-lg border border-white/10">
          <h3 className="text-xl font-semibold mb-3">AI Analysis</h3>
          {isLoading ? (
            <div className="space-y-3 animate-pulse">
                <div className="h-5 bg-gray-700 rounded w-1/2"></div>
                <div className="h-5 bg-gray-700 rounded w-1/3"></div>
                <div className="flex gap-2">
                    <div className="h-6 bg-gray-700 rounded-full w-20"></div>
                    <div className="h-6 bg-gray-700 rounded-full w-24"></div>
                </div>
            </div>
          ) : analysis && (
            <div>
              <p><strong>File:</strong> {analysis.name}</p>
              <p><strong>AI Category:</strong> <span className="font-semibold text-teal-300">{analysis.category}</span></p>
              {analysis.isDuplicate && <p className="text-rose-400 font-bold">Warning: Potential Duplicate Detected!</p>}
              <div className="mt-2 flex flex-wrap gap-2">
                <strong>Tags:</strong>
                {analysis.tags.map(tag => (
                  <span key={tag} className="bg-gray-700 text-gray-200 text-xs font-medium px-2.5 py-1 rounded-full">{tag}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ContentTab;
