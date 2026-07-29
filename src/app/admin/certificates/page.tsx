"use client";

import React, { useState, useEffect } from "react";
import { 
  Award, Search, Filter, Download, CheckCircle, 
  XCircle, RefreshCw, Printer, Eye, MoreVertical, Plus, X 
} from "lucide-react";
import { toast } from "sonner";

export default function AdminCertificatesPage() {
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Dropdown list data for custom creation
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [allCourses, setAllCourses] = useState<any[]>([]);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'approve' | 'create_custom'>('approve');
  const [selectedCert, setSelectedCert] = useState<any>(null);

  // Form Fields
  const [studentId, setStudentId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [customStudentName, setCustomStudentName] = useState("");
  const [customCourseTitle, setCustomCourseTitle] = useState("");
  const [conductedAt, setConductedAt] = useState("SP ART HUB");
  const [grade, setGrade] = useState("B");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/certificates?status=${statusFilter}&search=${searchTerm}`);
      const data = await res.json();
      if (data.success) {
        setCertificates(data.data);
      }
    } catch (e) {
      toast.error("Failed to load certificates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, [statusFilter]);

  useEffect(() => {
    // Pre-load students and courses for dropdown list
    const loadDropdownData = async () => {
      try {
        const studentRes = await fetch('/api/students');
        const studentData = await studentRes.json();
        if (studentData.students) {
          setAllStudents(studentData.students);
        }

        const courseRes = await fetch('/api/courses');
        const courseData = await courseRes.json();
        if (courseData.courses) {
          setAllCourses(courseData.courses);
        }
      } catch (e) {
        console.error('Error loading dropdown data:', e);
      }
    };
    loadDropdownData();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCertificates();
  };

  const handleAction = async (id: string, action: string) => {
    try {
      setIsProcessing(true);
      const res = await fetch(`/api/admin/certificates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Certificate ${action}d successfully`);
        fetchCertificates();
      } else {
        toast.error(data.error || `Failed to ${action} certificate`);
      }
    } catch (e) {
      toast.error(`Error processing ${action}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApproveWithCustomData = async (id: string, customData: any) => {
    try {
      setIsProcessing(true);
      const res = await fetch(`/api/admin/certificates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve', ...customData })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Certificate approved and generated successfully`);
        setIsModalOpen(false);
        fetchCertificates();
      } else {
        toast.error(data.error || `Failed to approve certificate`);
      }
    } catch (e) {
      toast.error(`Error approving certificate`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return;
    try {
      setIsProcessing(true);
      const res = await fetch(`/api/admin/certificates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'bulk_approve', ids: selectedIds })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Bulk approved ${data.data.length} certificates`);
        setSelectedIds([]);
        fetchCertificates();
      } else {
        toast.error(data.error || "Failed bulk approval");
      }
    } catch (e) {
      toast.error("Error processing bulk approval");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAutoGenerate = async () => {
    try {
      setIsProcessing(true);
      const res = await fetch(`/api/admin/certificates/auto-generate`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        if (data.data.generatedCount > 0) {
          toast.success(`Successfully generated ${data.data.generatedCount} new pending certificates!`);
          fetchCertificates();
        } else {
          toast.info("No new eligible students found. Ensure students have 100% completion and 0 remaining fees.");
        }
      } else {
        toast.error(data.error || "Failed to auto-generate certificates");
      }
    } catch (e) {
      toast.error("Error triggering auto-generation");
    } finally {
      setIsProcessing(false);
    }
  };

  const openApproveModal = (cert: any) => {
    setSelectedCert(cert);
    setModalMode('approve');
    setStudentId(cert.studentId?._id || cert.studentId || "");
    setCourseId(cert.courseId?._id || cert.courseId || "");
    setCustomStudentName(cert.studentId?.fullName || cert.studentId?.name || "");
    setCustomCourseTitle(cert.courseId?.courseTitle || cert.courseId?.title || "");
    setConductedAt(cert.conductedAt || "SP ART HUB");
    setGrade(cert.grade || "B");
    setFromDate(cert.fromDate || "");
    setToDate(cert.toDate || "");
    setIssueDate(cert.issueDate ? cert.issueDate.split('T')[0] : new Date().toISOString().split('T')[0]);
    setIsModalOpen(true);
  };

  const openCreateCustomModal = () => {
    setSelectedCert(null);
    setModalMode('create_custom');
    setStudentId("");
    setCourseId("");
    setCustomStudentName("");
    setCustomCourseTitle("");
    setConductedAt("SP ART HUB");
    setGrade("B");
    setFromDate("");
    setToDate("");
    setIssueDate(new Date().toISOString().split('T')[0]);
    setIsModalOpen(true);
  };

  const handleStudentChange = (id: string) => {
    setStudentId(id);
    const stud = allStudents.find(s => s.id === id || s._id === id);
    if (stud) {
      setCustomStudentName(stud.name || stud.fullName || "");
    }
  };

  const handleCourseChange = (id: string) => {
    setCourseId(id);
    const crs = allCourses.find(c => c.id === id || c._id === id);
    if (crs) {
      setCustomCourseTitle(crs.courseTitle || crs.title || "");
    }
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      customStudentName,
      customCourseTitle,
      fromDate,
      toDate,
      grade,
      conductedAt,
      issueDate,
    };

    if (modalMode === 'approve') {
      try {
        setIsProcessing(true);
        const res = await fetch(`/api/admin/certificates/${selectedCert._id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'approve', ...payload })
        });
        const data = await res.json();
        if (data.success) {
          toast.success(`Certificate approved and generated successfully`);
          setIsModalOpen(false);
          fetchCertificates();
          // Open PDF immediately
          window.open(`/api/view-pdf?id=${selectedCert._id}`, "_blank");
        } else {
          toast.error(data.error || `Failed to approve certificate`);
        }
      } catch (e) {
        toast.error(`Error approving certificate`);
      } finally {
        setIsProcessing(false);
      }
    } else {
      if (!studentId || !courseId) {
        toast.error("Please select a student and course");
        return;
      }
      try {
        setIsProcessing(true);
        const res = await fetch('/api/admin/certificates/create-custom', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentId, courseId, ...payload })
        });
        const data = await res.json();
        if (data.success) {
          toast.success("Custom certificate generated successfully!");
          setIsModalOpen(false);
          fetchCertificates();
          // Open PDF immediately
          window.open(`/api/view-pdf?id=${data.data._id}`, "_blank");
        } else {
          toast.error(data.error || "Failed to create custom certificate");
        }
      } catch (e) {
        toast.error("Error creating custom certificate");
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    if (selectedIds.length === certificates.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(certificates.map(c => c._id));
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Certificates</h1>
          <p className="text-slate-500 mt-1">Manage and approve student course completion certificates</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={openCreateCustomModal}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-medium transition-colors shadow-sm flex items-center gap-2"
          >
            <Plus size={18} />
            Create Custom
          </button>
          <button 
            onClick={handleAutoGenerate}
            disabled={isProcessing}
            className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2.5 rounded-xl font-medium transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
          >
            <RefreshCw size={18} className={isProcessing ? "animate-spin" : ""} />
            Scan & Generate
          </button>
          <button 
            onClick={() => fetchCertificates()}
            className="p-2.5 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200 bg-white shadow-sm tooltip"
            title="Refresh List"
          >
            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
          </button>
          {selectedIds.length > 0 && (
            <button 
              onClick={handleBulkApprove}
              disabled={isProcessing}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-medium transition-colors shadow-sm disabled:opacity-50"
            >
              Approve Selected ({selectedIds.length})
            </button>
          )}
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6 flex flex-col sm:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by student or course..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </form>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <Filter size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none min-w-[160px]"
            >
              <option value="all">All Statuses</option>
              <option value="pending_approval">Pending Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-medium">
              <tr>
                <th className="p-4 w-12 text-center">
                  <input 
                    type="checkbox" 
                    checked={certificates.length > 0 && selectedIds.length === certificates.length}
                    onChange={toggleAll}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                </th>
                <th className="p-4">Certificate Details</th>
                <th className="p-4">Student</th>
                <th className="p-4">Course</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    <div className="flex justify-center mb-2">
                      <RefreshCw className="animate-spin text-slate-300" />
                    </div>
                    Loading certificates...
                  </td>
                </tr>
              ) : certificates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    No certificates found matching your criteria.
                  </td>
                </tr>
              ) : (
                certificates.map((cert) => (
                  <tr key={cert._id} className="hover:bg-slate-50 transition-colors group">
                    <td className="p-4 text-center">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(cert._id)}
                        onChange={() => toggleSelect(cert._id)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                      />
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${cert.status === 'approved' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                          <Award size={20} />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{cert.certificateNumber}</p>
                          <p className="text-xs text-slate-500">
                            {cert.issueDate ? new Date(cert.issueDate).toLocaleDateString() : 'Not Issued'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="font-medium text-slate-700">{cert.customStudentName || cert.studentId?.fullName || 'Unknown'}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-slate-600">{cert.customCourseTitle || cert.courseId?.courseTitle || 'Unknown Course'}</span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        cert.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                        cert.status === 'rejected' ? 'bg-red-50 text-red-600 border border-red-200' :
                        'bg-amber-50 text-amber-600 border border-amber-200'
                      }`}>
                        {cert.status === 'approved' ? 'Approved' : 
                         cert.status === 'rejected' ? 'Rejected' : 'Pending Review'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {cert.status === 'pending_approval' && (
                          <>
                            <button 
                              onClick={() => openApproveModal(cert)}
                              disabled={isProcessing}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg tooltip"
                              title="Approve & Customize"
                            >
                              <CheckCircle size={18} />
                            </button>
                            <button 
                              onClick={() => handleAction(cert._id, 'reject')}
                              disabled={isProcessing}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg tooltip"
                              title="Reject"
                            >
                              <XCircle size={18} />
                            </button>
                          </>
                        )}
                        {cert.status === 'approved' && cert.pdfUrl && (
                          <>
                            <a 
                              href={cert.pdfUrl.includes("/api/view-pdf") ? cert.pdfUrl : `/api/view-pdf?url=${encodeURIComponent(cert.pdfUrl)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg tooltip"
                              title="View PDF"
                            >
                              <Eye size={18} />
                            </a>
                            <a 
                              href={`${cert.pdfUrl}&download=true`}
                              className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg tooltip"
                              title="Download"
                            >
                              <Download size={18} />
                            </a>
                          </>
                        )}
                        <button 
                          onClick={() => handleAction(cert._id, 'regenerate')}
                          disabled={isProcessing}
                          className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg tooltip"
                          title="Regenerate"
                        >
                          <RefreshCw size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customize & Approve/Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl border border-slate-100 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  {modalMode === 'approve' ? 'Customize & Generate Certificate' : 'Create Custom Certificate'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {modalMode === 'approve' ? 'Configure the variables before generating the final PDF' : 'Manually create a brand new certificate'}
                </p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleModalSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              {modalMode === 'create_custom' ? (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Select Student</label>
                    <select
                      value={studentId}
                      onChange={(e) => handleStudentChange(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="">-- Choose Student --</option>
                      {allStudents.map(s => (
                        <option key={s.id || s._id} value={s.id || s._id}>
                          {s.name || s.fullName} ({s.badgeId || 'No Badge ID'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Select Course</label>
                    <select
                      value={courseId}
                      onChange={(e) => handleCourseChange(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="">-- Choose Course --</option>
                      {allCourses.map(c => (
                        <option key={c.id || c._id} value={c.id || c._id}>
                          {c.courseTitle || c.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              ) : null}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Student Name (On Certificate)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Shourya Manore"
                  value={customStudentName}
                  onChange={(e) => setCustomStudentName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Course Name (On Certificate)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Basic Cartoon"
                  value={customCourseTitle}
                  onChange={(e) => setCustomCourseTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Conducted At</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SP ART HUB"
                  value={conductedAt}
                  onChange={(e) => setConductedAt(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Grade</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. B or A+"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Issue Date</label>
                  <input
                    type="date"
                    required
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">From Date</label>
                  <input
                    type="text"
                    placeholder="e.g. Dec 2025"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">To Date</label>
                  <input
                    type="text"
                    placeholder="e.g. May 2026"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 -mx-6 -mb-6 rounded-b-2xl">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-medium rounded-xl hover:bg-slate-100 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors text-sm shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {isProcessing && <RefreshCw size={14} className="animate-spin" />}
                  Generate & Approve
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
