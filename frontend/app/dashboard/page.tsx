'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '../../components/ThemeToggle';
import { LogoLink } from '../../components/LogoLink';
import { supabase } from '../../lib/supabase';

import { getLibrary, deleteContent, fetchContent, toggleFavorite, moveToTrash, restoreContent, permanentDeleteContent, emptyTrash } from '../../lib/api';
import type { GeneratedContent, MagazineStructure } from '../../types';
import { exportMultiPageToPdf } from '../../utils/pdf';
import { MagazinePageRenderer } from '../../components/MagazinePageRenderer';
import { ensureBackendSession } from '../../lib/authGuard';

export default function DashboardPage() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState('All Items');
  const [sortBy, setSortBy] = useState('Date Created');
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [libraryItems, setLibraryItems] = useState<GeneratedContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [contentToPrint, setContentToPrint] = useState<GeneratedContent | null>(null);
  const [user, setUser] = useState<{ id: string; name: string; email: string } | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // ... (Logout/Delete handlers remain same)

  const handleDownload = async (e: React.MouseEvent, id: string, title: string) => {
    e.stopPropagation();
    if (downloadingId) return; // Prevent multiple clicks

    setDownloadingId(id);
    try {
      // 1. Fetch full content
      const fullContent = await fetchContent(id);

      // 2. Set state to render the hidden view
      setContentToPrint(fullContent);

      // The actual export is triggered by the useEffect below once contentToPrint is set
    } catch (err) {
      console.error('Download setup failed:', err);
      alert('Failed to prepare PDF. Please try again.');
      setDownloadingId(null);
      setContentToPrint(null);
    }
  };

  // Effect to trigger PDF generation once content is ready in local state
  useEffect(() => {
    if (!contentToPrint) return;

    const generatePdf = async () => {
      try {
        // Parse structure to get page count
        let structure: MagazineStructure | null = null;
        try {
          if (contentToPrint.mainStory) {
            structure = JSON.parse(contentToPrint.mainStory);
          }
        } catch (e) { console.warn("Failed to parse magazine structure for PDF", e); }

        if (structure && structure.pages) {
          // Wait for DOM to render and images to (hopefully) load
          // A 2.5s delay gives reasonable confidence for standard images
          await new Promise(resolve => setTimeout(resolve, 2500));

          const pageIds = structure.pages.map((_, i) => `dashboard-print-page-${i}`);
          const filename = `magineai-${contentToPrint.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.pdf`;

          await exportMultiPageToPdf(pageIds, filename);
        } else {
          // Fallback for legacy items (if any, though mostly structured now)
          alert("This content doesn't support the new high-quality export.");
        }

      } catch (err) {
        console.error("PDF Generation failed", err);
        alert("Failed to generate PDF file.");
      } finally {
        setDownloadingId(null);
        setContentToPrint(null);
      }
    };

    generatePdf();
  }, [contentToPrint]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
    localStorage.removeItem('user_token');
    localStorage.removeItem('admin_token');
    localStorage.removeItem('user_info');
    router.replace('/');
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await moveToTrash(id);
      // Optimistic update: mark as deleted so it falls out of standard views
      setLibraryItems(prev => prev.map(i => i.id === id ? { ...i, deleted_at: new Date().toISOString() } : i));
    } catch (err) {
      console.error('Move to trash failed:', err);
      alert('Failed to move to trash.');
    }
  };

  const handleRestore = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await restoreContent(id);
      setLibraryItems(prev => prev.map(i => i.id === id ? { ...i, deleted_at: null } : i));
    } catch (err) {
      console.error('Restore failed:', err);
    }
  };

  const handlePermanentDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Permanently delete this item? This cannot be undone.')) return;
    try {
      await permanentDeleteContent(id);
      setLibraryItems(prev => prev.filter(i => i.id !== id));
    } catch (err) {
      console.error('Permanent delete failed:', err);
    }
  };

  const handleEmptyTrash = async () => {
    if (!confirm('Permanently delete all items in trash? This cannot be undone.')) return;
    try {
      await emptyTrash();
      setLibraryItems(prev => prev.filter(i => !i.deleted_at));
    } catch (err) {
      console.error('Empty trash failed:', err);
    }
  };

  const handleToggleFavorite = async (e: React.MouseEvent, id: string, currentStatus: boolean) => {
    e.stopPropagation();
    try {
      await toggleFavorite(id, !currentStatus);
      setLibraryItems(prev => prev.map(i => i.id === id ? { ...i, is_favorite: !currentStatus } : i));
    } catch (err) {
      console.error('Toggle favorite failed:', err);
    }
  };

  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // ... (delete handlers)

  useEffect(() => {
    const checkAuth = async () => {
      const hasSession = await ensureBackendSession();

      if (!hasSession) {
        router.replace('/login');
        return;
      }

      const userInfo = localStorage.getItem('user_info');
      if (userInfo) {
        setUser(JSON.parse(userInfo));
      }

      // Token exists, proceed to load library
      setIsAuthLoading(false);
      try {
        const items = await getLibrary();
        setLibraryItems(items);
      } catch (err) {
        console.error('Failed to load library:', err);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  // Auth Guard Loading State
  if (isAuthLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="flex flex-col items-center gap-2">
          <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
          <p className="text-text-sub-light dark:text-text-sub-dark font-medium">Loading your library...</p>
        </div>
      </div>
    );
  }

  const filteredItems = libraryItems
    .filter(item => {
      // 1. Trash Filter:
      if (activeFilter === 'Trash') {
        return !!item.deleted_at;
      }
      // Standard View: Hide deleted items
      if (item.deleted_at) return false;

      // 2. Favorites Filter:
      if (activeFilter === 'Favorites') return !!item.is_favorite;

      // 3. Type Filters:
      if (activeFilter === 'All Items') return true;
      const typeMap: Record<string, string> = { 'Magazines': 'magazine', 'Books': 'book', 'Stories': 'story' };
      return item.type === typeMap[activeFilter];
    })
    .sort((a, b) => {
      if (sortBy === 'Title (A-Z)') return a.title.localeCompare(b.title);
      // Last Opened fallback to Created At for now as we don't track last_opened yet
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'book': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
      case 'story': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
      case 'magazine': return 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300';
      default: return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300';
    }
  };

  // Helper to get structure for the hidden printer
  const getPrintStructure = () => {
    if (!contentToPrint?.mainStory) return null;
    try { return JSON.parse(contentToPrint.mainStory) as MagazineStructure; }
    catch { return null; }
  };
  const printStructure = getPrintStructure();

  return (
    <div className="bg-background-light dark:bg-background-dark text-text-main-light dark:text-text-main-dark font-display antialiased fixed inset-0 flex overflow-hidden selection:bg-primary selection:text-white">
      {/* Sidebar */}
      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'flex' : 'hidden'} w-72 flex-col border-r border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark h-full shrink-0 transition-colors duration-300`}>

        <div className="p-6 flex items-center gap-3 border-b border-border-light dark:border-border-dark h-20">
          <LogoLink className="flex items-center gap-3">
            <div className="size-8 text-primary flex items-center justify-center">
              <svg className="w-full h-full" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path d="M42.4379 44C42.4379 44 36.0744 33.9038 41.1692 24C46.8624 12.9336 42.2078 4 42.2078 4L7.01134 4C7.01134 4 11.6577 12.932 5.96912 23.9969C0.876273 33.9029 7.27094 44 7.27094 44L42.4379 44Z" fill="currentColor"></path>
              </svg>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-text-main-light dark:text-white">MagineAI</h2>
          </LogoLink>
        </div>
        <div className="flex flex-col flex-1 p-4 gap-6 overflow-y-auto">
          {/* Stats */}
          <div className="bg-background-light dark:bg-background-dark/50 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-text-main-light dark:text-white mb-1">Library Stats</h3>
            <p className="text-xs text-text-sub-light dark:text-text-sub-dark">
              {libraryItems.filter(i => i.type === 'magazine').length} Mags, {libraryItems.filter(i => i.type === 'book').length} Books
            </p>
            <div className="mt-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
              <div className="bg-primary h-1.5 rounded-full" style={{ width: `${Math.min((libraryItems.length / 10) * 100, 100)}%` }}></div>
            </div>
          </div>
          {/* Navigation */}
          <nav className="flex flex-col gap-2">
            <button
              onClick={() => setActiveFilter('All Items')}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors text-left ${activeFilter === 'All Items' || activeFilter === 'Magazines' || activeFilter === 'Books' ? 'bg-primary/10 text-primary' : 'text-text-sub-light dark:text-text-sub-dark hover:bg-background-light dark:hover:bg-background-dark/50'}`}
            >
              <span className={`material-symbols-outlined ${activeFilter === 'All Items' ? 'filled' : ''}`}>library_books</span>
              <span>Library</span>
            </button>

            <button
              onClick={() => setActiveFilter('Favorites')}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${activeFilter === 'Favorites' ? 'bg-primary/10 text-primary font-medium' : 'text-text-sub-light dark:text-text-sub-dark hover:bg-background-light dark:hover:bg-background-dark/50'}`}
            >
              <span className={`material-symbols-outlined ${activeFilter === 'Favorites' ? 'filled' : ''}`}>favorite</span>
              <span>Favorites</span>
            </button>

            <button
              onClick={() => setActiveFilter('Trash')}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${activeFilter === 'Trash' ? 'bg-primary/10 text-primary font-medium' : 'text-text-sub-light dark:text-text-sub-dark hover:bg-background-light dark:hover:bg-background-dark/50'}`}
            >
              <span className={`material-symbols-outlined ${activeFilter === 'Trash' ? 'filled' : ''}`}>delete</span>
              <span>Trash</span>
            </button>
          </nav>
          <div className="mt-auto pt-6 border-t border-border-light dark:border-border-dark flex flex-col gap-2">
            <h3 className="px-4 text-xs font-semibold text-text-sub-light dark:text-text-sub-dark uppercase tracking-wider mb-2">Settings</h3>
            <div className="px-2">
              <ThemeToggle showLabel className="justify-start" />
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 mx-2 rounded-lg text-text-sub-light dark:text-text-sub-dark hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-600 dark:hover:text-red-400 transition-colors text-left"
            >
              <span className="material-symbols-outlined">logout</span>
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full min-w-0 relative">
        {/* Header */}
        <header className="h-20 border-b border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark px-6 flex items-center justify-between shrink-0 z-20">
          {/* Mobile Menu Trigger */}
          <button className="lg:hidden mr-4 text-text-main-light dark:text-white">
            <span className="material-symbols-outlined">menu</span>
          </button>
          {/* Search */}
          <div className="flex-1 max-w-xl">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-text-sub-light dark:text-text-sub-dark">search</span>
              </div>
              <input className="block w-full rounded-lg border-none bg-background-light dark:bg-background-dark py-2.5 pl-10 pr-4 text-sm text-text-main-light dark:text-white placeholder-text-sub-light dark:placeholder-text-sub-dark focus:ring-2 focus:ring-primary/50 transition-all" placeholder="Search for stories, books, or magazines..." type="text" />
            </div>
          </div>
          {/* Actions */}
          <div className="flex items-center gap-4 ml-6">
            <Link href="/create">
              <button className="hidden sm:flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-all shadow-md shadow-primary/20">
                <span className="material-symbols-outlined text-[20px]">add</span>
                <span>Create New</span>
              </button>
            </Link>
            <div
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              title="Toggle Menu"
              className="size-10 rounded-full bg-cover bg-center border-2 border-border-light dark:border-border-dark cursor-pointer hover:border-primary transition-colors relative"
              style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBSwlJZ47ONFsePugL7NgiNspnVUymj0QLdvtin7tP3fBC9dv849mk9VRVfgFjr027y2u71CNZWV1G41gAYwYHXoclFzOjMR6vM8YHOmY9NncLr4XTgxO18UGeCyyJDlo1QtiPYzO3ZfL76rqBqeROTQP_gtnwGuqYn-EIhcfBp2YqBkNX9g-Dd2GM27DTF7Doz9cb98mHeG0QoSMPU-B-Dl9bYo6PtCKxvXvPEskVgd59C7PfPPLmKPRkP-DoK4-KHZQW9wuZDwI2D')" }}
            >
            </div>
          </div>
        </header>
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 scroll-smooth">
          <div className="max-w-[1200px] mx-auto flex flex-col gap-8 pb-10">
            {/* Heading Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-text-main-light dark:text-white tracking-tight mb-2">Welcome back, {user?.name.split(' ')[0] || 'Creator'}</h1>
                <p className="text-text-sub-light dark:text-text-sub-dark">Here's your personal library of AI-generated wonders.</p>
              </div>
            </div>
            {/* Recent Activity / Hero Card (Show latest item if exists) */}
            {libraryItems.length > 0 && (
              <section>
                {(() => {
                  const latestItem = [...libraryItems].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())[0];
                  return (
                    <div onClick={() => router.push(`/reader/${latestItem.id}`)} className="cursor-pointer flex flex-col md:flex-row bg-surface-light dark:bg-surface-dark rounded-2xl p-6 shadow-sm border border-border-light dark:border-border-dark gap-6 items-center md:items-stretch group hover:border-primary/30 transition-all">
                      <div className="w-full md:w-1/3 aspect-video md:aspect-auto md:h-48 rounded-xl bg-cover bg-center shadow-md relative overflow-hidden"
                        style={{ backgroundImage: `url('${latestItem.image_urls?.[0] || latestItem.images?.[0] || latestItem.image_url || 'https://via.placeholder.com/800x600?text=No+Cover'}')` }}>
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-all"></div>
                      </div>
                      <div className="flex-1 flex flex-col justify-between py-1 w-full">
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getTypeColor(latestItem.type || 'magazine').replace('bg-', 'ring-').replace('/30', '/10')} ${getTypeColor(latestItem.type || 'magazine')}`}>
                              {(latestItem.type || 'magazine').charAt(0).toUpperCase() + (latestItem.type || 'magazine').slice(1)}
                            </span>
                            <span className="text-xs text-text-sub-light dark:text-text-sub-dark">Generated {new Date(latestItem.created_at).toLocaleDateString()}</span>
                          </div>
                          <h3 className="text-2xl font-bold text-text-main-light dark:text-white mb-2 line-clamp-1">{latestItem.title}</h3>
                          <p className="text-text-sub-light dark:text-text-sub-dark text-sm line-clamp-2">{latestItem.introduction || 'Explore your latest creation...'}</p>
                        </div>
                        <div className="mt-6 flex flex-col gap-3">
                          <div className="flex gap-3 mt-2">
                            <button onClick={(e) => { e.stopPropagation(); router.push(`/reader/${latestItem.id}`); }} className="bg-primary hover:bg-primary/90 text-white text-sm font-bold py-2 px-6 rounded-lg transition-colors">Open</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </section>
            )}
            {/* Filters & Toolbar */}
            <div className="sticky top-0 z-10 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm py-2 -mx-2 px-2 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center bg-surface-light dark:bg-surface-dark p-1 rounded-lg border border-border-light dark:border-border-dark shadow-sm w-full sm:w-auto overflow-x-auto">
                {['All Items', 'Magazines', 'Books', 'Stories'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium whitespace-nowrap ${activeFilter === filter
                      ? 'bg-primary/10 text-primary'
                      : 'text-text-sub-light dark:text-text-sub-dark hover:text-text-main-light dark:hover:text-white'
                      }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                {activeFilter === 'Trash' && filteredItems.length > 0 && (
                  <button
                    onClick={handleEmptyTrash}
                    className="text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 px-3 py-2 rounded-lg font-bold border border-red-200 dark:border-red-900/50 transition-colors"
                  >
                    Empty Trash
                  </button>
                )}
                <span className="text-sm text-text-sub-light dark:text-text-sub-dark hidden md:block">Sort by:</span>
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="appearance-none bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark text-text-main-light dark:text-white text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5 pr-8 cursor-pointer"
                  >
                    <option>Date Created</option>
                    <option>Title (A-Z)</option>
                    <option>Last Opened</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-sub-light dark:text-text-sub-dark">
                    <span className="material-symbols-outlined text-sm">expand_more</span>
                  </div>
                </div>
                <button
                  onClick={() => setLayout(prev => prev === 'grid' ? 'list' : 'grid')}
                  className="p-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-text-sub-light dark:text-text-sub-dark hover:text-primary transition-colors"
                  title={layout === 'grid' ? "Switch to List View" : "Switch to Grid View"}
                >
                  <span className="material-symbols-outlined">{layout === 'grid' ? 'view_list' : 'grid_view'}</span>
                </button>
              </div>
            </div>
            {/* Grid Content */}
            <div className={`${layout === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' : 'flex flex-col gap-4'}`}>
              {loading ? (
                // Skeleton Loader
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className={`animate-pulse bg-gray-200 dark:bg-gray-800 rounded-xl ${layout === 'grid' ? 'aspect-[3/4]' : 'h-32 w-full'}`}></div>
                ))
              ) : (activeFilter === 'Books' || activeFilter === 'Stories') ? (
                <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
                  <div className="size-24 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-6">
                    <span className="material-symbols-outlined text-[40px]">
                      {activeFilter === 'Books' ? 'auto_stories' : 'history_edu'}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-text-main-light dark:text-white mb-2">
                    {activeFilter} Coming Soon
                  </h2>
                  <p className="text-text-sub-light dark:text-text-sub-dark max-w-md">
                    We are working hard to bring {activeFilter.toLowerCase()} generation to MagineAI. Stay tuned for updates!
                  </p>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="col-span-full text-center py-20">
                  <p className="text-text-sub-light dark:text-text-sub-dark text-lg mb-4">
                    {activeFilter === 'Trash' ? 'Trash is empty.' : activeFilter === 'Favorites' ? 'No favorites yet.' : 'No creations found.'}
                  </p>
                  {activeFilter !== 'Trash' && activeFilter !== 'Favorites' && (
                    <Link href="/create">
                      <button className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg font-bold transition-all">
                        Create Your First {activeFilter !== 'All Items' ? activeFilter.slice(0, -1) : 'Masterpiece'}
                      </button>
                    </Link>
                  )}
                </div>
              ) : (
                filteredItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => activeFilter !== 'Trash' && router.push(`/reader/${item.id}`)}
                    className={`cursor-pointer group relative flex bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark overflow-hidden hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300 ${layout === 'grid' ? 'flex-col' : 'flex-row h-32'}`}
                  >
                    <div className={`bg-gray-200 dark:bg-gray-800 relative overflow-hidden ${layout === 'grid' ? 'aspect-[3/4] w-full' : 'w-24 shrink-0'}`}>
                      {item.image_urls && item.image_urls.length > 0 ? (
                        <div className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105" style={{ backgroundImage: `url('${item.image_urls[0]}')` }}></div>
                      ) : item.image_url ? (
                        <div className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105" style={{ backgroundImage: `url('${item.image_url}')` }}></div>
                      ) : (
                        item.images && item.images.length > 0 ? (
                          <div className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105" style={{ backgroundImage: `url('${item.images[0]}')` }}></div>
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-primary/10 text-primary">
                            <span className="material-symbols-outlined text-4xl">image</span>
                          </div>
                        )
                      )}

                      {/* Favorite Button Overlay (Only if not in trash) */}
                      {activeFilter !== 'Trash' && (
                        <div className={`absolute top-3 right-3 transition-opacity ${item.is_favorite ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                          <button
                            onClick={(e) => handleToggleFavorite(e, item.id, item.is_favorite || false)}
                            className={`p-1.5 rounded-full hover:scale-110 transition-transform ${item.is_favorite ? 'bg-white text-red-500' : 'bg-white/90 dark:bg-black/80 text-gray-700 dark:text-gray-200 hover:text-red-500'}`}
                          >
                            <span className={`material-symbols-outlined text-[20px] ${item.is_favorite ? 'filled' : ''}`}>favorite</span>
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="p-4 flex flex-col gap-2 flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-text-main-light dark:text-white leading-tight line-clamp-1" title={item.title}>{item.title}</h3>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1">
                          {activeFilter === 'Trash' ? (
                            <>
                              <button
                                onClick={(e) => handleRestore(e, item.id)}
                                className="text-text-sub-light dark:text-text-sub-dark hover:text-green-500 transition-colors"
                                title="Restore"
                              >
                                <span className="material-symbols-outlined text-[20px]">restore_from_trash</span>
                              </button>
                              <button
                                onClick={(e) => handlePermanentDelete(e, item.id)}
                                className="text-text-sub-light dark:text-text-sub-dark hover:text-red-600 transition-colors"
                                title="Delete Permanently"
                              >
                                <span className="material-symbols-outlined text-[20px]">delete_forever</span>
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={(e) => handleDownload(e, item.id, item.title)}
                                className="text-text-sub-light dark:text-text-sub-dark hover:text-primary transition-colors disabled:opacity-50"
                                title="Download PDF"
                                disabled={downloadingId === item.id}
                              >
                                <span className={`material-symbols-outlined text-[20px] ${downloadingId === item.id ? 'animate-pulse' : ''}`}>
                                  {downloadingId === item.id ? 'downloading' : 'download'}
                                </span>
                              </button>
                              <button onClick={(e) => handleDelete(e, item.id)} className="text-text-sub-light dark:text-text-sub-dark hover:text-red-500 transition-colors" title="Move to Trash">
                                <span className="material-symbols-outlined text-[20px]">delete</span>
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      {/* Check if description exists and show it in list view */}
                      {layout === 'list' && item.introduction && (
                        <p className="text-xs text-text-sub-light dark:text-text-sub-dark line-clamp-2 hidden sm:block">{item.introduction}</p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-text-sub-light dark:text-text-sub-dark mt-auto">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getTypeColor(item.type || 'magazine')}`}>{item.type || 'magazine'}</span>
                        <span>•</span>
                        <span>{new Date(item.created_at || Date.now()).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        {/* FAB for Mobile */}
        <Link href="/create">
          <button className="sm:hidden fixed bottom-6 right-6 size-14 bg-primary text-white rounded-full shadow-lg flex items-center justify-center z-50 hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-2xl">add</span>
          </button>
        </Link>

        {/* HIDDEN PRINT CONTAINER FOR PDF GENERATION */}
        {printStructure && (
          <div className="fixed left-[200vw] top-0 pointer-events-none opacity-0">
            {printStructure.pages.map((p, i) => (
              <div id={`dashboard-print-page-${i}`} key={i} className="mb-4">
                {/* Using Render Mode 'print' for standardized high-res output */}
                <MagazinePageRenderer page={p} structure={printStructure} renderMode="print" />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
