"use client";

import React, { useEffect, useState } from "react";
import { Award, Download, Eye, Share2, Printer, Search, FileText } from "lucide-react";
import { useStore } from "@/store/dataStore";

export default function StudentCertificatesPage() {
  const students = useStore(s => s.students);
  const me = students[0];
  
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCert, setSelectedCert] = useState<any>(null);

  useEffect(() => {
    async function fetchCertificates() {
      try {
        const res = await fetch(`/api/student/certificates`);
        const data = await res.json();
        if (data.success) {
          setCertificates(data.data.certificates);
          if (data.data.certificates.length > 0) {
            setSelectedCert(data.data.certificates[0]);
          }
        }
      } catch (e) {
        console.error("Failed to load certificates", e);
      } finally {
        setLoading(false);
      }
    }
    fetchCertificates();
  }, [me?.id]);

  const filteredCerts = certificates.filter(c => 
    c.courseId?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.certificateNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePrint = (url: string) => {
    const printWindow = window.open(url, "_blank");
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-[1400px] mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 font-display">My Certificates</h1>
          <p className="text-slate-500 mt-2">View, download, and share your course completion certificates.</p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : certificates.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center max-w-2xl mx-auto mt-12">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Award size={48} className="text-slate-300" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">No Certificates Yet</h2>
            <p className="text-slate-500 mb-6">Complete your courses and clear all dues to unlock your completion certificates.</p>
            <a href="/student/fees" className="inline-flex items-center gap-2 bg-emerald-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-emerald-600 transition-colors">
              View Course Progress
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Sidebar List */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <div className="relative mb-4">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search certificates..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                
                <div className="space-y-3">
                  {filteredCerts.map((cert) => (
                    <div 
                      key={cert._id}
                      onClick={() => setSelectedCert(cert)}
                      className={`p-4 rounded-xl cursor-pointer border transition-all ${
                        selectedCert?._id === cert._id 
                          ? 'bg-emerald-50 border-emerald-200 shadow-sm' 
                          : 'bg-white border-slate-100 hover:border-emerald-100 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex gap-3 items-start">
                        <div className={`p-2 rounded-lg ${selectedCert?._id === cert._id ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                          <Award size={20} />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-800">{cert.courseId?.title}</h4>
                          <p className="text-xs text-slate-500 mt-1">Issued: {new Date(cert.issueDate).toLocaleDateString()}</p>
                          <p className="text-xs font-medium text-slate-400 mt-1">{cert.certificateNumber}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Preview */}
            <div className="lg:col-span-8">
              {selectedCert && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full min-h-[600px]">
                  <div className="p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-slate-800">{selectedCert.courseId?.title}</h2>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1.5 text-sm text-slate-500">
                          <FileText size={16} /> {selectedCert.certificateNumber}
                        </span>
                        <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium bg-emerald-50 px-2.5 py-0.5 rounded-full">
                          Verified
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <a 
                        href={selectedCert.pdfUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors tooltip"
                        title="View Full PDF"
                      >
                        <Eye size={20} />
                      </a>
                      <button 
                        onClick={() => handlePrint(selectedCert.pdfUrl)}
                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors tooltip"
                        title="Print"
                      >
                        <Printer size={20} />
                      </button>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(`Check out my certificate: ${window.location.origin}/verify/${selectedCert.certificateNumber}`);
                          // Would normally use toast here
                          alert("Link copied to clipboard!");
                        }}
                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors tooltip"
                        title="Share Link"
                      >
                        <Share2 size={20} />
                      </button>
                      <a 
                        href={selectedCert.pdfUrl}
                        download={`Certificate_${selectedCert.certificateNumber}.pdf`}
                        className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                      >
                        <Download size={18} /> Download
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex-1 bg-slate-100 p-8 flex items-center justify-center relative min-h-[500px]">
                    {/* PDF Viewer / Image Preview */}
                    {selectedCert.pdfUrl ? (
                      <iframe 
                        src={`${selectedCert.pdfUrl}#toolbar=0`} 
                        className="w-full h-full min-h-[600px] rounded-xl shadow-sm bg-white"
                        title="Certificate PDF Preview"
                      />
                    ) : (
                      <div className="text-center text-slate-400">
                        <Award size={64} className="mx-auto mb-4 opacity-50" />
                        <p>Preview not available</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
          </div>
        )}
      </div>
    </div>
  );
}
