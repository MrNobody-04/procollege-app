import React, { useState, useRef } from 'react';
import {
  FolderOpen,
  FileText,
  Download,
  Lock,
  Upload,
  Trash2,
  Search,
  Users,
  Folder,
  Eye,
  Info,
  X,
  FileCode,
  FileSpreadsheet
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { FilePreviewModal } from './FilePreviewModal';
import { downloadFile, readFileAsDataUrl } from '../utils/fileManager';
import type { CourseFile } from '../types';

export const FilesView: React.FC = () => {
  const { courseFiles, courses, currentUser, uploadCourseFile, deleteCourseFile, showDialog } = useApp();

  const [selectedCourseId, setSelectedCourseId] = useState<string>('all');
  const [activeFolderTab, setActiveFolderTab] = useState<'all' | 'class-materials' | 'collaborative'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showInfoBanner, setShowInfoBanner] = useState(true);
  const [previewFile, setPreviewFile] = useState<CourseFile | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter files with strict privacy:
  // - Never show private student work, submissions, or non-course private files in public explorer
  // - Enforce campus boundaries and course enrollment
  const filteredFiles = courseFiles.filter(file => {
    // 1. Privacy filter: strictly exclude private student submissions & personal drafts
    if (file.isPrivate || file.uploadedByRole === 'student' || file.category === 'Private Submissions') {
      return false;
    }
    // Course filter
    if (selectedCourseId !== 'all' && file.courseId !== selectedCourseId) {
      return false;
    }
    // Folder tab filter
    if (activeFolderTab === 'class-materials' && !file.isClassMaterials) {
      return false;
    }
    if (activeFolderTab === 'collaborative' && file.isClassMaterials) {
      return false;
    }
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = file.name.toLowerCase().includes(q);
      const matchAuthor = file.uploadedBy.toLowerCase().includes(q);
      const matchCat = file.category.toLowerCase().includes(q);
      if (!matchName && !matchAuthor && !matchCat) return false;
    }
    return true;
  });

  // Real file download
  const handleDownload = (file: CourseFile) => {
    downloadFile(file.name, file.url, {
      courseName: courses.find(c => c.id === file.courseId)?.name,
      category: file.category,
      author: file.uploadedBy
    });
  };

  // Real device file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const sizeStr =
        file.size > 1024 * 1024
          ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
          : `${Math.max(1, Math.round(file.size / 1024))} KB`;

      const isClassMaterials = activeFolderTab === 'class-materials';
      const targetCourseId = selectedCourseId === 'all' ? (courses[0]?.id || '') : selectedCourseId;

      try {
        const dataUrl = await readFileAsDataUrl(file);
        const res = uploadCourseFile({
          courseId: targetCourseId,
          name: file.name,
          category: isClassMaterials ? 'Class Materials' : 'Subject Files',
          size: sizeStr,
          uploadedBy: currentUser.name,
          isClassMaterials,
          permission: isClassMaterials ? 'read-only' : 'can-edit',
          url: dataUrl
        });

        if (!res.success) {
          showDialog(res.message, { type: 'warning', title: 'Upload Notice' });
        }
      } catch (err) {
        showDialog('Failed to process file upload.', { type: 'warning', title: 'Upload Error' });
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') {
      return <FileText className="w-4 h-4 text-rose-600 shrink-0" />;
    }
    if (ext === 'doc' || ext === 'docx') {
      return <FileText className="w-4 h-4 text-blue-600 shrink-0" />;
    }
    if (ext === 'xls' || ext === 'xlsx') {
      return <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />;
    }
    if (ext === 'cpp' || ext === 'c' || ext === 'py' || ext === 'java' || ext === 'ts' || ext === 'js') {
      return <FileCode className="w-4 h-4 text-indigo-600 shrink-0" />;
    }
    return <FileText className="w-4 h-4 text-zinc-500 shrink-0" />;
  };

  const isTeacherOrAdmin = currentUser.role === 'professor' || currentUser.role === 'lecturer' || currentUser.role === 'admin';

  return (
    <div className="flex-1 bg-[#E8E9E2] flex flex-col h-full min-w-0 overflow-y-auto select-none">
      {/* Hidden native device file picker */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
      />

      <div className="max-w-6xl w-full mx-auto p-4 sm:p-6 space-y-4">
        {/* Natural Header Bar */}
        <div className="bg-white border border-zinc-200 rounded-lg p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-zinc-100 text-[#26394D] flex items-center justify-center">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-zinc-900 tracking-tight">Files</h1>
              <p className="text-xs text-zinc-500">
                Course syllabus, lecture notes, and collaborative documents across your classes
              </p>
            </div>
          </div>

          {/* Actions: Course Filter & Upload Button */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={selectedCourseId}
              onChange={e => setSelectedCourseId(e.target.value)}
              className="bg-white border border-zinc-300 rounded px-3 py-1.5 text-xs text-zinc-800 font-medium focus:outline-none focus:border-[#26394D]"
            >
              <option value="all">All Courses ({courses.length})</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>
                  {c.code} • {c.name}
                </option>
              ))}
            </select>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 bg-[#26394D] hover:bg-[#141E2B] text-white px-3.5 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer"
              title="Upload file from your computer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload</span>
            </button>
          </div>
        </div>

        {/* Natural Informational Note (Subtle, Clean & Dismissible) */}
        {showInfoBanner && (
          <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 text-xs text-zinc-700 flex items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
              <p>
                Files inside <strong>Class Materials</strong> are read-only for students so instructors can share official reference documents. Documents in channel folders are collaborative.
              </p>
            </div>
            <button
              onClick={() => setShowInfoBanner(false)}
              className="text-zinc-400 hover:text-zinc-600 text-xs p-0.5"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Folder Navigation Pills & Search Bar */}
        <div className="bg-white border border-zinc-200 rounded-lg p-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-1 flex-wrap">
            <button
              onClick={() => setActiveFolderTab('all')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                activeFolderTab === 'all'
                  ? 'bg-zinc-100 text-zinc-900 font-semibold'
                  : 'text-zinc-600 hover:bg-zinc-50'
              }`}
            >
              All Files
            </button>
            <button
              onClick={() => setActiveFolderTab('class-materials')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                activeFolderTab === 'class-materials'
                  ? 'bg-zinc-100 text-zinc-900 font-semibold'
                  : 'text-zinc-600 hover:bg-zinc-50'
              }`}
            >
              <Lock className="w-3 h-3 text-zinc-400" />
              <span>Class Materials</span>
            </button>
            <button
              onClick={() => setActiveFolderTab('collaborative')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                activeFolderTab === 'collaborative'
                  ? 'bg-zinc-100 text-zinc-900 font-semibold'
                  : 'text-zinc-600 hover:bg-zinc-50'
              }`}
            >
              <Folder className="w-3 h-3 text-zinc-400" />
              <span>Channel Folders</span>
            </button>
          </div>

          <div className="relative w-full md:w-64">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Filter by file name..."
              className="w-full bg-zinc-50 border border-zinc-300 rounded pl-8 pr-3 py-1 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-[#26394D]"
            />
          </div>
        </div>

        {/* Clean Microsoft Teams / SharePoint Document Table */}
        <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-zinc-50/80 border-b border-zinc-200 text-zinc-600 font-semibold">
                  <th className="py-2.5 px-3">Name</th>
                  <th className="py-2.5 px-3">Course</th>
                  <th className="py-2.5 px-3">Folder</th>
                  <th className="py-2.5 px-3">Modified</th>
                  <th className="py-2.5 px-3">Modified by</th>
                  <th className="py-2.5 px-3">Size</th>
                  <th className="py-2.5 px-3">Access</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredFiles.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-zinc-500">
                      No files match your filter or search query.
                    </td>
                  </tr>
                ) : (
                  filteredFiles.map(file => {
                    const course = courses.find(c => c.id === file.courseId);
                    return (
                      <tr
                        key={file.id}
                        className="hover:bg-zinc-50/80 transition-colors group"
                      >
                        {/* Name with file icon */}
                        <td className="py-2.5 px-3 min-w-[220px]">
                          <div className="flex items-center gap-2">
                            {getFileIcon(file.name)}
                            <button
                              onClick={() => setPreviewFile(file)}
                              className="font-medium text-zinc-900 hover:text-[#26394D] hover:underline text-left truncate cursor-pointer"
                              title={`Preview ${file.name}`}
                            >
                              {file.name}
                            </button>
                          </div>
                        </td>

                        {/* Course */}
                        <td className="py-2.5 px-3 text-zinc-600 whitespace-nowrap">
                          {course?.code || 'General'}
                        </td>

                        {/* Folder */}
                        <td className="py-2.5 px-3 text-zinc-600 whitespace-nowrap">
                          {file.category}
                        </td>

                        {/* Modified Date */}
                        <td className="py-2.5 px-3 text-zinc-500 whitespace-nowrap">
                          {file.uploadedAt}
                        </td>

                        {/* Modified By */}
                        <td className="py-2.5 px-3 text-zinc-600 whitespace-nowrap">
                          {file.uploadedBy}
                        </td>

                        {/* File Size */}
                        <td className="py-2.5 px-3 text-zinc-500 whitespace-nowrap">
                          {file.size}
                        </td>

                        {/* Natural Access State (No chunky pill badges) */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {file.isClassMaterials ? (
                            <span className="inline-flex items-center gap-1 text-zinc-600 text-[11px]">
                              <Lock className="w-3 h-3 text-zinc-400" />
                              <span>Read-only</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-zinc-600 text-[11px]">
                              <Users className="w-3 h-3 text-zinc-400" />
                              <span>Collaborative</span>
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setPreviewFile(file)}
                              className="p-1 text-zinc-400 hover:text-[#26394D] rounded hover:bg-zinc-100"
                              title="Preview"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDownload(file)}
                              className="p-1 text-zinc-400 hover:text-[#26394D] rounded hover:bg-zinc-100"
                              title="Download to computer"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            {(isTeacherOrAdmin || file.uploadedBy === currentUser.name) && (
                              <button
                                onClick={() => {
                                  if (confirm(`Delete ${file.name}?`)) {
                                    deleteCourseFile(file.id);
                                  }
                                }}
                                className="p-1 text-zinc-400 hover:text-rose-600 rounded hover:bg-zinc-100"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="bg-zinc-50/50 px-4 py-2 border-t border-zinc-200 text-[11px] text-zinc-500 flex items-center justify-between">
            <span>
              {filteredFiles.length} file{filteredFiles.length === 1 ? '' : 's'} listed
            </span>
            <span className="flex items-center gap-1.5 font-medium text-zinc-600">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              ProCollege Document Library
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Document Preview Modal */}
      {previewFile && (
        <FilePreviewModal
          file={{
            name: previewFile.name,
            size: previewFile.size,
            url: previewFile.url,
            uploadedBy: previewFile.uploadedBy,
            uploadedAt: previewFile.uploadedAt,
            category: previewFile.category,
            courseName: courses.find(c => c.id === previewFile.courseId)?.name
          }}
          isOpen={Boolean(previewFile)}
          onClose={() => setPreviewFile(null)}
          onDownload={() => {
            handleDownload(previewFile);
          }}
        />
      )}
    </div>
  );
};
