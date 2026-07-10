import React from "react";
import { BookOpen, CheckCircle } from "lucide-react";

export function CourseProgressWidget({ profile }: any) {
  const course = profile?.courseName || "Art Foundation Level 1";
  const progress = 65; // Mock progress

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <h3 className="font-bold text-slate-800 text-lg mb-6">Course Progress</h3>
      
      <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 mb-6">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <BookOpen className="text-blue-500" size={18} />
            <h4 className="font-bold text-slate-800">{course}</h4>
          </div>
          <span className="font-bold text-blue-600">{progress}%</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2.5 mt-3 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2.5 rounded-full" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      <h4 className="font-semibold text-slate-700 mb-3 text-sm uppercase tracking-wider">Recent Assignments</h4>
      <div className="space-y-3">
        {[
          { name: "Still Life Sketch", status: "Graded (A)", completed: true },
          { name: "Color Theory Worksheet", status: "Pending Review", completed: true },
          { name: "Final Portfolio", status: "Due in 2 weeks", completed: false },
        ].map((task, i) => (
          <div key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-3">
              <CheckCircle size={18} className={task.completed ? "text-emerald-500" : "text-slate-300"} />
              <span className={`font-medium ${task.completed ? 'text-slate-700' : 'text-slate-500'}`}>{task.name}</span>
            </div>
            <span className={`text-xs font-semibold px-2 py-1 rounded ${task.status.includes('Graded') ? 'bg-emerald-100 text-emerald-700' : task.status.includes('Pending') ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
              {task.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
