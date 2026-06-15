"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { adminSessionAuthHeaders } from "@/lib/auth/admin-session-client";

const roleLabels = {
  student: "Students",
  teacher: "Teachers",
  senior_teacher: "Senior Teachers",
} as const;

type RoleKey = keyof typeof roleLabels;

type CredentialRow = {
  id: string;
  name: string;
  email: string;
  password?: string;
  mobileNumber?: string;
  role: "student" | "teacher" | "senior_teacher";
  accountStatus: "Active" | "Inactive";
  institutionName: string;
  createdAt: string;
};

const roleOptions: Array<"student" | "teacher" | "senior_teacher"> = [
  "student",
  "teacher",
  "senior_teacher",
];

export default function SuperAdminCredentialsPage() {
  const [activeRole, setActiveRole] = useState<RoleKey>("student");
  const [rows, setRows] = useState<CredentialRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  const fetchCredentials = async (role: RoleKey, searchTerm = "") => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("role", role);
      if (searchTerm) params.set("search", searchTerm);
      const response = await fetch(`/api/super-admin/credentials?${params.toString()}`, {
        credentials: "include",
        headers: {
          ...adminSessionAuthHeaders(),
        },
      });
      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error((errorBody as { error?: string }).error || "Unable to load credentials");
      }
      const data = await response.json();
      const rows = (data.credentials ?? []).map((item: {
        id: string;
        name: string;
        email: string;
        password?: string;
        mobileNumber?: string;
        role: "student" | "teacher" | "senior_teacher";
        accountStatus: "Active" | "Inactive";
        institutionName: string;
        createdAt: string;
      }) => ({
        ...item,
        createdAt: new Date(item.createdAt).toLocaleDateString(),
      }));
      setRows(rows);
    } catch (error) {
      console.error("Error fetching credentials:", error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCredentials(activeRole, search);
  }, [activeRole, search]);

  const filteredRows = useMemo(() => {
    if (!search) return rows;
    return rows.filter((row) => {
      const query = search.toLowerCase();
      return [row.name, row.email, row.mobileNumber ?? "", row.institutionName, row.role]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [rows, search]);

  const columns = [
    { key: "name", header: "Name" },
    { key: "email", header: "Email" },
    {
      key: "password",
      header: "Password",
      render: (row: CredentialRow) => {
        const visible = visiblePasswords[row.id];
        const display = row.password ? (visible ? row.password : "••••••••") : "Not stored";
        return (
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm truncate max-w-[180px]">{display}</span>
            {row.password && (
              <button
                type="button"
                aria-label={visible ? "Hide password" : "Show password"}
                className="p-1 rounded hover:bg-muted"
                onClick={() => setVisiblePasswords((prev) => ({ ...prev, [row.id]: !prev[row.id] }))}
              >
                {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            )}
          </div>
        );
      },
    },
    { key: "mobileNumber", header: "Mobile" },
    { key: "role", header: "Role" },
    {
      key: "institutionName",
      header: "Institution",
      render: (row: CredentialRow) => row.institutionName || "Unknown",
    },
    {
      key: "accountStatus",
      header: "Status",
      render: (row: CredentialRow) => (
        <Badge variant={row.accountStatus === "Active" ? "secondary" : "outline"}>
          {row.accountStatus}
        </Badge>
      ),
    },
    { key: "createdAt", header: "Created" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Credentials"
        subtitle="View all login credentials across all institutes with role and institution visibility"
      />

      <div className="card-soft p-4 space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Tabs value={activeRole} className="w-full">
            <TabsList className="grid grid-cols-3 gap-2 w-full">
              {roleOptions.map((role) => (
                <TabsTrigger
                  key={role}
                  value={role}
                  className="text-sm"
                  onClick={() => setActiveRole(role)}
                >
                  {roleLabels[role]}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="max-w-sm w-full">
            <Input
              placeholder="Search by name, email, mobile, institution"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="rounded-xl"
            />
          </div>
        </div>

        {/* Metrics removed per Super Admin UI spec */}
      </div>

      <div className="card-soft overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading credentials…</div>
        ) : filteredRows.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No credentials found for this filter.</div>
        ) : (
          <DataTable
            columns={columns}
            rows={filteredRows}
            searchKeys={undefined}
            pageSize={10}
            emptyMessage="No credentials available"
          />
        )}
      </div>
    </div>
  );
}
