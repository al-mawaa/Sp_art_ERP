"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle, XCircle, Award, Calendar, User, BookOpen, AlertCircle } from "lucide-react";

export default function VerifyCertificatePage() {
  const { certificateNumber } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function verify() {
      try {
        const res = await fetch(`/api/public/verify-certificate/${certificateNumber}`);
        const result = await res.json();
        if (result.success) {
          setData(result.data);
        } else {
          setError(result.error || "Certificate not found");
        }
      } catch (err) {
        setError("Failed to verify certificate. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    if (certificateNumber) {
      verify();
    }
  }, [certificateNumber]);

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center font-sans">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-4 border border-slate-100">
            <Award size={40} className="text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Certificate Verification</h1>
          <p className="text-slate-500 mt-2">Verify the authenticity of SP Art Hub certificates</p>
        </div>

        <div className="bg-white shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden border border-slate-100">
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-500 font-medium">Verifying certificate...</p>
            </div>
          ) : error || data?.status !== 'approved' ? (
            <div className="p-8 text-center bg-red-50/50">
              <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle size={32} />
              </div>
              <h2 className="text-xl font-bold text-red-700 mb-2">Verification Failed</h2>
              <p className="text-red-600/80 mb-6">{error || "This certificate is not active or has been revoked."}</p>
              <div className="bg-white p-4 rounded-xl border border-red-100 text-sm text-slate-600">
                <span className="font-semibold block mb-1">Searched Number:</span>
                <span className="font-mono text-red-500">{certificateNumber}</span>
              </div>
            </div>
          ) : (
            <div>
              <div className="bg-emerald-50 p-6 text-center border-b border-emerald-100">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle size={32} />
                </div>
                <h2 className="text-xl font-bold text-emerald-800">Verified Authentic</h2>
                <p className="text-emerald-600/80 text-sm mt-1">This certificate is valid and issued by SP Art Hub</p>
              </div>

              <div className="p-6 space-y-5">
                <div className="flex items-start gap-4">
                  <div className="p-2.5 bg-slate-50 text-slate-500 rounded-xl border border-slate-100">
                    <User size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Student Name</p>
                    <p className="font-semibold text-slate-800">{data.studentName}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-2.5 bg-slate-50 text-slate-500 rounded-xl border border-slate-100">
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Course Completed</p>
                    <p className="font-semibold text-slate-800">{data.courseName}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-slate-50 text-slate-500 rounded-lg border border-slate-100">
                      <Award size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Cert No.</p>
                      <p className="font-mono text-sm font-medium text-slate-700">{data.certificateNumber}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-slate-50 text-slate-500 rounded-lg border border-slate-100">
                      <Calendar size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Issue Date</p>
                      <p className="text-sm font-medium text-slate-700">
                        {data.issueDate ? new Date(data.issueDate).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
                {data.pdfUrl ? (
                  <a 
                    href={data.pdfUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-6 py-2.5 rounded-xl font-medium transition-colors w-full justify-center"
                  >
                    View Original Certificate
                  </a>
                ) : (
                  <p className="text-xs text-slate-500 flex items-center justify-center gap-1.5">
                    <AlertCircle size={14} /> PDF preview not available
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
        
        <p className="text-center text-slate-400 text-xs mt-8">
          This verification page is securely generated by the SP Art Hub ERP System.
        </p>
      </div>
    </div>
  );
}
