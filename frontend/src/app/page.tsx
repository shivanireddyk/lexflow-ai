"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import api from "@/services/api";

import {
  LayoutDashboard,
  Users,
  FileText,
  BarChart3,
  Plus,
  Trash2,
  LogOut,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from "recharts";

interface AuditLog {
  id: number;
  action: string;
  entity: string;
  user: string;
  timestamp: string;
}

interface Lead {
  id: number;
  full_name: string;
  email: string;
  status: string;
  urgency: number;
  last_contacted?: string;
}
interface Matter {
  id: number;
  client_name: string;
  case_type: string;
  assigned_attorney: string;
  status: string;
  priority: string;
}

export default function Home() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
const [matters, setMatters] = useState<Matter[]>([]);
const [auditLogs, setAuditLogs] =
  useState<AuditLog[]>([]);
const [summary, setSummary] = useState("");

const [dossier, setDossier] = useState<any>(null);

const [uploading, setUploading] =
  useState(false);
const [role, setRole] =
  useState("");

  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    email: "",
    status: "New",
    urgency: 1,
  });
useEffect(() => {

  const token =
    localStorage.getItem("token");

  if (!token) {
    router.push("/login");
    return;
  }

  try {

    const decoded: any =
      jwtDecode(token);

    setRole(decoded.role);

  } catch (error) {

    console.error(
      "Invalid token",
      error
    );

    router.push("/login");

    return;
  }

  fetchLeads();
  fetchMatters();
  fetchAuditLogs();

}, []);

  const fetchLeads = async () => {
    try {
      const response = await api.get("/leads");
      setLeads(response.data);
    } catch (error) {
      console.error("Error fetching leads:", error);
    }
  };

const fetchAuditLogs = async () => {
  try {

    const response =
      await api.get("/audit-logs");

    setAuditLogs(response.data);

  } catch (error) {

    console.error(
      "Error fetching audit logs:",
      error
    );
  }
};

const fetchMatters = async () => {
  try {
    const response = await api.get("/matters");
    setMatters(response.data);

  } catch (error) {
    console.error("Error fetching matters:", error);
  }
};

  const createLead = async () => {
    try {
      await api.post("/leads", formData);

      setFormData({
        full_name: "",
        phone: "",
        email: "",
        status: "New",
        urgency: 1,
      });

      fetchLeads();

    } catch (error) {
      console.error("Error creating lead:", error);
    }
  };

  const updateLeadStatus = async (
    leadId: number,
    status: string
  ) => {
    try {
      await api.patch(`/leads/${leadId}`, {
        status,
      });

      fetchLeads();

    } catch (error) {
      console.error("Error updating lead:", error);
    }
  };

  const deleteLead = async (leadId: number) => {
    try {
      await api.delete(`/leads/${leadId}`);

      fetchLeads();

    } catch (error) {
      console.error("Error deleting lead:", error);
    }
  };
