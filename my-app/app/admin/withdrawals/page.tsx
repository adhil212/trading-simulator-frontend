"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, CheckCircle, XCircle } from "lucide-react";
import toast from "react-hot-toast";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function AdminWithdrawals() {
  const [requests, setRequests] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const limit = 50;

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${API}/api/admin/withdrawal-requests?limit=${limit}&offset=${offset}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
        setError(data.error);
        return;
      }
      setRequests(data.requests || []);
      setTotal(data.total || 0);
    } catch {
      toast.error("Failed to fetch withdrawal requests");
      setError("Failed to fetch withdrawal requests. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offset]);

  const handleApprove = async (id: number) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API}/api/admin/withdrawal-requests/${id}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Withdrawal approved");
        fetchRequests();
      } else {
        toast.error(data.error || "Failed to approve");
      }
    } catch {
      toast.error("Failed to approve withdrawal");
    }
  };

  const handleReject = async (id: number) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API}/api/admin/withdrawal-requests/${id}/reject`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Withdrawal rejected");
        fetchRequests();
      } else {
        toast.error(data.error || "Failed to reject");
      }
    } catch {
      toast.error("Failed to reject withdrawal");
    }
  };

  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Withdrawal Requests</h1>
        <button
          onClick={fetchRequests}
          className="px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 transition-colors text-sm"
        >
          Refresh
        </button>
      </div>

      <div className="rounded-xl border border-zinc-800 overflow-hidden bg-[#111318]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-zinc-500 border-b border-zinc-800 bg-zinc-900/50">
                <th className="text-left py-3 px-4">ID</th>
                <th className="text-left py-3 px-4">User</th>
                <th className="text-right py-3 px-4">Amount</th>
                <th className="text-left py-3 px-4">Method</th>
                <th className="text-left py-3 px-4">Destination</th>
                <th className="text-right py-3 px-4">Date</th>
                <th className="text-center py-3 px-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-zinc-500">Loading...</td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-zinc-500">
                    {error || "No pending withdrawal requests"}
                  </td>
                </tr>
              ) : (
                requests.map((req: any) => {
                  const details = req.details || {};
                  return (
                    <tr key={req.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20">
                      <td className="py-3 px-4 text-zinc-400">{req.id}</td>
                      <td className="py-3 px-4">
                        <span className="text-white">{req.username}</span>
                        <span className="text-zinc-600 text-xs ml-1">(ID: {req.user_id})</span>
                      </td>
                      <td className="py-3 px-4 text-right text-yellow-500 font-medium">
                        ₹{Number(req.amount).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 uppercase text-xs font-medium text-zinc-400">
                        {details.method || "—"}
                      </td>
                      <td className="py-3 px-4 text-zinc-300 text-xs">
                        {details.method === "upi"
                          ? details.upi_id
                          : details.method === "bank"
                          ? `${details.account_no || ""} ${details.ifsc || ""}`
                          : "—"}
                      </td>
                      <td className="py-3 px-4 text-right text-zinc-400 text-xs">
                        {new Date(req.created_at).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleApprove(req.id)}
                            className="p-1.5 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-colors"
                            title="Approve"
                          >
                            <CheckCircle size={18} />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Reject withdrawal request #${req.id} for ₹${Number(req.amount).toLocaleString()}?`)) {
                                handleReject(req.id);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                            title="Reject"
                          >
                            <XCircle size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-500">
            Showing {offset + 1}-{Math.min(offset + limit, total)} of {total}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setOffset(Math.max(0, offset - limit))}
              disabled={offset === 0}
              className="p-2 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-zinc-400">Page {currentPage} of {totalPages}</span>
            <button
              onClick={() => setOffset(offset + limit)}
              disabled={offset + limit >= total}
              className="p-2 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
