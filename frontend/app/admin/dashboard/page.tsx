'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ThemeToggle } from '../../../components/ThemeToggle';
import { supabase } from '../../../lib/supabase';
import { fetchContent, fetchUsers, updateUserStatus, fetchAdminFeedback, fetchFeedbackStats, fetchAdminAnalytics } from '../../../lib/api';
import type { GeneratedContent } from '../../../types';

interface User {
  id: string;
  name: string;
  email: string;
  created_at: string;
  status: 'active' | 'blocked';
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);

  // Views: 'overview', 'users', 'content'
  const [view, setView] = useState('overview');

  const [users, setUsers] = useState<User[]>([]);

  const [feedbackList, setFeedbackList] = useState<any[]>([]);
  const [feedbackStats, setFeedbackStats] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('admin_token');
    if (!stored) {
      router.replace('/admin/login');
    } else {
      setToken(stored);
    }
  }, [router]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
    localStorage.removeItem('admin_token');
    router.replace('/admin/login');
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await fetchUsers();
      setUsers(data as any);
    } catch (err: any) {
      console.error(err);
      setError('Failed to load users: ' + (err?.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const loadFeedback = async () => {
    setLoading(true);
    try {
      const [list, stats] = await Promise.all([fetchAdminFeedback(), fetchFeedbackStats()]);
      setFeedbackList(list);
      setFeedbackStats(stats);
    } catch (err: any) {
      console.error(err);
      setError('Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const data = await fetchAdminAnalytics();
      setAnalytics(data);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleBlockUser = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'blocked' : 'active';
    if (!confirm(`Are you sure you want to ${newStatus} this user?`)) return;
    try {
      await updateUserStatus(userId, newStatus);
      setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus } : u));
    } catch (err) {
      alert('Action failed');
    }
  };

  useEffect(() => {
    if (view === 'users' || view === 'overview') loadUsers();
    if (view === 'overview') loadAnalytics();
    if (view === 'feedback' || view === 'overview') loadFeedback();
  }, [view]);

  return (
    <div className="bg-background-light dark:bg-background-dark text-text-main-light dark:text-text-main-dark font-display antialiased fixed inset-0 flex overflow-hidden selection:bg-primary selection:text-white">
      {/* Sidebar Navigation */}
      <aside className="w-72 bg-surface-light dark:bg-surface-dark border-r border-border-light dark:border-border-dark flex flex-col z-20 transition-colors duration-300">
        <div className="p-6 flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
            <span className="material-symbols-outlined text-white" style={{ fontSize: '24px' }}>auto_stories</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold leading-tight">MagineAI</h1>
            <p className="text-text-sec-light dark:text-text-sec-dark text-xs font-medium">Admin Console</p>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto px-4 py-2 flex flex-col gap-2">
          <button onClick={() => setView('overview')} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group w-full text-left ${view === 'overview' ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-white' : 'text-text-sec-light dark:text-text-sec-dark hover:bg-background-light dark:hover:bg-background-dark hover:text-primary dark:hover:text-white'}`}>
            <span className="material-symbols-outlined filled" style={{ fontVariationSettings: "'FILL' 1" }}>dashboard</span>
            <span className="text-sm font-semibold">Overview</span>
          </button>
          <button onClick={() => setView('users')} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group w-full text-left ${view === 'users' ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-white' : 'text-text-sec-light dark:text-text-sec-dark hover:bg-background-light dark:hover:bg-background-dark hover:text-primary dark:hover:text-white'}`}>
            <span className="material-symbols-outlined">group</span>
            <span className="text-sm font-medium">User Management</span>
          </button>

          <button onClick={() => setView('feedback')} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group w-full text-left ${view === 'feedback' ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-white' : 'text-text-sec-light dark:text-text-sec-dark hover:bg-background-light dark:hover:bg-background-dark hover:text-primary dark:hover:text-white'}`}>
            <span className="material-symbols-outlined">reviews</span>
            <span className="text-sm font-medium">Feedback</span>
          </button>
          <ThemeToggle showLabel={true} className="w-full justify-start px-4 py-3 rounded-xl text-text-sec-light dark:text-text-sec-dark hover:bg-background-light dark:hover:bg-background-dark hover:text-primary dark:hover:text-white transition-all group" />
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-xl text-text-sec-light dark:text-text-sec-dark hover:bg-red-500/10 hover:text-red-600 transition-all group w-full text-left mt-auto">
            <span className="material-symbols-outlined">logout</span>
            <span className="text-sm font-medium">Logout</span>
          </button>
        </nav>
        <div className="p-4 border-t border-border-light dark:border-border-dark">
          <div className="flex items-center gap-3 px-4 py-2">
            <div className="relative">
              <div className="size-10 rounded-full bg-cover bg-center border-2 border-white dark:border-surface-dark shadow-sm" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBOH8309y-jeoj3NEggtVu0YHiaBNeCm9tpWhVOV8dQeh8q_DnS8G24tc5VPyUPVsS0vjX3EglcKNbVhEz93-J3eaf0-l13wcb3in5mya1EAWscND4o0MVd4qB01dTaTjvoUtJUTGlJyzg4oHjBItd3I9rGtQoNAQPQV_ysNHA1w_fDJ2-pm1CX5uiGjgGb4FNw1zTuvw62vNijoPL8cu6cC12tj83epg6PrVGJ9mykJm4LFG4Gc9GrF3lR3ngAymo5iJhiEjhnEqgQ')" }}></div>
              <div className="absolute bottom-0 right-0 size-3 bg-green-500 border-2 border-white dark:border-surface-dark rounded-full"></div>
            </div>
            <div className="flex flex-col">
              <p className="text-sm font-bold">Admin User</p>
              <p className="text-xs text-text-sec-light dark:text-text-sec-dark">Super Admin</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-background-light dark:bg-background-dark">
        {/* Top Navigation Bar */}
        <header className="h-20 bg-surface-light dark:bg-surface-dark border-b border-border-light dark:border-border-dark px-8 flex items-center justify-between shrink-0 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold tracking-tight">Dashboard Overview</h2>
          </div>
          {/* Streamlined Header (No Search/Notifications) */}
          <div className="flex items-center gap-6">
            <p className="text-sm text-text-sec-light dark:text-text-sec-dark font-medium">{mounted ? new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : ''}</p>
          </div>
        </header>
        {/* Scrollable Dashboard Content */}
        <div className="flex-1 overflow-y-auto p-8 scroll-smooth">
          <div className="max-w-7xl mx-auto flex flex-col gap-8">
            {view === 'users' ? (
              <div className="bg-surface-light dark:bg-surface-dark rounded-2xl border border-border-light dark:border-border-dark shadow-sm overflow-hidden p-6">
                <h3 className="text-lg font-bold mb-4">User Management</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-border-light dark:border-border-dark">
                        <th className="pb-3 text-sm font-bold opacity-70">User</th>
                        <th className="pb-3 text-sm font-bold opacity-70">Email</th>
                        <th className="pb-3 text-sm font-bold opacity-70">Joined</th>
                        <th className="pb-3 text-sm font-bold opacity-70">Status</th>
                        <th className="pb-3 text-sm font-bold opacity-70 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u.id} className="border-b border-border-light dark:border-border-dark last:border-0 hover:bg-background-light dark:hover:bg-background-dark/50">
                          <td className="py-4 text-sm font-medium">{u.name}</td>
                          <td className="py-4 text-sm">{u.email}</td>
                          <td className="py-4 text-sm opacity-70">{mounted ? new Date(u.created_at).toLocaleDateString() : '...'}</td>
                          <td className="py-4 text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${u.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {u.status}
                            </span>
                          </td>
                          <td className="py-4 text-right">
                            <button
                              onClick={() => handleBlockUser(u.id, u.status)}
                              className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors ${u.status === 'active' ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-green-200 text-green-600 hover:bg-green-50'}`}
                            >
                              {u.status === 'active' ? 'Block' : 'Unblock'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            ) : view === 'feedback' ? (
              <div className="flex flex-col gap-6">
                {/* Feedback Stats */}
                {feedbackStats && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-2xl border border-border-light dark:border-border-dark shadow-sm">
                      <p className="text-sm font-medium text-text-sec-light dark:text-text-sec-dark">Average Rating</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-3xl font-bold">{feedbackStats.averageRating}</span>
                        <span className="text-yellow-400 material-symbols-outlined filled text-2xl">star</span>
                      </div>
                    </div>
                    <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-2xl border border-border-light dark:border-border-dark shadow-sm">
                      <p className="text-sm font-medium text-text-sec-light dark:text-text-sec-dark">Total Reviews</p>
                      <h4 className="text-3xl font-bold mt-2">{feedbackStats.totalFeedback}</h4>
                    </div>
                    <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-2xl border border-border-light dark:border-border-dark shadow-sm">
                      <p className="text-sm font-medium text-text-sec-light dark:text-text-sec-dark">Lowest Rated</p>
                      {feedbackStats.lowestRated ? (
                        <div className="mt-2">
                          <p className="font-bold line-clamp-1" title={feedbackStats.lowestRated.title}>{feedbackStats.lowestRated.title}</p>
                          <p className="text-sm text-red-500 font-bold">{feedbackStats.lowestRated.rating.toFixed(1)} / 5.0</p>
                        </div>
                      ) : (
                        <p className="mt-2 text-sm opacity-50">N/A</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="bg-surface-light dark:bg-surface-dark rounded-2xl border border-border-light dark:border-border-dark shadow-sm overflow-hidden p-6">
                  <h3 className="text-lg font-bold mb-4">User Feedback</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-border-light dark:border-border-dark">
                          <th className="pb-3 text-sm font-bold opacity-70">Magazine</th>
                          <th className="pb-3 text-sm font-bold opacity-70">User</th>
                          <th className="pb-3 text-sm font-bold opacity-70">Rating</th>
                          <th className="pb-3 text-sm font-bold opacity-70">Comment</th>
                          <th className="pb-3 text-sm font-bold opacity-70 text-right">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {feedbackList.map((f: any) => (
                          <tr key={f.id} className="border-b border-border-light dark:border-border-dark last:border-0 hover:bg-background-light dark:hover:bg-background-dark/50">
                            <td className="py-4 text-sm font-medium max-w-[200px] truncate" title={f.generated_content?.title}>{f.generated_content?.title || 'Unknown'}</td>
                            <td className="py-4 text-sm">{f.users?.name || 'Unknown'}</td>
                            <td className="py-4 text-sm">
                              <div className="flex items-center gap-1">
                                <span className="font-bold">{f.rating}</span>
                                <span className="material-symbols-outlined text-sm text-yellow-500 filled">star</span>
                              </div>
                            </td>
                            <td className="py-4 text-sm opacity-80 max-w-[300px] truncate" title={f.comment}>{f.comment || '-'}</td>
                            <td className="py-4 text-sm text-right opacity-70">{new Date(f.created_at).toLocaleDateString()}</td>
                          </tr>
                        ))}
                        {feedbackList.length === 0 && (
                          <tr><td colSpan={5} className="py-8 text-center opacity-50">No feedback yet.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              // Overview Mode
              <div className="flex flex-col gap-8">
                {error && <div className="p-4 bg-red-100 text-red-700 rounded-xl border border-red-200">{error}</div>}
                {/* Stat Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-2xl border border-border-light dark:border-border-dark shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="size-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                        <span className="material-symbols-outlined text-2xl">group</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text-sec-light dark:text-text-sec-dark">Total Users</p>
                        <h4 className="text-2xl font-bold">{users.length}</h4>
                      </div>
                    </div>
                  </div>
                  <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-2xl border border-border-light dark:border-border-dark shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="size-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                        <span className="material-symbols-outlined text-2xl">library_books</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text-sec-light dark:text-text-sec-dark">Total Magazines</p>
                        <h4 className="text-2xl font-bold">{analytics?.totalGenerations || 0}</h4>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Advanced Analytics */}
                {analytics && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                    <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-2xl border border-border-light dark:border-border-dark shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="size-12 rounded-xl bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                          <span className="material-symbols-outlined text-2xl">database</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-text-sec-light dark:text-text-sec-dark">Cache Hit Rate</p>
                          <h4 className="text-2xl font-bold">{analytics.cacheHitRate?.toFixed(1) || 0}%</h4>
                          <p className="text-xs text-text-sec-light dark:text-text-sec-dark mt-1">{analytics.cacheHits} / {analytics.totalGenerations} generations</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-2xl border border-border-light dark:border-border-dark shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="size-12 rounded-xl bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 flex items-center justify-center">
                          <span className="material-symbols-outlined text-2xl">payments</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-text-sec-light dark:text-text-sec-dark">Tokens Used Today</p>
                          <h4 className="text-2xl font-bold">{analytics.totalTokensToday?.toLocaleString() || 0}</h4>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recent Feedback */}
                <div className="bg-surface-light dark:bg-surface-dark rounded-2xl border border-border-light dark:border-border-dark shadow-sm overflow-hidden p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold">Recent Feedback</h3>
                    <button onClick={() => setView('feedback')} className="text-primary font-bold text-sm">View All</button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-border-light dark:border-border-dark">
                          <th className="pb-3 text-sm font-bold opacity-70">Magazine</th>
                          <th className="pb-3 text-sm font-bold opacity-70">User</th>
                          <th className="pb-3 text-sm font-bold opacity-70">Rating</th>
                          <th className="pb-3 text-sm font-bold opacity-70">Comment</th>
                        </tr>
                      </thead>
                      <tbody>
                        {feedbackList.slice(0, 5).map((f: any) => (
                          <tr key={f.id} className="border-b border-border-light dark:border-border-dark last:border-0 hover:bg-background-light dark:hover:bg-background-dark/50">
                            <td className="py-4 text-sm font-medium max-w-[200px] truncate" title={f.generated_content?.title}>{f.generated_content?.title || 'Unknown'}</td>
                            <td className="py-4 text-sm">{f.users?.name || 'Unknown'}</td>
                            <td className="py-4 text-sm">
                              <div className="flex items-center gap-1">
                                <span className="font-bold">{f.rating}</span>
                                <span className="material-symbols-outlined text-sm text-yellow-500 filled">star</span>
                              </div>
                            </td>
                            <td className="py-4 text-sm opacity-80 max-w-[300px] truncate" title={f.comment}>{f.comment || '-'}</td>
                          </tr>
                        ))}
                        {feedbackList.length === 0 && (
                          <tr><td colSpan={4} className="py-8 text-center opacity-50">No feedback yet.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Footer (Simple) */}
            <footer className="mt-4 text-center pb-6">
              <p className="text-xs text-text-sec-light dark:text-text-sec-dark">© 2023 MagineAI Inc. Dashboard v2.4.1</p>
            </footer>
          </div>
        </div>
      </main>
    </div>
  );
}
