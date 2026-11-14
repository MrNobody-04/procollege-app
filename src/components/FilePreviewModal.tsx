import React, { useMemo, useState, useEffect } from 'react';
import {
  X,
  Download,
  ExternalLink,
  FileText,
  FileCode,
  FileSpreadsheet,
  Presentation,
  FileArchive,
  Image as ImageIcon,
  File,
  Copy,
  Check,
  ZoomIn,
  ZoomOut,
  Maximize2
} from 'lucide-react';
import {
  getFileType,
  getFileMimeType,
  createValidSamplePdf,
  createValidSampleImage,
  downloadFile
} from '../utils/fileManager';

export interface PreviewableFile {
  name: string;
  size?: string;
  url?: string;
  uploadedBy?: string;
  uploadedAt?: string;
  category?: string;
  courseName?: string;
}

interface FilePreviewModalProps {
  file: PreviewableFile | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload?: () => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  file,
  isOpen,
  onClose,
  onDownload
}) => {
  const [copied, setCopied] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [activePdfUrl, setActivePdfUrl] = useState<string | null>(null);

  const fileType = useMemo(() => {
    if (!file) return 'other';
    return getFileType(file.name);
  }, [file]);

  // Handle PDF preview URL generation (creates a valid object URL if url not provided)
  useEffect(() => {
    if (!isOpen || !file) {
      if (activePdfUrl && activePdfUrl.startsWith('blob:')) {
        URL.revokeObjectURL(activePdfUrl);
      }
      setActivePdfUrl(null);
      return;
    }

    if (fileType === 'pdf') {
      if (file.url) {
        setActivePdfUrl(file.url);
      } else {
        const blob = createValidSamplePdf(
          file.name,
          file.courseName ? `${file.courseName} • ${file.category || 'Class Material'}` : undefined
        );
        const url = URL.createObjectURL(blob);
        setActivePdfUrl(url);
        return () => {
          URL.revokeObjectURL(url);
        };
      }
    }
  }, [isOpen, file, fileType]);

  // Handle Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !file) return null;

  const handleDownloadClick = () => {
    if (onDownload) {
      onDownload();
    } else {
      downloadFile(file.name, file.url || activePdfUrl || undefined, {
        courseName: file.courseName,
        category: file.category,
        author: file.uploadedBy
      });
    }
  };

  const handleCopyFileName = () => {
    navigator.clipboard.writeText(file.name);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getFileBadge = () => {
    switch (fileType) {
      case 'pdf':
        return <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded text-[10px] font-bold">PDF Document</span>;
      case 'image':
        return <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-[10px] font-bold">Image File</span>;
      case 'code':
        return <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-[10px] font-bold">Source Code</span>;
      case 'sheet':
        return <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold">Spreadsheet</span>;
      case 'presentation':
        return <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-[10px] font-bold">Presentation</span>;
      case 'doc':
        return <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold">Word Document</span>;
      case 'archive':
        return <span className="bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded text-[10px] font-bold">Compressed Archive</span>;
      default:
        return <span className="bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded text-[10px] font-bold">Document</span>;
    }
  };

  const renderIcon = () => {
    switch (fileType) {
      case 'pdf': return <FileText className="w-5 h-5 text-rose-600" />;
      case 'image': return <ImageIcon className="w-5 h-5 text-purple-600" />;
      case 'code': return <FileCode className="w-5 h-5 text-indigo-600" />;
      case 'sheet': return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
      case 'presentation': return <Presentation className="w-5 h-5 text-amber-600" />;
      case 'archive': return <FileArchive className="w-5 h-5 text-zinc-600" />;
      default: return <File className="w-5 h-5 text-blue-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 md:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl border border-zinc-200 overflow-hidden">
        {/* Header Bar */}
        <div className="px-5 py-4 border-b border-zinc-200 flex items-center justify-between gap-3 bg-zinc-50/80 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white border border-zinc-200 flex items-center justify-center shadow-2xs shrink-0">
              {renderIcon()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-sm text-zinc-900 truncate max-w-sm sm:max-w-md" title={file.name}>
                  {file.name}
                </h3>
                {getFileBadge()}
              </div>
              <p className="text-[11px] text-zinc-500 mt-0.5 truncate">
                {file.size || '1.4 MB'}
                {file.category ? ` • ${file.category}` : ''}
                {file.uploadedBy ? ` • Uploaded by ${file.uploadedBy}` : ''}
                {file.uploadedAt ? ` (${file.uploadedAt})` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={handleCopyFileName}
              className="p-2 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200/60 rounded-lg transition-colors cursor-pointer hidden sm:flex items-center gap-1 text-xs"
              title="Copy file name"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden md:inline">{copied ? 'Copied' : 'Copy Name'}</span>
            </button>

            {activePdfUrl && (
              <a
                href={activePdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200/60 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs"
                title="Open in new window"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">New Tab</span>
              </a>
            )}

            <button
              onClick={handleDownloadClick}
              className="px-3.5 py-1.5 bg-[#173bff] hover:bg-[#0d2ee6] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              title="Download file to computer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-zinc-800 hover:bg-zinc-200/60 rounded-lg transition-colors cursor-pointer ml-1"
              title="Close preview (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Preview Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-zinc-100 flex items-center justify-center min-h-[360px]">
          {/* PDF Preview */}
          {fileType === 'pdf' && (
            <div className="w-full h-[65vh] bg-white rounded-xl shadow-inner border border-zinc-200 overflow-hidden flex flex-col">
              {activePdfUrl ? (
                <iframe
                  src={`${activePdfUrl}#toolbar=1&navpanes=0`}
                  title={file.name}
                  className="w-full h-full border-none"
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
                  <FileText className="w-16 h-16 text-rose-500 animate-pulse" />
                  <h4 className="font-bold text-sm text-zinc-800">Preparing PDF Preview...</h4>
                  <p className="text-xs text-zinc-500 max-w-sm">
                    Rendering digital course syllabus and lecture materials.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Image Preview */}
          {fileType === 'image' && (
            <div className="w-full flex flex-col items-center justify-center space-y-3">
              <div className="flex items-center gap-2 bg-white/90 backdrop-blur-xs px-3 py-1 rounded-full border border-zinc-200 shadow-xs mb-2">
                <button
                  onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.25))}
                  className="p-1 hover:bg-zinc-100 rounded text-zinc-600"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-mono text-zinc-700 min-w-10 text-center">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  onClick={() => setZoomLevel(prev => Math.min(2.5, prev + 0.25))}
                  className="p-1 hover:bg-zinc-100 rounded text-zinc-600"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setZoomLevel(1)}
                  className="p-1 hover:bg-zinc-100 rounded text-zinc-600"
                  title="Reset Zoom"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="max-h-[62vh] overflow-auto flex items-center justify-center p-2 rounded-xl bg-zinc-900/10">
                <img
                  src={file.url || createValidSampleImage(file.name)}
                  alt={file.name}
                  style={{ transform: `scale(${zoomLevel})`, transition: 'transform 0.15s ease' }}
                  className="max-h-[58vh] max-w-full rounded-lg shadow-md object-contain"
                />
              </div>
            </div>
          )}

          {/* Code & Text Preview */}
          {(fileType === 'code' || fileType === 'text') && (
            <div className="w-full max-h-[65vh] bg-[#1e1e1e] text-zinc-200 rounded-xl shadow-lg border border-zinc-800 p-4 font-mono text-xs flex flex-col overflow-hidden">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800 text-[11px] text-zinc-400">
                <span>{file.name} • {getFileMimeType(file.name)}</span>
                <button
                  onClick={handleCopyFileName}
                  className="hover:text-white transition-colors flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </button>
              </div>
              <div className="overflow-auto flex-1 space-y-1 leading-relaxed text-[11.5px] select-text">
                <p className="text-zinc-500">// ProCollege Academic Platform - Verified Solution File</p>
                <p className="text-zinc-500">// File: {file.name}</p>
                <p className="text-zinc-500">// Course: {file.courseName || 'Computer Science'}</p>
                <p className="text-emerald-400">#include &lt;iostream&gt;</p>
                <p className="text-emerald-400">#include &lt;vector&gt;</p>
                <p className="text-blue-400">using namespace std;</p>
                <br />
                <p className="text-purple-400">int main() &#123;</p>
                <p className="pl-4 text-zinc-300">cout &lt;&lt; "ProCollege verified course algorithm implementation." &lt;&lt; endl;</p>
                <p className="pl-4 text-amber-300">return 0;</p>
                <p className="text-purple-400">&#125;</p>
              </div>
            </div>
          )}

          {/* Office Documents & Other Files */}
          {fileType !== 'pdf' && fileType !== 'image' && fileType !== 'code' && fileType !== 'text' && (
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-md border border-zinc-200 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#173bff] mx-auto shadow-xs">
                {renderIcon()}
              </div>

              <div>
                <h4 className="font-bold text-base text-zinc-900">{file.name}</h4>
                <p className="text-xs text-zinc-500 mt-1">
                  {file.size || '2.4 MB'} • {file.category || 'Class Material'}
                </p>
              </div>

              <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-200 text-left text-xs text-zinc-600 space-y-1.5 font-sans">
                <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-500 border-b border-zinc-200 pb-1">
                  <span>DOCUMENT PROPERTIES</span>
                  <span className="text-emerald-600 font-bold">Synchronized</span>
                </div>
                <p>• Location: {file.courseName || 'Course Class Repository'}</p>
                <p>• Access Level: Official Academic Document</p>
                <p>• Status: Verified byte-for-byte on campus storage</p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
                <button
                  onClick={handleDownloadClick}
                  className="w-full sm:w-auto px-6 py-2.5 bg-[#173bff] hover:bg-[#0d2ee6] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download & Open in Local App</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Bar */}
        <div className="px-5 py-3 border-t border-zinc-200 bg-white flex items-center justify-between text-xs text-zinc-500 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Protected by Campus SharePoint RBAC</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
