import React, { useEffect, useState } from "react";
import { Award, Lock, FileText, Share2, Download, Eye, Clock } from "lucide-react";
import { useStore } from "@/store/dataStore";

export function CertificateEligibility({ data }: { data: any }) {
  const students = useStore(s => s.students);
  const me = students[0];
  const [eligibilityData, setEligibilityData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCertificates() {
      try {
        const res = await fetch(`/api/student/certificates`);
        const result = await res.json();
        
        if (result.success && result.data?.eligibility) {
          // Find the specific eligibility for this enrollment
          const current = result.data.eligibility.find((e: any) => 
            e.enrollmentId === data.enrollmentId
          );
          if (current) {
            setEligibilityData(current);
          } else {
            // Fallback to local data logic
            setEligibilityData({
              status: data.remaining === 0 ? 'eligible' : 'not_eligible',
              progress: {
                feePaid: data.remaining === 0,
                paidAmount: data.paid,
                totalAmount: data.totalFee
              }
            });
          }
        }
      } catch (err) {
        console.error("Error fetching certificates", err);
      } finally {
        setLoading(false);
      }
    }
    fetchCertificates();
  }, [me?.id, data.enrollmentId]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 text-center animate-pulse">
        <div className="w-16 h-16 bg-slate-200 rounded-full mx-auto mb-4"></div>
        <div className="h-4 bg-slate-200 rounded w-1/2 mx-auto mb-2"></div>
        <div className="h-3 bg-slate-200 rounded w-3/4 mx-auto mb-4"></div>
        <div className="h-10 bg-slate-200 rounded-xl w-full"></div>
      </div>
    );
  }

  // Fallback if API fails
  const status = eligibilityData?.status || (data.remaining === 0 ? 'eligible' : 'not_eligible');
  const certificate = eligibilityData?.certificate;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 text-center relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
      
      <div className="relative inline-block mb-4">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto transition-transform group-hover:scale-105 duration-300 ${
          status === 'approved' ? 'bg-green-100 text-green-600' :
          status === 'pending_approval' ? 'bg-blue-100 text-blue-500' :
          status === 'eligible' ? 'bg-amber-100 text-amber-500' :
          'bg-slate-100 text-slate-400'
        }`}>
          {status === 'pending_approval' ? <Clock size={32} /> : <Award size={32} />}
        </div>
        {status === 'not_eligible' && (
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center border-2 border-white">
            <Lock size={12} />
          </div>
        )}
      </div>
      
      <h3 className="font-bold text-slate-800 text-lg mb-2 relative z-10">
        {status === 'approved' ? 'Certificate Ready' : 'Certificate Eligibility'}
      </h3>
      
      <div className="relative z-10">
        {status === 'approved' && certificate ? (
          <>
            <p className="text-sm text-slate-600 mb-4">Congratulations! You have successfully completed your course.</p>
            <div className="flex flex-col gap-2">
              <a href={certificate.pdfUrl} target="_blank" rel="noopener noreferrer" className="w-full py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md">
                <Download size={16} /> Download Certificate
              </a>
              <div className="grid grid-cols-2 gap-2">
                <a href={certificate.pdfUrl} target="_blank" rel="noopener noreferrer" className="py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-sm transition-colors border border-slate-200 flex items-center justify-center gap-2">
                  <Eye size={16} /> View
                </a>
                <button className="py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-sm transition-colors border border-slate-200 flex items-center justify-center gap-2">
                  <Share2 size={16} /> Share
                </button>
              </div>
            </div>
          </>
        ) : status === 'pending_approval' ? (
          <>
            <p className="text-sm text-slate-600 mb-4">Your certificate has been submitted for admin verification. Please wait for approval.</p>
            <button disabled className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-500 font-bold text-sm flex items-center justify-center gap-2 border border-slate-200 cursor-not-allowed">
              <Clock size={16} /> Under Review
            </button>
          </>
        ) : status === 'eligible' ? (
          <>
            <p className="text-sm text-slate-600 mb-4">Congratulations! You are eligible for the course completion certificate.</p>
            <button disabled className="w-full py-2.5 rounded-xl bg-amber-500 text-white font-bold text-sm opacity-50 cursor-not-allowed flex items-center justify-center gap-2">
              <Clock size={16} /> Processing...
            </button>
            <p className="text-xs text-slate-400 mt-2">Automatically generating your certificate...</p>
          </>
        ) : (
          <>
            <p className="text-sm text-slate-500 mb-2">Complete your course and clear all pending fees to unlock your certificate.</p>
            <div className="w-full bg-slate-100 rounded-full h-2 mt-4 overflow-hidden">
              <div 
                className="bg-amber-400 h-full rounded-full transition-all duration-1000" 
                style={{ width: `${(data.paid / (data.paid + data.remaining)) * 100}%` }}
              ></div>
            </div>
            <p className="text-xs text-slate-500 mt-2 font-medium">Payment Progress: ₹{data.paid.toLocaleString()} / ₹{(data.paid + data.remaining).toLocaleString()}</p>
          </>
        )}
      </div>
    </div>
  );
}
