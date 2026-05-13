'use client';
import React from 'react';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { fetchContent } from '../../../lib/api';
import { GeneratedContent, MagazineStructure } from '../../../types';
import { MagazinePageRenderer } from '../../../components/MagazinePageRenderer';
import { Loader } from '../../../components/Loader';
import { FeedbackForm } from '../../../components/FeedbackForm';

export default function ReaderPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;
    const [content, setContent] = useState<GeneratedContent | null>(null);
    const [structure, setStructure] = useState<MagazineStructure | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showFeedback, setShowFeedback] = useState(false);
    const feedbackRef = useRef<HTMLElement>(null);

    useEffect(() => {
        if (!id) return;
        const load = async () => {
            try {
                const data = await fetchContent(id);
                setContent(data);
                try {
                    const parsed = JSON.parse(data.mainStory || '{}');
                    setStructure({ pages: [], ...parsed });
                } catch {
                    setStructure({ title: data.title, totalPages: 0, pages: [] });
                }
            } catch (err: any) {
                setError(err.response?.status === 403
                    ? "You don't have permission to view this content."
                    : "Content not found or could not be loaded.");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id]);

    // Inject fonts client-side only — avoids Next.js hydration mismatch
    useEffect(() => {
        const fontId = 'reader-page-fonts';
        if (!document.getElementById(fontId)) {
            const link = document.createElement('link');
            link.id = fontId;
            link.rel = 'stylesheet';
            link.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Karla:wght@300;400;500&display=swap';
            document.head.appendChild(link);
        }
        document.body.classList.add('reader-bg');
        const styleId = 'reader-page-global';
        if (!document.getElementById(styleId)) {
            const el = document.createElement('style');
            el.id = styleId;
            el.textContent = 'html{scroll-behavior:smooth} body.reader-bg{background:#EEEAE3!important}';
            document.head.appendChild(el);
        }
        return () => { document.body.classList.remove('reader-bg'); };
    }, []);

    if (loading) {
        return (
            <div style={styles.loadingScreen}>
                <Loader />
                <p style={styles.loadingText}>Opening your magazine…</p>
            </div>
        );
    }

    if (error || !content) {
        return (
            <div style={styles.errorScreen}>
                <p style={{ fontFamily: 'Playfair Display, serif', fontSize: 18, marginBottom: 12, color: '#3D3A34' }}>{error || 'Something went wrong.'}</p>
                <Link href="/dashboard" style={styles.errorLink}>Return to Library</Link>
            </div>
        );
    }

    return (
        <>
            {/* Minimal sticky bar — doesn't compete with the magazine pages */}
            <nav style={styles.nav}>
                <Link href="/dashboard" style={styles.navBack}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 12H5M12 5l-7 7 7 7" />
                    </svg>
                    Library
                </Link>

                <div style={styles.navTitle}>
                    <span style={styles.navTitleText}>{content.title}</span>
                </div>

                <button
                    onClick={() => {
                        setShowFeedback(true);
                        setTimeout(() => feedbackRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
                    }}
                    style={styles.navAction}
                >
                    Rate
                </button>
            </nav>

            {/* Reading environment */}
            <main style={styles.main}>

                {/* Pages — each rendered at full magazine size, stacked with reading spacing */}
                {structure && structure.pages.length > 0 ? (
                    <div style={styles.pagesStack}>
                        {structure.pages.map((page, i) => (
                            <React.Fragment key={i}>
                                <div style={styles.pageStageOuter}>
                                    <div style={styles.pageStage}>
                                        <div style={styles.pageLeftShadow} />
                                        <div style={styles.pageFrame}>
                                            <MagazinePageRenderer
                                                page={page}
                                                structure={structure}
                                                renderMode="screen"
                                            />
                                        </div>
                                        <div style={styles.pageRightShadow} />
                                    </div>
                                </div>
                                {/* Separator sits OUTSIDE pageWrapper so it's not inside the padding-bottom box */}
                                {i < structure.pages.length - 1 && (
                                    <div style={styles.pageSeparator}>
                                        <div style={styles.pageSepLine} />
                                    </div>
                                )}
                            </React.Fragment>
                        ))}

                        {/* End-of-magazine ornament */}
                        <div style={styles.endOrnament}>
                            <div style={styles.endLine} />
                            <div style={styles.endDot} />
                            <div style={styles.endLine} />
                        </div>
                    </div>
                ) : (
                    // Fallback for non-structured content
                    <div style={styles.legacyBlock}>
                        {content.introduction && <p style={styles.legacyText}>{content.introduction}</p>}
                        {content.conclusion && <p style={styles.legacyText}>{content.conclusion}</p>}
                    </div>
                )}

                {/* Feedback */}
                {showFeedback && (
                    <section ref={feedbackRef} style={styles.feedbackSection}>
                        <div style={styles.feedbackInner}>
                            <h2 style={styles.feedbackHeading}>Rate this Issue</h2>
                            <FeedbackForm contentId={content.id} />
                        </div>
                    </section>
                )}

            </main>

            {/* Hidden print container for PDF export */}
            {structure && (
                <div style={{ position: 'fixed', left: '200vw', top: 0, pointerEvents: 'none', opacity: 0 }}>
                    {structure.pages.map((p, i) => (
                        <div id={`reader-print-page-${i}`} key={i}>
                            <MagazinePageRenderer page={p} structure={structure} renderMode="print" />
                        </div>
                    ))}
                </div>
            )}
        </>
    );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
    loadingScreen: {
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#EEEAE3',
        gap: 16,
    },
    loadingText: {
        fontFamily: 'Playfair Display, Georgia, serif',
        fontStyle: 'italic',
        fontSize: 15,
        color: '#8A8680',
    },
    errorScreen: {
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#EEEAE3',
        padding: '2rem',
        textAlign: 'center',
    },
    errorLink: {
        fontFamily: 'Karla, sans-serif',
        fontSize: 13,
        letterSpacing: '0.12em',
        textTransform: 'uppercase' as const,
        color: '#2B4162',
        textDecoration: 'none',
        borderBottom: '0.5px solid #2B4162',
        paddingBottom: 2,
    },

    // Nav — paper-strip feel, not a glass card
    nav: {
        position: 'sticky',
        top: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 28px',
        background: '#FAF8F4',
        borderBottom: '0.5px solid #C8C4BC',
        backdropFilter: 'blur(8px)',
    },
    navBack: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontFamily: 'Karla, sans-serif',
        fontSize: 12,
        fontWeight: 500,
        letterSpacing: '0.14em',
        textTransform: 'uppercase' as const,
        color: '#8A8680',
        textDecoration: 'none',
        transition: 'color 0.15s',
    },
    navTitle: {
        flex: 1,
        textAlign: 'center' as const,
        overflow: 'hidden',
        padding: '0 20px',
    },
    navTitleText: {
        fontFamily: 'Playfair Display, Georgia, serif',
        fontSize: 14,
        fontWeight: 400,
        color: '#1A1814',
        whiteSpace: 'nowrap' as const,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        display: 'block',
    },
    navAction: {
        fontFamily: 'Karla, sans-serif',
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: '0.18em',
        textTransform: 'uppercase' as const,
        color: '#8A8680',
        background: 'none',
        border: '0.5px solid #C8C4BC',
        borderRadius: 2,
        padding: '5px 14px',
        cursor: 'pointer',
    },

    // Reading environment
    main: {
        minHeight: '100vh',
        background: '#EEEAE3',
        padding: '52px 0 80px',
    },

    pagesStack: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 0,
    },

    pageStageOuter: { width: '100%', maxWidth: 640, margin: '0 auto' },
    pageStage: { display: 'flex', width: '100%' },
    pageLeftShadow: { width: 8, flexShrink: 0, background: 'linear-gradient(to right, transparent, rgba(0,0,0,0.04))' },
    pageFrame: { flex: 1, height: 0, paddingBottom: '133.33%', position: 'relative' as const, overflow: 'hidden', boxShadow: '0 8px 48px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08)', borderRadius: 2 },
    pageRightShadow: { width: 8, flexShrink: 0, background: 'linear-gradient(to left, transparent, rgba(0,0,0,0.04))' },

    pageSeparator: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '28px 0',
    },
    pageSepLine: {
        width: 32,
        height: 0.5,
        background: '#C8C4BC',
    },

    endOrnament: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        margin: '52px auto 0',
        width: 'fit-content',
    },
    endLine: {
        width: 40,
        height: 0.5,
        background: '#C8C4BC',
    },
    endDot: {
        width: 5,
        height: 5,
        borderRadius: '50%',
        background: '#C49A2C',
    },

    legacyBlock: {
        maxWidth: 680,
        margin: '0 auto',
        padding: '40px 48px',
        background: '#FAF8F4',
        borderRadius: 2,
    },
    legacyText: {
        fontFamily: 'EB Garamond, Garamond, serif',
        fontSize: 18,
        lineHeight: 1.75,
        color: '#3D3A34',
        marginBottom: 24,
    },

    feedbackSection: {
        maxWidth: 680,
        margin: '60px auto 0',
        padding: '0 0',
    },
    feedbackInner: {
        background: '#FAF8F4',
        border: '0.5px solid #C8C4BC',
        borderRadius: 2,
        padding: '40px 48px',
    },
    feedbackHeading: {
        fontFamily: 'Playfair Display, Georgia, serif',
        fontSize: 22,
        fontWeight: 700,
        color: '#1A1814',
        marginBottom: 24,
        letterSpacing: '-0.01em',
    },
};