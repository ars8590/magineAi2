'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ThemeToggle } from '../../../components/ThemeToggle';
import { fetchContent } from '../../../lib/api';
import { MagazineLayout } from '../../../components/MagazineLayout';
import { Loader } from '../../../components/Loader';
import { MagazinePageRenderer } from '../../../components/MagazinePageRenderer';
import { exportMultiPageToPdf, exportContentToPdf } from '../../../utils/pdf';
import { FeedbackForm } from '../../../components/FeedbackForm';
import type { GeneratedContent, MagazineStructure, MagazinePage } from '../../../types';

export default function PreviewPage() {
    const params = useParams<{ id: string }>();
    const [data, setData] = useState<GeneratedContent | null>(null);
    const [loading, setLoading] = useState(true);
    const [pdfGenerating, setPdfGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentPageIndex, setCurrentPageIndex] = useState(0);
    const [showFeedback, setShowFeedback] = useState(false);
    const feedbackRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const load = async () => {
            try {
                const response = await fetchContent(params.id);
                setData(response);
            } catch (err: any) {
                setError(err?.response?.data?.message || 'Could not load magazine.');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [params.id]);

    // Inject fonts and global styles client-side only — avoids hydration mismatch
    useEffect(() => {
        const fontId = 'preview-page-fonts';
        if (!document.getElementById(fontId)) {
            const link = document.createElement('link');
            link.id = fontId;
            link.rel = 'stylesheet';
            link.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Karla:wght@300;400;500;600&display=swap';
            document.head.appendChild(link);
        }
        // Scope bg to this page only via body class — remove on unmount
        document.body.classList.add('preview-bg');
        const styleId = 'preview-page-global';
        if (!document.getElementById(styleId)) {
            const el = document.createElement('style');
            el.id = styleId;
            el.textContent = `body.preview-bg{background:#EEEAE3!important} @keyframes spin{to{transform:rotate(360deg)}}`;
            document.head.appendChild(el);
        }
        return () => { document.body.classList.remove('preview-bg'); };
    }, []);

    const magazineStructure: MagazineStructure | null = useMemo(() => {
        if (!data?.mainStory) return null;
        try {
            const parsed = JSON.parse(data.mainStory);
            if (parsed?.pages && Array.isArray(parsed.pages)) return parsed as MagazineStructure;
        } catch { }
        return null;
    }, [data]);

    const currentPage: MagazinePage | null =
        magazineStructure ? magazineStructure.pages[currentPageIndex] : null;
    const totalPages = magazineStructure?.pages.length ?? 0;

    const handleDownload = async () => {
        if (!data) return;
        setPdfGenerating(true);
        try {
            if (magazineStructure) {
                const pageIds = magazineStructure.pages.map((_, i) => `print-page-${i}`);
                await exportMultiPageToPdf(pageIds, `magineai-${data.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.pdf`);
            } else {
                await exportContentToPdf(data, `magineai-${data.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.pdf`);
            }
        } catch (err) {
            console.error(err);
            setError('PDF export failed.');
        } finally {
            setPdfGenerating(false);
        }
    };

    const nextPage = () => { if (currentPageIndex < totalPages - 1) { setCurrentPageIndex(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); } };
    const prevPage = () => { if (currentPageIndex > 0) { setCurrentPageIndex(p => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); } };

    if (loading) return (
        <div style={S.loadingScreen}><Loader /><p style={S.loadingText}>Composing your magazine…</p></div>
    );
    if (error && !data) return (
        <div style={S.errorScreen}><p style={S.errorMsg}>{error}</p><Link href="/create" style={S.errorLink}>Back to Create</Link></div>
    );

    return (
        <>
            

            {/* Masthead */}
            <header style={S.masthead}>
                <div style={S.mastheadLeft}>
                    <div style={S.mastheadRule} />
                    <div>
                        <div style={S.mastheadBrand}>MagineAI</div>
                        <div style={S.mastheadSub}>Preview Edition</div>
                    </div>
                </div>
                <div style={S.mastheadCentre}>
                    {data?.title && <span style={S.mastheadTitle}>{data.title}</span>}
                </div>
                <div style={S.mastheadRight}>
                    <button onClick={handleDownload} disabled={pdfGenerating} style={{ ...S.actionBtn, ...(pdfGenerating ? S.actionBtnDisabled : {}) }}>
                        {pdfGenerating ? <span style={S.spinner} /> : (
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M16 12l-4 4-4-4M12 16V4" />
                            </svg>
                        )}
                        {pdfGenerating ? 'Generating…' : 'PDF'}
                    </button>
                    <button onClick={() => {
                        setShowFeedback(true);
                        setTimeout(() => feedbackRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
                    }} style={S.ghostBtn}>Rate</button>
                    <Link href="/dashboard" style={S.ghostBtn}>Library</Link>
                    <ThemeToggle />
                </div>
            </header>

            <main style={S.main}>
                {/* Legacy layout */}
                {!magazineStructure && data && (
                    <div id="magazine-preview" style={S.legacyWrap}><MagazineLayout content={data} /></div>
                )}

                {/* Structured magazine */}
                {magazineStructure && currentPage && (
                    <div style={S.previewShell}>
                        {/* Progress strip */}
                        <div style={S.progressStrip}>
                            <div style={S.progressDots}>
                                {magazineStructure.pages.map((_, i) => (
                                    <button key={i} onClick={() => { setCurrentPageIndex(i); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                        style={{ ...S.progressDot, ...(i === currentPageIndex ? S.progressDotActive : {}) }}
                                        aria-label={`Page ${i + 1}`}
                                    />
                                ))}
                            </div>
                            <div style={S.pageLabel}>
                                <span style={S.pageLabelType}>{currentPage.type?.replace(/_/g, ' ')}</span>
                                <span style={S.pageLabelCount}>{currentPageIndex + 1} / {totalPages}</span>
                            </div>
                        </div>

                        {/* Page stage — padding-bottom trick enforces 3:4 ratio with hard pixel height */}
                        <div style={S.pageStageOuter}>
                            <div style={S.pageStage}>
                                <div style={S.pageLeftShadow} />
                                <div style={S.pageFrame}>
                                    <MagazinePageRenderer page={currentPage} structure={magazineStructure} renderMode="screen" />
                                </div>
                                <div style={S.pageRightShadow} />
                            </div>
                        </div>

                        {/* Page turner */}
                        <div style={S.pageTurner}>
                            <button onClick={prevPage} disabled={currentPageIndex === 0}
                                style={{ ...S.turnerBtn, ...(currentPageIndex === 0 ? S.turnerBtnDisabled : {}) }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
                                Previous
                            </button>
                            <div style={S.turnerFolio}>
                                <span style={S.turnerFolioTitle}>{data?.title}</span>
                            </div>
                            <button onClick={nextPage} disabled={currentPageIndex === totalPages - 1}
                                style={{ ...S.turnerBtn, ...S.turnerBtnNext, ...(currentPageIndex === totalPages - 1 ? S.turnerBtnDisabled : {}) }}>
                                Next
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
                            </button>
                        </div>
                    </div>
                )}

                {/* Feedback */}
                {showFeedback && data && (
                    <section ref={feedbackRef} style={S.feedbackSection}>
                        <div style={S.feedbackInner}>
                            <div style={S.feedbackRuleTop} />
                            <h2 style={S.feedbackHeading}>Rate this Issue</h2>
                            <FeedbackForm contentId={data.id} />
                        </div>
                    </section>
                )}
            </main>

            {/* Hidden print container */}
            {magazineStructure && (
                <div style={{ position: 'fixed', left: '200vw', top: 0, pointerEvents: 'none', opacity: 0 }}>
                    {magazineStructure.pages.map((p, i) => (
                        <div id={`print-page-${i}`} key={i}>
                            <MagazinePageRenderer page={p} structure={magazineStructure} renderMode="print" />
                        </div>
                    ))}
                </div>
            )}
        </>
    );
}

// GLOBAL_CSS injected only client-side via useEffect in MagazinePageRenderer — no server-rendered <style> tags here
const GLOBAL_CSS = `@keyframes spin{to{transform:rotate(360deg)}}`;

const S: Record<string, React.CSSProperties> = {
    loadingScreen: { minHeight: '100vh', background: '#EEEAE3', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 },
    loadingText: { fontFamily: 'Playfair Display, Georgia, serif', fontStyle: 'italic', fontSize: 15, color: '#8A8680' },
    errorScreen: { minHeight: '100vh', background: '#EEEAE3', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' },
    errorMsg: { fontFamily: 'EB Garamond, Garamond, serif', fontSize: 18, color: '#3D3A34', marginBottom: 20 },
    errorLink: { fontFamily: 'Karla, sans-serif', fontSize: 11, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#2B4162', textDecoration: 'none', borderBottom: '0.5px solid #2B4162', paddingBottom: 2 },
    masthead: { position: 'sticky', top: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', height: 52, background: '#FAF8F4', borderBottom: '0.5px solid #C8C4BC' },
    mastheadLeft: { display: 'flex', alignItems: 'flex-start', gap: 10, flexShrink: 0 },
    mastheadRule: { width: 2, height: 36, background: '#C49A2C', flexShrink: 0, marginTop: 2 },
    mastheadBrand: { fontFamily: 'Karla, sans-serif', fontSize: 10, fontWeight: 600, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#1A1814' },
    mastheadSub: { fontFamily: 'Karla, sans-serif', fontSize: 8, fontWeight: 300, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#8A8680', marginTop: 2 },
    mastheadCentre: { flex: 1, textAlign: 'center', padding: '0 24px', overflow: 'hidden' },
    mastheadTitle: { fontFamily: 'Playfair Display, Georgia, serif', fontSize: 14, fontStyle: 'italic', color: '#3D3A34', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' },
    mastheadRight: { display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 },
    actionBtn: { display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'Karla, sans-serif', fontSize: 11, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#FAF8F4', background: '#1A1814', border: 'none', borderRadius: 2, padding: '6px 16px', cursor: 'pointer' },
    actionBtnDisabled: { opacity: 0.45, cursor: 'not-allowed' },
    spinner: { display: 'inline-block', width: 10, height: 10, border: '1.5px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' },
    ghostBtn: { fontFamily: 'Karla, sans-serif', fontSize: 11, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#8A8680', background: 'none', border: '0.5px solid #C8C4BC', borderRadius: 2, padding: '5px 14px', cursor: 'pointer', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' },
    main: { minHeight: '100vh', background: '#EEEAE3', padding: '16px 16px 32px' },
    legacyWrap: { maxWidth: 880, margin: '0 auto' },
    previewShell: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, width: '100%' },
    progressStrip: { width: '100%', maxWidth: 640, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, marginBottom: 12 },
    progressDots: { display: 'flex', gap: 5, flexWrap: 'wrap', justifyContent: 'center' },
    progressDot: { width: 5, height: 5, borderRadius: '50%', background: '#C8C4BC', border: 'none', padding: 0, cursor: 'pointer', transition: 'background 0.2s, transform 0.2s' },
    progressDotActive: { background: '#C49A2C', transform: 'scale(1.4)' },
    pageLabel: { display: 'flex', gap: 16, alignItems: 'center' },
    pageLabelType: { fontFamily: 'Karla, sans-serif', fontSize: 9, fontWeight: 500, letterSpacing: '0.24em', textTransform: 'uppercase', color: '#8A8680' },
    pageLabelCount: { fontFamily: 'Playfair Display, Georgia, serif', fontStyle: 'italic', fontSize: 13, color: '#C49A2C' },
    pageStageOuter: { width: '100%', maxWidth: 640, margin: '0 auto' },
    pageStage: { display: 'flex', width: '100%' },
    pageLeftShadow: { width: 8, flexShrink: 0, background: 'linear-gradient(to right, transparent, rgba(0,0,0,0.04))' },
    // paddingBottom:133.33% = 4/3 ratio — same trick as reader. position:relative anchors absolute children.
    pageFrame: { flex: 1, height: 0, paddingBottom: '133.33%', position: 'relative' as const, overflow: 'hidden', boxShadow: '0 8px 48px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08)', borderRadius: 2 },
    pageRightShadow: { width: 8, flexShrink: 0, background: 'linear-gradient(to left, transparent, rgba(0,0,0,0.04))' },
    pageTurner: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: 640, marginTop: 12, paddingTop: 10, borderTop: '0.5px solid #C8C4BC' },
    turnerBtn: { display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'Karla, sans-serif', fontSize: 11, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#3D3A34', background: 'none', border: '0.5px solid #C8C4BC', borderRadius: 2, padding: '8px 18px', cursor: 'pointer' },
    turnerBtnNext: { background: '#1A1814', color: '#FAF8F4', border: 'none' },
    turnerBtnDisabled: { opacity: 0.3, cursor: 'not-allowed' },
    turnerFolio: { textAlign: 'center', flex: 1, padding: '0 12px' },
    turnerFolioTitle: { fontFamily: 'Playfair Display, Georgia, serif', fontStyle: 'italic', fontSize: 12, color: '#8A8680', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' },
    feedbackSection: { maxWidth: 640, margin: '52px auto 0' },
    feedbackInner: { background: '#FAF8F4', border: '0.5px solid #C8C4BC', borderRadius: 2, padding: '36px 44px' },
    feedbackRuleTop: { width: 32, height: 1.5, background: '#C49A2C', marginBottom: 20 },
    feedbackHeading: { fontFamily: 'Playfair Display, Georgia, serif', fontSize: 22, fontWeight: 700, color: '#1A1814', letterSpacing: '-0.01em', marginBottom: 24 },
};