const convertToMatter = async (lead: Lead) => {
  try {

    await api.post("/matters", {
      client_name: lead.full_name,
      case_type: "General Consultation",
      assigned_attorney: "Sarah Chen",
      status: "Active",
      priority:
        lead.urgency >= 4
          ? "High"
          : lead.urgency >= 3
          ? "Medium"
          : "Low",
    });

    fetchMatters();

  } catch (error) {
    console.error("Error converting lead:", error);
  }
};
const logout = () => {

  localStorage.removeItem("token");

  router.push("/login");
};
const uploadDocument = async (
  file: File
) => {
  try {

    setUploading(true);

    const formData = new FormData();

    formData.append("file", file);

    const response = await api.post(
      "/summarize-document",
      formData,
      {
        headers: {
          "Content-Type":
            "multipart/form-data",
        },
      }
    );

    setSummary(response.data.summary);
setDossier(response.data.dossier);

    setUploading(false);

  } catch (error) {

    console.error(
      "Upload failed:",
      error
    );

    setUploading(false);
  }
};

  // Queue Logic
  const highPriorityLeads = leads.filter(
    (lead) => lead.urgency >= 4
  );

  const signedClients = leads.filter(
    (lead) => lead.status === "Signed"
  );

  const coldLeads = leads.filter(
    (lead) =>
      lead.status !== "Signed" &&
      lead.urgency <= 2
  );

  // Analytics Data
  const statusData = [
    {
      name: "New",
      value: leads.filter((l) => l.status === "New").length,
    },
    {
      name: "Follow-Up",
      value: leads.filter((l) => l.status === "Follow-Up").length,
    },
    {
      name: "Signed",
      value: leads.filter((l) => l.status === "Signed").length,
    },
    {
      name: "Cold Lead",
      value: leads.filter((l) => l.status === "Cold Lead").length,
    },
  ];

  const urgencyData = [
    {
      level: "1",
      leads: leads.filter((l) => l.urgency === 1).length,
    },
    {
      level: "2",
      leads: leads.filter((l) => l.urgency === 2).length,
    },
    {
      level: "3",
      leads: leads.filter((l) => l.urgency === 3).length,
    },
    {
      level: "4",
      leads: leads.filter((l) => l.urgency === 4).length,
    },
    {
      level: "5",
      leads: leads.filter((l) => l.urgency === 5).length,
    },
  ];

  // KPI Cards
  const stats = [
    {
      title: "High Priority Leads",
      value: highPriorityLeads.length,
    },
    {
      title: "Total Leads",
      value: leads.length,
    },
    {
      title: "Signed Clients",
      value: signedClients.length,
    },
    {
      title: "Cold Leads",
      value: coldLeads.length,
    },
  ];

  return (
    <main className="min-h-screen bg-slate-950 text-white flex">

      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 p-6">

       <div className="flex items-center justify-between mb-10">

  <h1 className="text-2xl font-bold">
    LexFlow AI
  </h1>

  <button
    onClick={logout}
    className="text-slate-400 hover:text-white"
  >
    <LogOut size={20} />
  </button>

</div>

        <nav className="space-y-4">

          <div className="flex items-center gap-3 text-white">
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </div>

          <div className="flex items-center gap-3 text-slate-400 hover:text-white cursor-pointer">
            <Users size={20} />
            <span>Leads</span>
          </div>

          <div className="flex items-center gap-3 text-slate-400 hover:text-white cursor-pointer">
            <FileText size={20} />
            <span>Matters</span>
          </div>

          <div className="flex items-center gap-3 text-slate-400 hover:text-white cursor-pointer">
            <BarChart3 size={20} />
            <span>Analytics</span>
          </div>

        </nav>

      </aside>

      {/* Main Content */}
      <section className="flex-1 p-8">

        {/* Header */}
        <div className="flex justify-between items-center mb-10">

          <div>
            <h2 className="text-3xl font-bold">
              Legal Operations Dashboard
            </h2>

            <p className="text-slate-400 mt-2">
              AI-powered legal intake and workflow management.
            </p>
          </div>
<div className="mt-3 inline-block bg-blue-500/20 text-blue-400 px-4 py-1 rounded-full text-sm">

  {role.toUpperCase()}

</div>

          {/* Add Lead */}
          <Dialog>

            <DialogTrigger asChild>
              <Button className="bg-white text-black hover:bg-slate-200">
                <Plus className="mr-2 h-4 w-4" />
                Add Lead
              </Button>
            </DialogTrigger>

            <DialogContent className="bg-slate-900 border border-slate-800 text-white">

              <DialogHeader>
                <DialogTitle>
                  Create New Lead
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 mt-4">

                <Input
                  placeholder="Full Name"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      full_name: e.target.value,
                    })
                  }
                />

                <Input
                  placeholder="Phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      phone: e.target.value,
                    })
                  }
                />

                <Input
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      email: e.target.value,
                    })
                  }
                />

                <Input
                  type="number"
                  placeholder="Urgency (1-5)"
                  value={formData.urgency}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      urgency: Number(e.target.value),
                    })
                  }
                />

                <Button
                  onClick={createLead}
                  className="w-full"
                >
                  Create Lead
                </Button>

              </div>

            </DialogContent>

          </Dialog>

        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

          {stats.map((stat) => (
            <div
              key={stat.title}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6"
            >
              <p className="text-slate-400 text-sm">
                {stat.title}
              </p>

              <h3 className="text-3xl font-bold mt-3">
                {stat.value}
              </h3>
            </div>
          ))}

        </div>

        {/* Analytics */}
{role !== "intake" && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-10">

          {/* Pie Chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">

            <h3 className="text-xl font-semibold mb-6">
              Lead Status Distribution
            </h3>

            <div className="h-80">

              <ResponsiveContainer width="100%" height="100%">

                <PieChart>

                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={100}
                  >

                    {statusData.map((_, index) => (
                      <Cell
                        key={index}
                        fill={[
                          "#3b82f6",
                          "#eab308",
                          "#22c55e",
                          "#ef4444",
                        ][index % 4]}
                      />
                    ))}

                  </Pie>

                  <Tooltip />

                </PieChart>

              </ResponsiveContainer>

            </div>

          </div>

          {/* Bar Chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">

            <h3 className="text-xl font-semibold mb-6">
              Urgency Distribution
            </h3>

            <div className="h-80">

              <ResponsiveContainer width="100%" height="100%">

                <BarChart data={urgencyData}>

                  <XAxis dataKey="level" />
                  <YAxis />
                  <Tooltip />

                  <Bar
                    dataKey="leads"
                    fill="#3b82f6"
                    radius={[6, 6, 0, 0]}
                  />

                </BarChart>

              </ResponsiveContainer>

            </div>

          </div>

        </div> )}

{/* Matters Section */}

{role !== "intake" && (
<div className="mt-10 bg-slate-900 border border-slate-800 rounded-2xl p-6">

  <div className="flex justify-between items-center mb-6">

    <h3 className="text-xl font-semibold">
      Active Legal Matters
    </h3>

    <div className="text-sm text-slate-400">
      {matters.length} Active Cases
    </div>

  </div>

  <table className="w-full">

    <thead>
      <tr className="text-left text-slate-400 border-b border-slate-800">
        <th className="pb-3">Client</th>
        <th className="pb-3">Case Type</th>
        <th className="pb-3">Attorney</th>
        <th className="pb-3">Status</th>
        <th className="pb-3">Priority</th>
      </tr>
    </thead>

    <tbody>

      {matters.map((matter) => (
        <tr
          key={matter.id}
          className="border-b border-slate-800"
        >

          <td className="py-4">
            {matter.client_name}
          </td>

          <td className="py-4">
            {matter.case_type}
          </td>

          <td className="py-4">
            {matter.assigned_attorney}
          </td>

          <td className="py-4 text-green-400">
            {matter.status}
          </td>

          <td className="py-4">

            <span
              className={`px-3 py-1 rounded-full text-sm ${
                matter.priority === "High"
                  ? "bg-red-500/20 text-red-400"
                  : matter.priority === "Medium"
                  ? "bg-yellow-500/20 text-yellow-400"
                  : "bg-green-500/20 text-green-400"
              }`}
            >
              {matter.priority}
            </span>

          </td>

        </tr>
      ))}

    </tbody>

  </table>

</div> )}
{/* AI Document Intelligence */}
<div className="mt-10 bg-slate-900 border border-slate-800 rounded-2xl p-6">

  <div className="flex justify-between items-center mb-6">

    <div>

      <h3 className="text-xl font-semibold">
        AI Legal Document Intelligence
      </h3>

      <p className="text-slate-400 text-sm mt-1">
        Upload contracts, intake forms, and legal PDFs for AI analysis.
      </p>

    </div>

  </div>

  {/* Upload Area */}
  <div className="border-2 border-dashed border-slate-700 rounded-2xl p-10 text-center">

    <input
      type="file"
      accept=".pdf"
      onChange={(e) => {
        if (e.target.files?.[0]) {
          uploadDocument(
            e.target.files[0]
          );
        }
      }}
      className="mb-4"
    />

    <p className="text-slate-400">
      Upload PDF documents for OCR extraction and AI summarization
    </p>

  </div>

  {/* Loading */}
  {uploading && (
    <div className="mt-6 text-blue-400">
      Processing document with AI...
    </div>
  )}

  {/* Summary */}
  {summary && (
    <div className="mt-6 bg-slate-800 rounded-2xl p-6">

      <h4 className="text-lg font-semibold mb-4">
        AI Generated Summary
      </h4>

      <p className="text-slate-300 leading-7 whitespace-pre-wrap">
        {summary}
      </p>

    </div>
  )}
{/* Attorney Dossier */}
{dossier && (
  <div className="mt-6 bg-slate-800 rounded-2xl p-6">

    <h4 className="text-xl font-semibold mb-6">
      Attorney Dossier
    </h4>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

      <div>

        <p className="text-slate-400 text-sm">
          Case Type
        </p>

        <p className="text-lg font-medium mt-1">
          {dossier.case_type}
        </p>

      </div>

      <div>

        <p className="text-slate-400 text-sm">
          Urgency
        </p>

        <p
          className={`text-lg font-medium mt-1 ${
            dossier.urgency === "High"
              ? "text-red-400"
              : dossier.urgency === "Medium"
              ? "text-yellow-400"
              : "text-green-400"
          }`}
        >
          {dossier.urgency}
        </p>

      </div>

      <div className="md:col-span-2">

        <p className="text-slate-400 text-sm">
          Recommended Action
        </p>

        <p className="mt-1">
          {dossier.recommended_action}
        </p>

      </div>

      <div className="md:col-span-2">

        <p className="text-slate-400 text-sm mb-3">
          Missing Documentation
        </p>

        <ul className="space-y-2">

          {dossier.missing_documents.map(
            (doc: string, index: number) => (
              <li
                key={index}
                className="bg-slate-700 rounded-lg px-4 py-2"
              >
                {doc}
              </li>
            )
          )}

        </ul>

      </div>

    </div>

  </div>
)}

</div>
{/* Activity Feed */}
<div className="mt-10 bg-slate-900 border border-slate-800 rounded-2xl p-6">

  <div className="flex justify-between items-center mb-6">

    <h3 className="text-xl font-semibold">
      Activity Audit Logs
    </h3>

    <div className="text-sm text-slate-400">
      Compliance Tracking
    </div>

  </div>

  <div className="space-y-4">

    {auditLogs.map((log) => (
      <div
        key={log.id}
        className="bg-slate-800 rounded-xl p-4 flex justify-between items-center"
      >

        <div>

          <p className="font-medium">
            {log.action}
          </p>

          <p className="text-sm text-slate-400 mt-1">
            {log.entity}
          </p>

        </div>

        <div className="text-right">

          <p className="text-sm text-slate-400">
            {log.user}
          </p>

          <p className="text-xs text-slate-500 mt-1">
            {log.timestamp}
          </p>

        </div>

      </div>
    ))}

  </div>

</div>
        {/* Leads Table */}
        <div className="mt-10 bg-slate-900 border border-slate-800 rounded-2xl p-6">

          <h3 className="text-xl font-semibold mb-6">
            Lead Pipeline
          </h3>

          <table className="w-full">

            <thead>
              <tr className="text-left text-slate-400 border-b border-slate-800">
                <th className="pb-3">Client</th>
                <th className="pb-3">Email</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Urgency</th>
                <th className="pb-3">Actions</th>
                <th className="pb-3">Convert</th>
              </tr>
            </thead>

            <tbody>

              {leads.map((lead) => (
                <tr
                  key={lead.id}
                  className="border-b border-slate-800"
                >

                  <td className="py-4">
                    {lead.full_name}
                  </td>

                  <td className="py-4">
                    {lead.email}
                  </td>

                  <td className="py-4">

                    <select
                      value={lead.status}
                      onChange={(e) =>
                        updateLeadStatus(
                          lead.id,
                          e.target.value
                        )
                      }
                      className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm"
                    >

                      <option value="New">
                        New
                      </option>

                      <option value="Follow-Up">
                        Follow-Up
                      </option>

                      <option value="Signed">
                        Signed
                      </option>

                      <option value="Cold Lead">
                        Cold Lead
                      </option>

                    </select>

                  </td>

                  <td className="py-4">
                    {lead.urgency}
                  </td>

                  <td className="py-4">

                    <button
                      onClick={() => deleteLead(lead.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 size={18} />
                    </button>
                    <button
  onClick={() => convertToMatter(lead)}
  className="ml-4 bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-lg text-sm"
>
  Convert
</button>
                  </td>

                </tr>
              ))}

            </tbody>

          </table>

        </div>

      </section>

    </main>
  );
}