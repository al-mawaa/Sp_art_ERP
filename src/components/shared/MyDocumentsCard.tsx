"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { FileText, Download, Calendar, Folder, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Document = {
  id: string;
  name: string;
  type: string;
  fileUrl: string;
  fileType: string;
  uploadedAt: string | Date;
};

interface MyDocumentsCardProps {
  apiEndpoint: string;
}

export function MyDocumentsCard({ apiEndpoint }: MyDocumentsCardProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(apiEndpoint);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to fetch documents");
      setDocuments(json.documents || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [apiEndpoint]);

  const handleDownload = (fileUrl: string, fileName: string) => {
    window.open(fileUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="glass-card p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Folder className="w-5 h-5 text-primary" /> My Documents
        </h2>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Folder className="w-5 h-5 text-primary" /> My Documents
        </h2>
        <div className="text-center py-8 text-red-500">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Folder className="w-5 h-5 text-primary" /> My Documents
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchDocuments}
          className="text-xs"
        >
          Refresh
        </Button>
      </div>

      {documents.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-xl">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No documents have been shared yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-4 rounded-xl border border-border/50 hover:bg-muted/50 transition-colors group"
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate">{doc.name}</h3>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(doc.uploadedAt), "MMM dd, yyyy")}
                    </span>
                    <span className="px-2 py-0.5 bg-muted rounded-full text-xs">
                      {doc.type}
                    </span>
                  </div>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDownload(doc.fileUrl, doc.name)}
                className="shrink-0 ml-4"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
