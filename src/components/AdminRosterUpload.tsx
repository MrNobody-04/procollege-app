import React, { useState, useRef } from 'react';
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  Copy,
  Users,
  KeyRound,
  Send,
  Loader2,
  FileCheck,
  ShieldAlert
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useApp } from '../context/AppContext';

interface ParsedStudentRow {
  name: string;
  phone: string;
  email: string;
  faculty: string;
  className: string;
}

interface GeneratedCredential {
  id: string;
  name: string;
  phone: string;
  email: string;
  faculty: string;
  class: string;
  temporaryPassword: string;
  status: string;
}

export const AdminRosterUpload: React.FC = () => {
  const { courses, faculties, currentUser, showDialog, addPost, selectedCourse } = useApp();

  const [selectedCourseId, setSelectedCourseId] = useState<string>(selectedCourse?.id || courses[0]?.id || '');
  const [selectedFacultyId, setSelectedFacultyId] = useState<string>(faculties[0]?.id || '');
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedStudentRow[]>([]);
  const [parseError, setParseError] = useState<string>('');
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [generatedCredentials, setGeneratedCredentials] = useState<GeneratedCredential[]>([]);
  const [copied, setCopied] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const targetCourse = courses.find(c => c.id === selectedCourseId) || courses[0];
  const targetFaculty = faculties.find(f => f.id === selectedFacultyId) || faculties[0];

  // 1. Download Sample Template (.xlsx)
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        Name: 'Aarav Sharma',
        Phone: '+977-9841234567',
        Gmail: 'aarav.sharma@gmail.com',
        Department: targetFaculty?.name || 'Department of BIT',
        Class: targetCourse?.name || 'BIT 501 - Cloud Computing & Distributed Systems'
      },
      {
        Name: 'Pooja Thapa',
        Phone: '+977-9812345678',
        Gmail: 'pooja.thapa@gmail.com',
        Department: targetFaculty?.name || 'Department of BIT',
        Class: targetCourse?.name || 'BIT 501 - Cloud Computing & Distributed Systems'
      },
      {
        Name: 'Bikash Adhikari',
        Phone: '+977-9867890123',
        Gmail: 'bikash.adhikari@gmail.com',
        Department: targetFaculty?.name || 'Department of BIT',
        Class: targetCourse?.name || 'BIT 501 - Cloud Computing & Distributed Systems'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Student Roster');
    XLSX.writeFile(workbook, 'procollege_student_roster_template.xlsx');
  };

  // 2. Handle File Selection and Parsing
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setParseError('');
    setGeneratedCredentials([]);
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (!rawJson || rawJson.length === 0) {
          setParseError('The uploaded sheet is empty. Please use the sample template.');
          setParsedRows([]);
          return;
        }

        const validRows: ParsedStudentRow[] = [];
        for (const r of rawJson) {
          const name = r.Name || r.name || r['Student Name'] || r['Full Name'];
          const phone = r.Phone || r.phone || r['Mobile'] || r['Phone Number'] || '';
          const email = r.Gmail || r.gmail || r.Email || r.email || r['Gmail Address'];
          const faculty = r.Department || r.department || r.Faculty || r.faculty || targetFaculty?.name || 'General';
          const className = r.Class || r.class || r['Class Name'] || targetCourse?.name || 'General';

          if (name && email) {
            validRows.push({
              name: String(name).trim(),
              phone: String(phone).trim(),
              email: String(email).trim().toLowerCase(),
              faculty: String(faculty).trim(),
              className: String(className).trim()
            });
          }
        }

        if (validRows.length === 0) {
          setParseError('Could not find required columns (Name and Gmail). Download the template to ensure column headers match.');
          setParsedRows([]);
        } else {
          setParsedRows(validRows);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setParseError(`Failed to parse file: ${msg}`);
      }
    };

    reader.readAsBinaryString(selectedFile);
  };

  // 3. Submit Roster to Backend API
  const handleImportRoster = async () => {
    if (parsedRows.length === 0) return;
    setIsImporting(true);
    try {
      const res = await fetch('/api/admin/import-roster', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': currentUser.role || 'admin',
          'Authorization': `Bearer ${localStorage.getItem('procollege_token') || 'admin'}`
        },
        body: JSON.stringify({
          students: parsedRows,
          courseId: targetCourse?.id,
          institutionId: currentUser.institutionId || currentUser.collegeId,
          institutionName: currentUser.institutionName || currentUser.collegeName || 'Academic Institution',
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server returned HTTP ${res.status}`);
      }

      const data = await res.json();
      setGeneratedCredentials(data.credentials || []);
      showDialog(`Successfully imported and generated secure credentials for ${data.totalImported} students!`, {
        type: 'success',
        title: 'Bulk Roster Imported'
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showDialog(`Roster Import Failed: ${msg}`, { type: 'error', title: 'Import Error' });
    } finally {
      setIsImporting(false);
    }
  };

  // 4. Download Generated Credentials (.CSV or .XLSX)
  const handleDownloadCredentials = (format: 'xlsx' | 'csv') => {
    if (generatedCredentials.length === 0) return;
    const exportData = generatedCredentials.map(c => ({
      'Student Name': c.name,
      'Phone': c.phone,
      'Gmail (Login ID)': c.email,
      'Temporary Password': c.temporaryPassword,
      'Target Class': c.class,
      'Faculty': c.faculty,
      'Status': c.status
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Student Credentials');

    if (format === 'xlsx') {
      XLSX.writeFile(workbook, `procollege_credentials_${targetCourse?.code || 'batch'}.xlsx`);
    } else {
      XLSX.writeFile(workbook, `procollege_credentials_${targetCourse?.code || 'batch'}.csv`);
    }
  };

  // 5. Copy Formatted Announcement text
  const handleCopyAnnouncement = () => {
    if (generatedCredentials.length === 0) return;
    let text = `📢 OFFICIAL PROCOLLEGE CREDENTIAL DISTRIBUTION\n`;
    text += `Class: ${targetCourse?.name || 'Academic Course'} (${targetCourse?.code || 'PDC'})\n`;
    text += `Institution: ${currentUser.institutionName || currentUser.collegeName || 'Academic Institution'}\n\n`;
    text += `Please find your official login credentials below. When you sign in, an email 2FA verification code will be sent directly to your Gmail, and you will set your permanent password.\n\n`;
    text += `--------------------------------------------------------\n`;
    text += `NAME | GMAIL | TEMPORARY PASSWORD\n`;
    text += `--------------------------------------------------------\n`;
    for (const c of generatedCredentials) {
      text += `${c.name} | ${c.email} | ${c.temporaryPassword}\n`;
    }
    text += `--------------------------------------------------------\n`;
    text += `🔗 Access Portal: https://procollege-app.sujan-bit-n2024.workers.dev\n`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // 6. Broadcast Announcement to Course Channel
  const handlePostAnnouncement = () => {
    if (!targetCourse) return;
    const genChannel = targetCourse.channels.find(ch => ch.isGeneral || ch.name.toLowerCase().includes('announcement')) || targetCourse.channels[0];
    if (!genChannel) return;

    let summary = `🎓 Welcome new students! Login credentials have been generated for ${generatedCredentials.length} enrolled students in ${targetCourse.code}.\n\n`;
    summary += `Check your registered Gmail for login instructions or refer to the downloaded credential register.`;

    addPost(genChannel.id, `🎓 Welcome Enrolled Students - ${targetCourse.code}`, summary, true, undefined, 'general');
    showDialog(`Announcement broadcasted to #${genChannel.name} in ${targetCourse.code}!`, {
      type: 'success',
      title: 'Announcement Published'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-[#101b46] rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30 text-xs font-semibold mb-3">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Zero-Budget Excel Roster Import Engine</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-1">Bulk Student Provisioning & Credentials</h2>
          <p className="text-xs text-blue-200/80 leading-relaxed">
            Upload institutional student rosters (.xlsx / .csv). ProCollege automatically generates secure temporary credentials, binds students to designated class channels, and prepares formatted distribution registers.
          </p>
        </div>
      </div>

      {/* Target Class Selection & Template Bar */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        <div>
          <label className="block text-xs font-bold text-zinc-700 mb-1">Target Department</label>
          <select
            value={selectedFacultyId}
            onChange={(e) => setSelectedFacultyId(e.target.value)}
            className="w-full text-xs font-medium text-zinc-800 bg-zinc-50 border border-zinc-300 rounded-lg p-2.5 focus:outline-none focus:border-[#26394D]"
          >
            {faculties.map(f => (
              <option key={f.id} value={f.id}>{f.name} ({f.code})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-zinc-700 mb-1">Target Class / Academic Course</label>
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="w-full text-xs font-medium text-zinc-800 bg-zinc-50 border border-zinc-300 rounded-lg p-2.5 focus:outline-none focus:border-[#26394D]"
          >
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.code}: {c.name}</option>
            ))}
          </select>
        </div>

        <div className="flex md:justify-end items-end pt-5">
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors shadow-2xs cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download Sample Template (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* File Upload Box */}
      <div className="bg-white rounded-2xl border-2 border-dashed border-zinc-300 hover:border-indigo-500 p-8 text-center transition-colors shadow-xs">
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx, .xls, .csv"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="max-w-md mx-auto space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-[#26394D] flex items-center justify-center mx-auto shadow-inner">
            <Upload className="w-7 h-7" />
          </div>

          <div>
            <p className="text-sm font-bold text-zinc-800">
              {file ? file.name : 'Select or drag your student roster Excel file'}
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              Supports .xlsx, .xls, or .csv with columns: <span className="font-mono text-indigo-600 font-bold">Name, Phone, Gmail, Faculty, Class</span>
            </p>
          </div>

          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#101b46] hover:bg-[#172b7a] text-white transition-all shadow-md active:scale-95 cursor-pointer"
            >
              Browse Files
            </button>

            {parsedRows.length > 0 && (
              <button
                type="button"
                onClick={handleImportRoster}
                disabled={isImporting}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white transition-all shadow-md active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                <span>Import {parsedRows.length} Students & Generate Logins</span>
              </button>
            )}
          </div>
        </div>

        {parseError && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-center gap-2 max-w-lg mx-auto">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{parseError}</span>
          </div>
        )}
      </div>

      {/* Parsed Preview Table (Before Import) */}
      {parsedRows.length > 0 && generatedCredentials.length === 0 && (
        <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-xs">
          <div className="p-4 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#26394D]" />
              <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wide">
                Roster Preview ({parsedRows.length} students detected)
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Ready to Import
            </span>
          </div>

          <div className="overflow-x-auto max-h-72">
            <table className="w-full text-left text-xs text-zinc-700 divide-y divide-zinc-200">
              <thead className="bg-zinc-100 text-zinc-500 font-semibold sticky top-0">
                <tr>
                  <th className="py-2 px-3">#</th>
                  <th className="py-2 px-3">Student Name</th>
                  <th className="py-2 px-3">Phone</th>
                  <th className="py-2 px-3">Gmail Address</th>
                  <th className="py-2 px-3">Department</th>
                  <th className="py-2 px-3">Assigned Class</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {parsedRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-zinc-50">
                    <td className="py-2 px-3 font-mono text-zinc-400">{idx + 1}</td>
                    <td className="py-2 px-3 font-bold text-zinc-900">{row.name}</td>
                    <td className="py-2 px-3 font-mono text-zinc-600">{row.phone || '—'}</td>
                    <td className="py-2 px-3 font-mono text-indigo-700">{row.email}</td>
                    <td className="py-2 px-3 text-zinc-600">{row.faculty}</td>
                    <td className="py-2 px-3 text-zinc-600">{row.className}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Generated Credentials Output Bar (After Import) */}
      {generatedCredentials.length > 0 && (
        <div className="bg-white rounded-2xl border-2 border-emerald-500 overflow-hidden shadow-lg animate-in fade-in duration-300">
          <div className="p-5 bg-emerald-50/70 border-b border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-emerald-900">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <h3 className="font-bold text-sm">
                  {generatedCredentials.length} Student Credentials Generated & Enrolled in {targetCourse?.code}!
                </h3>
              </div>
              <p className="text-xs text-emerald-700 mt-0.5">
                Accounts are active with zero-cost OTP Gmail verification enabled. Export the credentials below for the college announcement channel.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleDownloadCredentials('xlsx')}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-emerald-800 border border-emerald-300 hover:bg-emerald-50 shadow-2xs flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export .XLSX</span>
              </button>

              <button
                type="button"
                onClick={() => handleDownloadCredentials('csv')}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-emerald-800 border border-emerald-300 hover:bg-emerald-50 shadow-2xs flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export .CSV</span>
              </button>

              <button
                type="button"
                onClick={handleCopyAnnouncement}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-2xs flex items-center gap-1.5 cursor-pointer"
              >
                {copied ? <FileCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied Announcement!' : 'Copy Announcement Text'}</span>
              </button>

              <button
                type="button"
                onClick={handlePostAnnouncement}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#101b46] hover:bg-[#172b7a] text-white shadow-2xs flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Post to Class Noticeboard</span>
              </button>
            </div>
          </div>

          <div className="p-4 bg-amber-50/60 border-b border-amber-200 text-xs text-amber-800 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600" />
            <span>
              <strong>Zero-Cost Distribution Security:</strong> Students will sign in with their Gmail and temporary password, then verify via a 6-digit OTP code before setting their permanent password.
            </span>
          </div>

          <div className="overflow-x-auto max-h-80">
            <table className="w-full text-left text-xs text-zinc-700 divide-y divide-zinc-200">
              <thead className="bg-zinc-50 text-zinc-500 font-semibold sticky top-0">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Student Name</th>
                  <th className="py-2.5 px-3">Gmail Address</th>
                  <th className="py-2.5 px-3">Temporary Password</th>
                  <th className="py-2.5 px-3">Phone</th>
                  <th className="py-2.5 px-3">Class</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {generatedCredentials.map((c, idx) => (
                  <tr key={c.id} className="hover:bg-zinc-50">
                    <td className="py-2 px-3 font-mono text-zinc-400">{idx + 1}</td>
                    <td className="py-2 px-3 font-bold text-zinc-900">{c.name}</td>
                    <td className="py-2 px-3 font-mono text-indigo-700">{c.email}</td>
                    <td className="py-2 px-3 font-mono text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block my-1">
                      {c.temporaryPassword}
                    </td>
                    <td className="py-2 px-3 font-mono text-zinc-600">{c.phone || '—'}</td>
                    <td className="py-2 px-3 text-zinc-600">{c.class}</td>
                    <td className="py-2 px-3">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
