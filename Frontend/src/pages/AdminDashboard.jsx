import React, { useEffect, useMemo, useState } from 'react';
import Navbar from '../components/Navbar';
const AdminDashboard = () => {
  const API_BASE_URL = useMemo(() => (
    import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
  ), []);

  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [responses, setResponses] = useState({});
  const [previewUrl, setPreviewUrl] = useState(null);
  const [viewed, setViewed] = useState({});
  const [stats, setStats] = useState({ total: 0, pending: 0, under_review: 0, done: 0, approved: 0, rejected: 0 });

  const getToken = () => {
    try { return localStorage.getItem('token'); } catch { return null; }
  };

  const fetchQueue = async () => {
    const token = getToken();
    if (!token) { setError("Not authenticated"); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/content/admin/queue`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to fetch queue');
      setQueue(Array.isArray(data) ? data : (data?.items || []));
    } catch (err) {
      setError(err.message || 'Failed to fetch queue');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/content/admin/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setStats(data);
    } catch { }
  };

  useEffect(() => {
    fetchQueue();
    fetchStats();
    const intervalId = setInterval(() => { fetchQueue(); fetchStats(); }, 10000);
    return () => clearInterval(intervalId);
  }, []);

  const updateResponse = (id, field, value) => {
    setResponses(prev => ({
      ...prev,
      [id]: {
        expert_response: prev[id]?.expert_response || '',
        decision: prev[id]?.decision || 'Approved',
        [field]: value
      }
    }));
  };

  const submitReview = async (itemId) => {
    const token = getToken();
    if (!token) { setError('Not authenticated'); return; }
    const body = responses[itemId] || {};
    if (!body.expert_response || !body.decision) {
      setError('Please enter expert response and decision.');
      return;
    }
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`${API_BASE_URL}/content/admin/review/${itemId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ expert_response: body.expert_response, decision: body.decision })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to submit review');
      setMessage('Review sent successfully');
      setQueue(prev => prev.filter(i => (i.id || i._id) !== itemId));
    } catch (err) {
      setError(err.message || 'Failed to submit review');
    }
  };

  const isImage = (item) => !!item?.image_path;
  const itemId = (item) => item.id || item._id;

  const StatCard = ({ title, value, change, statusColor }) => (
    <div className="bg-slate-900/70 p-5 rounded-2xl shadow-sm border border-slate-800 flex-1 min-w-[150px] md:min-w-[180px]">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-medium uppercase tracking-wide text-slate-400">{title}</h3>
      </div>
      <div>
        <div className="text-3xl font-semibold text-slate-50 mb-1">{value}</div>
        <span className={`text-xs font-medium ${statusColor}`}>{change}</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col gap-2">
          <p className="text-xs font-semibold tracking-[0.2em] text-blue-400 uppercase">Admin console</p>
          <h1 className="text-2xl md:text-3xl font-semibold text-slate-50">Admin Dashboard</h1>
          <p className="text-sm text-slate-300 max-w-xl">Review user submissions and manage moderation decisions.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 mb-8">
          <StatCard title="Total" value={stats.total} change="All submissions" statusColor="text-slate-400" />
          <StatCard title="Pending" value={stats.pending} change="Awaiting review" statusColor="text-amber-300" />
          <StatCard title="Under review" value={stats.under_review} change="In progress" statusColor="text-orange-300" />
          <StatCard title="Approved" value={stats.approved} change="Accepted" statusColor="text-emerald-300" />
          <StatCard title="Rejected" value={stats.rejected} change="Declined" statusColor="text-rose-300" />
        </div>

        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-50">Content review queue</h2>
          <button
            onClick={() => {
              fetchQueue();
              fetchStats();
            }}
            className="bg-blue-500 text-slate-950 px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-400"
          >
            Refresh
          </button>
        </div>

        {message && (
          <div className="mb-4 text-emerald-300 bg-emerald-500/10 border border-emerald-500/40 rounded-md px-4 py-2 text-sm">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-4 text-rose-300 bg-rose-500/10 border border-rose-500/40 rounded-md px-4 py-2 text-sm">
            {error}
          </div>
        )}
        {loading && <div className="mb-4 text-sm text-slate-300">Loading...</div>}

        {queue.length === 0 && !loading ? (
          <div className="text-sm text-slate-400">No pending items.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {queue.map(item => (
              <div
                key={itemId(item)}
                className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3"
              >
                <div className="text-xs text-slate-300 mb-1 font-medium">
                  {item.user_email || item.email}
                </div>
                <div className="mb-2">
                  {isImage(item) ? (
                    <div className="flex items-center justify-between bg-slate-950/60 border border-slate-700 p-3 rounded-lg">
                      <div className="text-xs text-slate-100">Image content</div>
                      <button
                        onClick={() => {
                          setPreviewUrl(`${API_BASE_URL}${item.image_path}`);
                          setViewed(prev => ({ ...prev, [itemId(item)]: true }));
                        }}
                        className="bg-blue-500 text-slate-950 px-3 py-1 rounded-md text-xs font-medium hover:bg-blue-400"
                      >
                        View
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-100 whitespace-pre-wrap break-words bg-slate-950/60 border border-slate-700 rounded-lg p-3">
                      {item.text_content}
                    </p>
                  )}
                </div>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Expert response (safe / unsafe)"
                    value={responses[itemId(item)]?.expert_response || ''}
                    onChange={(e) => updateResponse(itemId(item), 'expert_response', e.target.value)}
                    className="w-full p-2 border border-slate-700 bg-slate-950/60 text-xs text-slate-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-500"
                  />
                  <select
                    value={responses[itemId(item)]?.decision || 'Approved'}
                    onChange={(e) => updateResponse(itemId(item), 'decision', e.target.value)}
                    className="w-full p-2 border border-slate-700 bg-slate-950/60 text-xs text-slate-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                  <button
                    onClick={() => submitReview(itemId(item))}
                    className="bg-emerald-500 text-slate-950 px-4 py-2 rounded-md text-sm font-medium hover:bg-emerald-400"
                  >
                    Send response
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {previewUrl && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl max-w-4xl w-[90%]">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-slate-50 font-semibold">Preview</h3>
              <button onClick={() => setPreviewUrl(null)} className="text-slate-300 hover:text-blue-300 text-sm">
                Close
              </button>
            </div>
            <img src={previewUrl} alt="preview" className="w-full max-h-[80vh] object-contain rounded-lg border border-slate-800" />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
