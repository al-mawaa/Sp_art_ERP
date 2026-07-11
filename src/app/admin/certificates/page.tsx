"use client";

import React, { useState, useEffect } from "react";
import { 
  Award, Search, Filter, Download, CheckCircle, 
  XCircle, RefreshCw, Printer, Eye, MoreVertical 
} from "lucide-react";
import { toast } from "sonner";

export default function AdminCertificatesPage() {
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

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
                      <span className="font-medium text-slate-700">{cert.studentId?.fullName || 'Unknown'}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-slate-600">{cert.courseId?.courseTitle || 'Unknown Course'}</span>
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
                              onClick={() => handleAction(cert._id, 'approve')}
                              disabled={isProcessing}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg tooltip"
                              title="Approve"
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
                              href={cert.pdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg tooltip"
                              title="View PDF"
                            >
                              <Eye size={18} />
                            </a>
                            <a 
                              href={cert.pdfUrl}
                              download
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
    </div>
  );
}
