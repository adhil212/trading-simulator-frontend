"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, X, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const ASSET_TYPES = ["forex", "commodity", "crypto", "index"] as const;

const emptyForm = {
  symbol: "",
  name: "",
  type: "forex" as string,
  basePrice: "",
  volatility: "",
  trend: "0",
  maxTrend: "",
  minTrend: "",
  spread: "",
  trending: "false",
  trendStrength: "0.5",
};

export default function AdminAssets() {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingSymbol, setEditingSymbol] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [submitting, setSubmitting] = useState(false);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/api/admin/assets?includeInactive=true`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
        setError(data.error);
        return;
      }
      setAssets(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to fetch assets");
      setError("Failed to fetch assets. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAssets();
  }, []);

  const openAdd = () => {
    setEditingSymbol(null);
    setForm({ ...emptyForm });
    setShowModal(true);
  };

  const openEdit = (asset: any) => {
    setEditingSymbol(asset.symbol);
    setForm({
      symbol: asset.symbol,
      name: asset.name,
      type: asset.type,
      basePrice: String(asset.base_price),
      volatility: String(asset.volatility),
      trend: String(asset.trend ?? 0),
      maxTrend: String(asset.max_trend),
      minTrend: String(asset.min_trend),
      spread: String(asset.spread),
      trending: String(asset.trending),
      trendStrength: String(asset.trend_strength ?? 0.5),
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const payload = {
      symbol: form.symbol,
      name: form.name,
      type: form.type,
      basePrice: parseFloat(form.basePrice),
      volatility: parseFloat(form.volatility),
      trend: parseFloat(form.trend) || 0,
      maxTrend: parseFloat(form.maxTrend),
      minTrend: parseFloat(form.minTrend),
      spread: parseFloat(form.spread),
      trending: form.trending === "true",
      trendStrength: parseFloat(form.trendStrength || "0.5"),
    };

    try {
      setSubmitting(true);
      const url = editingSymbol
        ? `${API}/api/admin/assets/${editingSymbol}`
        : `${API}/api/admin/assets`;
      const method = editingSymbol ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
        return;
      }
      toast.success(editingSymbol ? "Asset updated" : "Asset created");
      setShowModal(false);
      await fetchAssets();
    } catch {
      toast.error("Failed to save asset");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (symbol: string) => {
    if (!confirm(`Permanently delete asset "${symbol}"? This cannot be undone.`)) return;
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API}/api/admin/assets/${symbol}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
        return;
      }
      toast.success("Asset deleted permanently");
      await fetchAssets();
    } catch {
      toast.error("Failed to delete asset");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Asset Management</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchAssets}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 transition-colors text-sm"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-500 transition-colors text-sm"
          >
            <Plus size={16} />
            Add Asset
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 overflow-hidden bg-[#111318]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-zinc-500 border-b border-zinc-800 bg-zinc-900/50">
                <th className="text-left py-3 px-4">Symbol</th>
                <th className="text-left py-3 px-4">Name</th>
                <th className="text-left py-3 px-4">Type</th>
                <th className="text-right py-3 px-4">Base Price</th>
                <th className="text-right py-3 px-4">Volatility</th>
                <th className="text-right py-3 px-4">Spread</th>
                <th className="text-center py-3 px-4">Trending</th>
                <th className="text-right py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-zinc-500">
                    Loading...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-red-400">
                    {error}
                  </td>
                </tr>
              ) : assets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-zinc-500">
                    No assets found. Add one to get started.
                  </td>
                </tr>
              ) : (
                assets.map((a) => (
                  <tr
                    key={a.symbol}
                    className="border-b border-zinc-800/50 hover:bg-zinc-800/20"
                  >
                    <td className="py-3 px-4 text-white font-medium">
                      {a.symbol}
                    </td>
                    <td className="py-3 px-4 text-zinc-300">{a.name}</td>
                    <td className="py-3 px-4">
                      <span className="text-xs font-medium bg-zinc-800 px-2 py-0.5 rounded-full text-zinc-300">
                        {a.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-white">
                      ₹{Number(a.base_price).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right text-zinc-400">
                      {a.volatility}
                    </td>
                    <td className="py-3 px-4 text-right text-zinc-400">
                      {a.spread}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {a.trending ? (
                        <span className="text-green-500 text-xs font-medium bg-green-500/10 px-2 py-0.5 rounded-full">
                          Yes
                        </span>
                      ) : (
                        <span className="text-zinc-600 text-xs">No</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(a)}
                          className="p-1.5 rounded-lg hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(a.symbol)}
                          className="p-1.5 rounded-lg hover:bg-zinc-700 text-zinc-400 hover:text-red-400 transition-colors"
                          title="Delete permanently"
                        >
                          <Trash2 size={15} />
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

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-[#111318] border border-zinc-800 rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">
                {editingSymbol ? "Edit Asset" : "Add New Asset"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Symbol *</label>
                  <input
                    required
                    disabled={!!editingSymbol}
                    value={form.symbol}
                    onChange={(e) => setForm({ ...form, symbol: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-green-500/50 text-sm disabled:opacity-50"
                    placeholder="BTC_USD"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Name *</label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-green-500/50 text-sm"
                    placeholder="Bitcoin"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Type *</label>
                  <select
                    required
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-200 focus:outline-none focus:border-green-500/50 text-sm"
                  >
                    {ASSET_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Base Price *</label>
                  <input
                    required
                    type="number"
                    step="any"
                    value={form.basePrice}
                    onChange={(e) => setForm({ ...form, basePrice: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-green-500/50 text-sm"
                    placeholder="45000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Volatility *</label>
                  <input
                    required
                    type="number"
                    step="any"
                    value={form.volatility}
                    onChange={(e) => setForm({ ...form, volatility: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-green-500/50 text-sm"
                    placeholder="0.005"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Spread *</label>
                  <input
                    required
                    type="number"
                    step="any"
                    value={form.spread}
                    onChange={(e) => setForm({ ...form, spread: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-green-500/50 text-sm"
                    placeholder="5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Max Trend *</label>
                  <input
                    required
                    type="number"
                    step="any"
                    value={form.maxTrend}
                    onChange={(e) => setForm({ ...form, maxTrend: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-green-500/50 text-sm"
                    placeholder="0.002"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Min Trend *</label>
                  <input
                    required
                    type="number"
                    step="any"
                    value={form.minTrend}
                    onChange={(e) => setForm({ ...form, minTrend: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-green-500/50 text-sm"
                    placeholder="-0.002"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Trend</label>
                  <input
                    type="number"
                    step="any"
                    value={form.trend}
                    onChange={(e) => setForm({ ...form, trend: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-green-500/50 text-sm"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Trend Strength</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={form.trendStrength}
                    onChange={(e) => setForm({ ...form, trendStrength: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-green-500/50 text-sm"
                    placeholder="0.5"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Trending</label>
                  <select
                    value={form.trending}
                    onChange={(e) => setForm({ ...form, trending: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-200 focus:outline-none focus:border-green-500/50 text-sm"
                  >
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-500 transition-colors text-sm disabled:opacity-50"
                >
                  {submitting ? "Saving..." : editingSymbol ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
