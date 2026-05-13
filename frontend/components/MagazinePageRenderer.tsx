'use client';

import React, { useEffect, useState } from 'react';
import { MagazinePage, MagazineStructure } from '../types';

interface MagazinePageRendererProps {
    page: MagazinePage;
    structure: MagazineStructure;
    renderMode?: 'screen' | 'print';
}

/* ── SCRIPT DETECTION ─────────────────────────────────────────────────────── */
const RTL_RE   = /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB1D-\uFDFD\uFE70-\uFEFC]/;
const INDIC_RE = /[\u0900-\u0D7F\u0D80-\u0DFF]/;
const CJK_RE   = /[\u4E00-\u9FFF\u3040-\u30FF\uAC00-\uD7AF]/;
type Script = 'latin' | 'rtl' | 'indic' | 'cjk';

function detectScript(t: string): Script {
    if (RTL_RE.test(t))   return 'rtl';
    if (INDIC_RE.test(t)) return 'indic';
    if (CJK_RE.test(t))   return 'cjk';
    return 'latin';
}
function ps(structure: MagazineStructure, page?: MagazinePage): Script {
    return detectScript([structure.title, page?.content, page?.title].filter(Boolean).join(' '));
}
const ls  = (s: Script, v: string) => s === 'latin' ? v : '0';
const tt  = (s: Script, v: string) => s === 'latin' ? v : 'none';
const dr  = (s: Script) => s === 'rtl' ? 'rtl' : 'ltr';
const col = (s: Script) => s === 'latin';

/* ── GLOBAL CSS ───────────────────────────────────────────────────────────── */
const GLOBAL_CSS = `
.mag-page {
  --cream:#FAF8F4; --ink:#1A1814; --ink-soft:#3D3A34; --ink-faint:#8A8680;
  --rule:#C8C4BC; --accent:#2B4162; --gold:#C49A2C; --paper-mid:#F0EDE7;
  --fd:'Playfair Display',Georgia,serif;
  --fb:'EB Garamond',Garamond,serif;
  --fs:'Karla','Helvetica Neue',sans-serif;
  container-type: size; 
  background:var(--cream); color:var(--ink); font-family:var(--fb);
  position:relative; overflow:hidden;
}
.dark .mag-page {
  --cream:#18160F; --ink:#EDE9E0; --ink-soft:#C8C3B5; --ink-faint:#7A7670;
  --rule:#3A3830; --paper-mid:#1F1D16;
}
.mag-page::before {
  content:''; position:absolute; inset:0; pointer-events:none; z-index:0;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
}
.mag-page.mag-back { background:#1A1814!important; }
.mag-page.mag-back::before { display:none; }

/* Chapter pages dark mode */
.mag-page.mag-chapter {
  --ch-bg: #FAF8F4;
  --ch-ink: #1A1814;
  --ch-ink-soft: #3D3A34;
  --ch-rule: #C8C4BC;
  --ch-gold: #C49A2C;
  --ch-headline: #1A1814;
  --ch-paper-mid: #F0EDE7;
  background: var(--ch-bg);
}
.dark .mag-page.mag-chapter {
  --ch-bg: #111009;
  --ch-ink: #EDE9E0;
  --ch-ink-soft: #C0BAB0;
  --ch-rule: #2E2C26;
  --ch-gold: #C49A2C;
  --ch-headline: #C49A2C;
  --ch-paper-mid: #2A2820;
  background: var(--ch-bg);
}
.mc { position:relative; z-index:1; }

.rh {
  font-family:var(--fs); font-size:8px; font-weight:500; color:var(--ink-faint);
  display:flex; justify-content:space-between; align-items:center;
  border-bottom:0.5px solid var(--rule); padding-bottom:8px; margin-bottom:16px;
  flex-shrink:0;
}
.folio {
  font-family:var(--fs); font-size:8px; font-weight:500; color:var(--ink-faint);
  display:flex; justify-content:space-between; align-items:center;
  border-top:0.5px solid var(--rule); padding-top:8px; flex-shrink:0;
}
.folio-pgnum {
  font-family:var(--fd); font-style:italic; font-size:11px; color:var(--gold);
}
.hl { font-family:var(--fd); font-weight:700; line-height:1.06; color:var(--ink); }

.body-col {
  font-family:var(--fb); color:var(--ink-soft);
  word-break:break-word; overflow-wrap:break-word; hyphens:auto;
  text-align: justify; /* Crisp block edges */
}

/* Authentic Print Drop Cap using Float */
.dc {
  float: left;
  font-family: var(--fd); 
  font-size: 3.8em;
  font-weight: 900; 
  line-height: 0.8; 
  margin-right: 0.08em; 
  margin-top: 0.02em;
  color: var(--ink);
}

.kicker {
  font-family:var(--fs); font-size:8px; font-weight:600; color:var(--gold);
  margin-bottom:6px;
}
.deck {
  font-family:var(--fb); font-style:italic;
  font-size:clamp(13px,1.6vw,15.5px); line-height:1.5; color:var(--ink-soft);
}
.toc-num {
  font-family:var(--fd); font-style:italic; font-size:1.6rem;
  color:var(--rule); line-height:1; width:2.4rem; flex-shrink:0;
}
`;

/* ── DARK MODE DETECTION ─────────────────────────────────────────────────── */
function useDarkMode(): boolean {
    const [dark, setSafeDark] = useState(false);
    useEffect(() => {
        const check = () => {
            const fromClass = document.documentElement.classList.contains('dark');
            const fromStorage = localStorage.getItem('theme') === 'dark';
            setSafeDark(fromClass || fromStorage);
        };
        check();
        const obs = new MutationObserver(check);
        obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        window.addEventListener('storage', check);
        return () => { obs.disconnect(); window.removeEventListener('storage', check); };
    }, []);
    return dark;
}

/* ── SHARED COMPONENTS ────────────────────────────────────────────────────── */
const RunHead = ({ left, right, light = false }: { left: string; right: string; light?: boolean }) => (
    <div className="rh" style={light ? { borderBottomColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.4)' } : undefined}>
        <span>{left}</span>
        <span style={{ width: 3, height: 3, borderRadius: '50%', background: light ? 'rgba(255,255,255,0.3)' : 'var(--rule)', display: 'inline-block' }} />
        <span>{right}</span>
    </div>
);

const Folio = ({ page, structure, light = false }: { page: MagazinePage; structure: MagazineStructure; light?: boolean }) => (
    <div className="folio" style={light ? { borderTopColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.4)' } : undefined}>
        <span>{structure.title}</span>
        <span style={{ width: 16, height: 0.5, background: light ? 'rgba(255,255,255,0.2)' : 'var(--rule)', display: 'block' }} />
        <span className="folio-pgnum" style={light ? { color: 'rgba(255,255,255,0.6)' } : undefined}>{page.pageNumber}</span>
    </div>
);

const DropCap = ({ char }: { char: string }) => <span className="dc">{char}</span>;

/* Unified CSS Column Renderer */
const ColBody = ({ text, script, numCols, dropCap = false, color }: {
    text?: string; script: Script; numCols: number; dropCap?: boolean; color?: string;
}) => {
    if (!text) return null;
    const useCols = numCols > 1; 

    const renderBlocks = (str: string) => {
        const lines = str.split('\n');
        return lines.map((line, i) => (
            <React.Fragment key={i}>
                {i === 0 && dropCap && col(script) && line.trim().length > 0 
                    ? <><DropCap char={line.trimStart().charAt(0)} />{line.trimStart().slice(1)}</> 
                    : line
                }
                {i < lines.length - 1 && <><br/><br/></>}
            </React.Fragment>
        ));
    }

    return (
        <div className="body-col" style={{ 
            columnCount: useCols ? numCols : 1,
            columnGap: useCols ? '2.5rem' : 'normal', 
            columnRule: 'none', 
            direction: dr(script), 
            fontSize: 'clamp(11px, 1.4vw, 14.5px)', 
            lineHeight: 1.65, 
            color: color || 'var(--ink-soft)',
            width: '100%',
            height: '100%', 
            columnFill: 'balance' 
        }}>
            {renderBlocks(text)}
        </div>
    );
};

/* Floated image - optimized margins for wrapping */
const FloatImg = ({ src, side, widthPct, heightPct }: {
    src: string; side: 'left' | 'right'; widthPct: number; heightPct: number;
}) => (
    <div style={{
        float: side, width: `${widthPct}%`,
        marginLeft: side === 'right' ? '4%' : 0, // Gives the text breathing room
        marginRight: side === 'left' ? '4%' : 0,
        marginBottom: '2%', height: `${heightPct}%`, overflow: 'hidden',
    }}>
        <img src={src} alt="" crossOrigin="anonymous"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: 'contrast(1.03) saturate(0.9)' }} />
    </div>
);

const Shell = ({ children, pad = '1.5% 4% 2.5%', dir: d = 'ltr' }: {
    children: React.ReactNode; pad?: string; dir?: string;
}) => (
    <div className="mc" style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        padding: pad, direction: d as any, overflow: 'hidden',
    }}>
        {children}
    </div>
);

/* ── PAGE LAYOUTS ─────────────────────────────────────────────────────────── */

const CoverPage = ({ page, structure }: { page: MagazinePage; structure: MagazineStructure }) => {
    const s = ps(structure, page);
    return (
        <div style={{ position: 'absolute', inset: 0, background: '#0D1117', overflow: 'hidden' }}>
            {page.image && (
                <img src={page.image} alt="" crossOrigin="anonymous"
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', filter: 'contrast(1.06) saturate(0.82)' }} />
            )}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,rgba(0,0,0,0.65) 0%,rgba(0,0,0,0.08) 35%,rgba(0,0,0,0.15) 58%,rgba(0,0,0,0.92) 100%)' }} />
            <div className="mc" style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', padding: '5% 7%', direction: dr(s) }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <div style={{ width: 2.5, height: 48, background: '#C49A2C', flexShrink: 0 }} />
                        <div>
                            <div style={{ fontFamily: 'var(--fs)', fontSize: 9, fontWeight: 600, letterSpacing: '0.32em', color: 'rgba(255,255,255,0.92)', textTransform: 'uppercase' }}>MagineAI</div>
                            <div style={{ fontFamily: 'var(--fs)', fontSize: 7, fontWeight: 300, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginTop: 2 }}>Special Edition</div>
                        </div>
                    </div>
                    <div style={{ fontFamily: 'var(--fd)', fontStyle: 'italic', fontSize: 11, color: '#C49A2C' }}>Vol. I</div>
                </div>
                <div style={{ flex: 1 }} />
                <div>
                    <div style={{ width: 32, height: 1.5, background: '#C49A2C', marginBottom: 14 }} />
                    <h1 className="hl" style={{ fontSize: 'clamp(32px,6.5vw,62px)', color: '#fff', marginBottom: 12, textShadow: '0 2px 24px rgba(0,0,0,0.5)' }}>{structure.title}</h1>
                    {page.content && <p className="deck" style={{ color: 'rgba(255,255,255,0.72)', marginBottom: 22 }}>{page.content}</p>}
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <div style={{ width: 16, height: 0.5, background: 'rgba(255,255,255,0.28)' }} />
                        <span style={{ fontFamily: 'var(--fs)', fontSize: 7, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)' }}>Imagination Engineered</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ContentsPage = ({ page, structure }: { page: MagazinePage; structure: MagazineStructure }) => {
    const s = ps(structure, page);
    let items: { page: number; title: string }[] = [];
    try { items = JSON.parse(page.content || '[]'); } catch { }
    return (
        <div className="mc" style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', padding:'6% 6% 4%', direction:dr(s) }}>
            <div style={{ fontFamily: 'var(--fd)', fontSize: 'clamp(38px,7.5vw,68px)', fontWeight: 900, color: 'var(--paper-mid)', lineHeight: 1, marginBottom: 20, letterSpacing: '-0.03em', userSelect: 'none', flexShrink: 0 }}>Contents</div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {items.map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'baseline', borderBottom: '0.5px solid var(--rule)', padding: '9px 0' }}>
                        <span className="toc-num">{String(item.page).padStart(2, '0')}</span>
                        <div style={{ flex: 1, height: 0.5, background: 'var(--rule)', margin: '0 10px', position: 'relative', top: -4, opacity: 0.3 }} />
                        <span style={{ fontFamily: 'var(--fd)', fontSize: 'clamp(11px,1.3vw,14px)', color: 'var(--ink)' }}>{item.title}</span>
                    </div>
                ))}
                {items.length === 0 && <p style={{ fontFamily: 'var(--fb)', fontStyle: 'italic', color: 'var(--ink-faint)' }}>Table of contents will appear here.</p>}
            </div>
            <Folio page={page} structure={structure} />
        </div>
    );
};

const EditorNotePage = ({ page, structure }: { page: MagazinePage; structure: MagazineStructure }) => {
    const s = ps(structure, page);
    return (
        <div className="mc" style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', padding:'6% 6% 4%', direction:dr(s) }}>
            <div style={{ flexShrink: 0, marginBottom: '4%' }}>
                <div style={{ width: 24, height: 2, background: 'var(--gold)', marginBottom: 12 }} />
                <h2 className="hl" style={{ fontSize: 'clamp(24px, 3.5vw, 42px)', marginBottom: 6 }}>{page.title || "Editor's Note"}</h2>
                <p style={{ fontFamily: 'var(--fb)', fontStyle: 'italic', color: 'var(--ink-faint)', fontSize: 13 }}>From the editorial desk</p>
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
                <ColBody text={page.content} script={s} numCols={2} dropCap={false} />
            </div>
            <div style={{ flexShrink: 0, marginTop: '4%', paddingTop: '2%', borderTop: '0.5px solid var(--rule)' }}>
                <div style={{ fontFamily: 'var(--fd)', fontStyle: 'italic', fontSize: 14, color: 'var(--ink)' }}>The Editors</div>
                <div style={{ fontFamily: 'var(--fs)', fontSize: 8, letterSpacing: ls(s, '0.14em'), color: 'var(--ink-faint)', textTransform: tt(s, 'uppercase') as any, marginTop: 2 }}>MagineAI Editorial</div>
            </div>
            <div style={{ marginTop: '2%' }}><Folio page={page} structure={structure} /></div>
        </div>
    );
};

// EXACT MATCH: Introduction Page FIX - Shrunk headline & image so text doesn't clip
const IntroductionPage = ({ page, structure }: { page: MagazinePage; structure: MagazineStructure }) => {
    const s = ps(structure, page);
    return (
        <div className="mc" style={{
            position:'absolute', inset:0, overflow:'hidden',
            display:'flex', flexDirection:'column',
            padding:'6% 6% 4%', direction:dr(s) 
        }}>
            
            <div style={{ flexShrink: 0, marginBottom: '2.5%' }}>
                <div className="kicker" style={{ letterSpacing: ls(s, '0.24em'), textTransform: tt(s, 'uppercase') as any, marginBottom: '1%' }}>Introduction</div>
                <h2 className="hl" style={{ 
                    fontSize: 'clamp(26px, 4vw, 56px)', 
                    lineHeight: 1.05,
                    /* FIX: Safely wrap long words ONLY for non-English languages */
                    wordBreak: s === 'latin' ? 'normal' : 'break-word',
                    overflowWrap: s === 'latin' ? 'normal' : 'anywhere'
                }}>{page.title}</h2>
            </div>

            <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
                {/* Scaled image down from 65% height to 45% height so the text has plenty of room to finish underneath it */}
                {page.image && <FloatImg src={page.image} side="right" widthPct={38} heightPct={45} />}
                <ColBody text={page.content} script={s} numCols={1} dropCap={col(s)} />
            </div>
            <div style={{ flexShrink: 0, marginTop: 'auto', paddingTop: '2%' }}>
                <Folio page={page} structure={structure} />
            </div>
        </div>
    );
};

const ChapterPage = ({ page, structure, dark, isPrint = false }: { page: MagazinePage; structure: MagazineStructure; dark: boolean; isPrint?: boolean }) => {
    const s = ps(structure, page);
    const isCont = /\(cont\.?\)/i.test(page.title || '');
    const chBg        = dark ? '#111009' : '#FAF8F4';
    const chInk       = dark ? '#EDE9E0' : '#1A1814';
    const chInkSoft   = dark ? '#C0BAB0' : '#3D3A34';
    const chRule      = dark ? '#2E2C26' : '#C8C4BC';
    const chGold      = '#C49A2C';
    const chHeadline  = dark ? '#C49A2C' : '#1A1814';

    return (
        <div className="mc" style={{
            position:'absolute', inset:0, overflow:'hidden',
            display:'flex', flexDirection:'column',
            padding:'1.5% 4% 2.5%', direction:dr(s),
            background:chBg, color:chInk,
        }}>
            <RunHead left={page.chapterNumber ? `Chapter ${page.chapterNumber}` : structure.title} right={structure.title} />

            {!isCont && (
                <div style={{ display:'flex', width:'100%', marginTop:'5%', marginBottom:'3.5%', height:'34%', flexShrink: 0 }}>
                    {/* FIX: Added minWidth: 0 to force flexbox to respect the 50% width and wrap long words! */}
                    <div style={{ flex:'0 0 50%', minWidth: 0, paddingRight:'5%', display:'flex', flexDirection:'column', justifyContent:'center' }}>
                        {page.chapterNumber && (
                            <div style={{ fontFamily:'var(--fs)', fontWeight:700, fontSize:'clamp(9px, 1.2vw, 18px)', letterSpacing:ls(s,'0.15em'), textTransform:tt(s,'uppercase') as any, color:chGold, borderBottom:`1.5px solid ${chGold}`, paddingBottom:5, marginBottom:10, width:'fit-content' }}>
                                Chapter {String(page.chapterNumber).padStart(2, '0')}
                            </div>
                        )}
                       
                        <div style={{ 
                            fontFamily:'var(--fd)', fontWeight:900, 
                            fontSize: 'clamp(20px, 3.5vw, 52px)', 
                            lineHeight:1.05, textTransform:tt(s,'uppercase') as any, color:chHeadline,
                            overflowWrap: 'break-word'
                        }}>
                            {page.title}
                        </div>
                    </div>
                    <div style={{ flex:'0 0 50%', position:'relative', height: '100%' }}>
                        {page.image && <img src={page.image} alt="" crossOrigin="anonymous" style={{ position: 'absolute', inset: 0, width:'100%', height:'100%', objectFit:'cover', filter:'contrast(1.04) saturate(0.88)' }} />}
                    </div>
                </div>
            )}

            <div style={{ flex:1, width:'100%', overflow:'hidden', borderTop: !isCont ? `1px solid ${chRule}` : 'none', paddingTop: !isCont ? '3.5%' : '0' }}>
                <ColBody text={page.content} script={s} numCols={2} dropCap={col(s) && !isCont} color={chInkSoft} />
            </div>

            <div style={{ flexShrink:0, marginTop:'auto', paddingTop:'2%' }}>
                <Folio page={page} structure={structure} />
            </div>
        </div>
    );
};

const ImageSidePage = ({ page, structure, imageLeft, dark = false, isPrint = false }: { page: MagazinePage; structure: MagazineStructure; imageLeft: boolean; dark?: boolean; isPrint?: boolean }) => {
    const s = ps(structure, page);
    const isCont = /\(cont\.?\)/i.test(page.title || '');
    const chBg       = dark ? '#111009' : '#FAF8F4';
    const chInk      = dark ? '#EDE9E0' : '#1A1814';
    const chInkSoft  = dark ? '#C0BAB0' : '#3D3A34';
    const chRule     = dark ? '#2E2C26' : '#C8C4BC';
    const chGold     = '#C49A2C';
    const chHeadline = dark ? '#C49A2C' : '#1A1814';

    return (
        <div className="mc" style={{
            position:'absolute', inset:0, overflow:'hidden',
            display:'flex', flexDirection:'column',
            padding:'1.5% 4% 2.5%', direction:dr(s),
            background:chBg, color:chInk,
        }}>
            <RunHead left={page.chapterNumber ? `Chapter ${page.chapterNumber}` : structure.title} right={structure.title} />

           {!isCont && (
                <div style={{ display:'flex', flexDirection: imageLeft ? 'row' : 'row-reverse', width:'100%', marginTop:'5%', marginBottom:'3.5%', height:'34%', flexShrink: 0 }}>
                    <div style={{ flex:'0 0 50%', position:'relative', height: '100%' }}>
                        {page.image && <img src={page.image} alt="" crossOrigin="anonymous" style={{ position: 'absolute', inset: 0, width:'100%', height:'100%', objectFit:'cover', filter:'contrast(1.04) saturate(0.88)' }} />}
                    </div>
                    {/* FIX: Added minWidth: 0 here as well! */}
                    <div style={{ flex:'0 0 50%', minWidth: 0, paddingLeft: imageLeft ? '5%' : '0', paddingRight: imageLeft ? '0' : '5%', display:'flex', flexDirection:'column', justifyContent:'center' }}>
                        {page.chapterNumber && (
                            <div style={{ fontFamily:'var(--fs)', fontWeight:700, fontSize:'clamp(9px, 1.2vw, 18px)', letterSpacing:ls(s,'0.15em'), textTransform:tt(s,'uppercase') as any, color:chGold, borderBottom:`1.5px solid ${chGold}`, paddingBottom:5, marginBottom:10, width:'fit-content' }}>
                                Chapter {String(page.chapterNumber).padStart(2, '0')}
                            </div>
                        )}
                       <div style={{ 
                            fontFamily:'var(--fd)', fontWeight:900, 
                            fontSize: 'clamp(20px, 3.5vw, 52px)', 
                            lineHeight:1.05, textTransform:tt(s,'uppercase') as any, color:chHeadline,
                            overflowWrap: 'break-word'
                        }}>
                            {page.title}
                        </div>
                    </div>
                </div>
            )}

            <div style={{ flex:1, width:'100%', overflow:'hidden', borderTop: !isCont ? `1px solid ${chRule}` : 'none', paddingTop: !isCont ? '3.5%' : '0' }}>
                <ColBody text={page.content} script={s} numCols={2} dropCap={col(s) && !isCont} color={chInkSoft} />
            </div>

            <div style={{ flexShrink:0, marginTop:'auto', paddingTop:'2%' }}>
                <Folio page={page} structure={structure} />
            </div>
        </div>
    );
};

const SimpleTextPage = ({ page, structure, dark = false, isPrint = false }: { page: MagazinePage; structure: MagazineStructure; dark?: boolean; isPrint?: boolean }) => {
    const s = ps(structure, page);
    const isCont = /\(cont\.?\)/i.test(page.title || '');
    const cleanTitle = (page.title || '').replace(/\s*\(cont\.?\)/i, '');
    const chBg       = dark ? '#111009' : '#FAF8F4';
    const chInk      = dark ? '#EDE9E0' : '#1A1814';
    const chInkSoft  = dark ? '#C0BAB0' : '#3D3A34';
    const chHeadline = dark ? '#C49A2C' : '#1A1814';

    return (
        <div className="mc" style={{
            position:'absolute', inset:0, overflow:'hidden',
            display:'flex', flexDirection:'column',
            padding:'1.5% 4% 2.5%', direction:dr(s), 
            background:chBg, color:chInk,
        }}>
            <RunHead left={cleanTitle || structure.title} right={structure.title} />

           {!isCont && cleanTitle && (
                <div style={{
                    fontFamily:'var(--fd)', fontWeight:900,
                    fontSize: isPrint ? '42px' : 'clamp(22px, 4vw, 54px)',
                    lineHeight:1, letterSpacing:ls(s,'-0.01em'),
                    textTransform:tt(s,'uppercase') as any,
                    color:chHeadline, marginBottom:'2.5%', flexShrink:0,
                    textAlign: 'center',
                    overflowWrap: 'break-word'
                }}>{cleanTitle}</div>
            )}

            <div style={{ flex:1, minHeight:0, overflow: 'hidden', width: '100%', paddingTop: isCont ? '1%' : '0' }}>
                <ColBody text={page.content} script={s} numCols={2} dropCap={col(s) && !isCont} color={chInkSoft} />
            </div>

            <div style={{ flexShrink:0, marginTop:'auto', paddingTop:'2%' }}>
                <Folio page={page} structure={structure} />
            </div>
        </div>
    );
};

// EXACT MATCH: Summary Page without RunHead
const SummaryPage = ({ page, structure }: { page: MagazinePage; structure: MagazineStructure }) => {
    const s = ps(structure, page);
    return (
        <div className="mc" style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', padding:'6% 6% 4%', direction:dr(s) }}>
            <div style={{ flexShrink: 0, marginBottom: '4%' }}>
                <div className="kicker" style={{ letterSpacing: ls(s, '0.24em'), textTransform: tt(s, 'uppercase') as any, marginBottom: '1%' }}>Highlights &amp; Takeaways</div>
                <h2 className="hl" style={{ fontSize: 'clamp(28px, 4vw, 46px)', lineHeight: 1.06 }}>{page.title || 'Summary'}</h2>
            </div>
            <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', width: '100%' }}>
                <ColBody text={page.content} script={s} numCols={2} dropCap={false} />
            </div>
            <div style={{ flexShrink: 0, marginTop: '2%', textAlign: 'center' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 24, height: 0.5, background: 'var(--rule)', display: 'block' }} />
                    <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--gold)', display: 'block' }} />
                    <span style={{ width: 24, height: 0.5, background: 'var(--rule)', display: 'block' }} />
                </span>
            </div>
            <div style={{ marginTop: '2%' }}><Folio page={page} structure={structure} /></div>
        </div>
    );
};

const FullImagePage = ({ page, structure }: { page: MagazinePage; structure: MagazineStructure }) => {
    const s = ps(structure, page);
    return (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
            {page.image && <img src={page.image} alt="" crossOrigin="anonymous" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'contrast(1.04) saturate(0.88)' }} />}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,rgba(0,0,0,0.28) 0%,rgba(0,0,0,0.04) 40%,rgba(0,0,0,0.65) 100%)' }} />
            <div className="mc" style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', padding: '5% 7%', direction: dr(s) }}>
                <RunHead left={page.type?.replace(/_/g, ' ') || ''} right={structure.title} light />
                <div style={{ flex: 1 }} />
                {page.title && <h2 className="hl" style={{ fontSize: 'clamp(20px,2.8vw,36px)', color: '#fff', marginBottom: 8, textShadow: '0 1px 12px rgba(0,0,0,0.5)' }}>{page.title}</h2>}
                {page.content && <p style={{ fontFamily: 'var(--fb)', fontStyle: 'italic', color: 'rgba(255,255,255,0.76)', fontSize: 13 }}>{page.content}</p>}
                <div style={{ marginTop: 14 }}><Folio page={page} structure={structure} light /></div>
            </div>
        </div>
    );
};

/* NEW CUSTOM BACK COVER (Magine AI Branded) - FIX: Switched to space-between to guarantee NO cutoff! */
const BackCoverPage = ({ structure, isPrint }: { structure: MagazineStructure; isPrint?: boolean }) => {
    const bgDark = '#061E1A'; 
    const textLight = '#E0EAE8';
    const accentGreen = '#A4D037'; 

    return (
        <div style={{ position: 'absolute', inset: 0, backgroundColor: bgDark, color: textLight, display: 'flex', flexDirection: 'column', padding: '5% 8%', overflow: 'hidden', fontFamily: 'var(--fs)' }}>
            <div style={{ position: 'absolute', right: '-30%', bottom: '-10%', width: '80%', height: '100%', background: 'radial-gradient(ellipse at center, rgba(164, 208, 55, 0.15) 0%, transparent 60%)', pointerEvents: 'none', zIndex: 0 }} />
            <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '50%', opacity: 0.3, backgroundImage: 'radial-gradient(rgba(164, 208, 55, 0.6) 1.5px, transparent 1.5px)', backgroundSize: '20px 20px', maskImage: 'linear-gradient(to left, rgba(0,0,0,1), rgba(0,0,0,0))', zIndex: 0 }} />

            {/* CRITICAL FIX: Using space-between auto-distributes the vertical space perfectly without overflowing! */}
            <div style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                
                <div>
                    <div style={{ fontSize: 'clamp(32px, 5vw, 64px)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1, display: 'flex', alignItems: 'baseline' }}>
                        magine<span style={{ color: accentGreen }}>ai</span>
                    </div>
                    <div style={{ fontSize: 'clamp(8px, 1.1vw, 14px)', letterSpacing: '0.45em', textTransform: 'uppercase', fontWeight: 500, paddingLeft: '4px', opacity: 0.9, marginTop: '2px' }}>
                        Magazine
                    </div>
                </div>

                <div>
                    <div style={{ width: '30px', height: '2px', background: accentGreen, marginBottom: '8px' }} />
                    <h2 style={{ fontSize: 'clamp(16px, 2.2vw, 32px)', fontWeight: 700, margin: 0, letterSpacing: '0.02em', lineHeight: 1.3, color: '#ffffff' }}>
                        IMAGINE THE FUTURE.<br/>
                        <span style={{ color: accentGreen }}>BUILD INTELLIGENTLY.</span>
                    </h2>
                </div>

                <p style={{ width: '85%', fontSize: 'clamp(10px, 1.3vw, 16px)', lineHeight: 1.5, opacity: 0.9, margin: 0, fontWeight: 300, color: '#ffffff' }}>
                    Magine AI Magazine is your guide to the ideas, innovations, and leaders shaping our AI-powered world. From breakthrough research and real-world applications to ethical insights and visionary perspectives—we explore the future so you can help create it.
                </p>

                <div style={{ display: 'flex', gap: '3%', width: '90%' }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.15)', paddingRight: '2%' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke={accentGreen} strokeWidth="1.5" style={{ width: 'clamp(24px, 3vw, 40px)', marginBottom: '8px' }}>
                            <path d="M12 2a5 5 0 0 0-5 5c0 1.5 1 2.5 1 4a1 1 0 0 1-1 1H6a2 2 0 0 1-2-2V8c0-3.5 3-6 6-6zm0 0a5 5 0 0 1 5 5c0 1.5-1 2.5-1 4a1 1 0 0 0 1 1h1a2 2 0 0 0 2-2V8c0-3.5-3-6-6-6zM12 12v10M9 16h6M9 20h6"/>
                        </svg>
                        <div style={{ color: accentGreen, fontWeight: 700, fontSize: 'clamp(8px, 1vw, 13px)', letterSpacing: '0.05em', marginBottom: '4px' }}>INSIGHTS</div>
                        <div style={{ fontSize: 'clamp(8px, 0.9vw, 11px)', opacity: 0.85, lineHeight: 1.4 }}>In-depth analysis on the trends and ideas shaping AI.</div>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.15)', paddingRight: '2%' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke={accentGreen} strokeWidth="1.5" style={{ width: 'clamp(24px, 3vw, 40px)', marginBottom: '8px' }}>
                            <path d="M9 18h6M10 22h4M12 2v1M12 7v1M6 12h1M17 12h1M7.5 6.5l.5.5M16.5 6.5l-.5.5M12 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
                        </svg>
                        <div style={{ color: accentGreen, fontWeight: 700, fontSize: 'clamp(8px, 1vw, 13px)', letterSpacing: '0.05em', marginBottom: '4px' }}>INNOVATION</div>
                        <div style={{ fontSize: 'clamp(8px, 0.9vw, 11px)', opacity: 0.85, lineHeight: 1.4 }}>Discover groundbreaking technologies and real-world applications.</div>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.15)', paddingRight: '2%' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke={accentGreen} strokeWidth="1.5" style={{ width: 'clamp(24px, 3vw, 40px)', marginBottom: '8px' }}>
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
                        </svg>
                        <div style={{ color: accentGreen, fontWeight: 700, fontSize: 'clamp(8px, 1vw, 13px)', letterSpacing: '0.05em', marginBottom: '4px' }}>LEADERS</div>
                        <div style={{ fontSize: 'clamp(8px, 0.9vw, 11px)', opacity: 0.85, lineHeight: 1.4 }}>Conversations with visionaries driving change.</div>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke={accentGreen} strokeWidth="1.5" style={{ width: 'clamp(24px, 3vw, 40px)', marginBottom: '8px' }}>
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/>
                        </svg>
                        <div style={{ color: accentGreen, fontWeight: 700, fontSize: 'clamp(8px, 1vw, 13px)', letterSpacing: '0.05em', marginBottom: '4px' }}>ETHICS</div>
                        <div style={{ fontSize: 'clamp(8px, 0.9vw, 11px)', opacity: 0.85, lineHeight: 1.4 }}>Exploring the responsible development of AI for everyone.</div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '15px' }}>
                    <div style={{ width: '3px', background: accentGreen }} />
                    <div>
                        <div style={{ color: accentGreen, fontSize: 'clamp(28px, 4vw, 50px)', fontFamily: 'var(--fd)', lineHeight: 0.8, marginBottom: '5px' }}>“</div>
                        <div style={{ fontSize: 'clamp(12px, 1.6vw, 24px)', fontWeight: 300, lineHeight: 1.4, marginBottom: '10px', color: '#ffffff' }}>
                            The future isn't something<br/>
                            we enter. It's something<br/>
                            we <span style={{ color: accentGreen, fontWeight: 600 }}>magine—together.</span>
                        </div>
                        <div style={{ fontSize: 'clamp(11px, 1.4vw, 20px)', opacity: 0.9, color: '#ffffff' }}>Join the conversation.</div>
                        <div style={{ color: accentGreen, fontWeight: 600, fontSize: 'clamp(11px, 1.4vw, 20px)' }}>magineai.live</div>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <div style={{ width: '30px', height: '2px', background: accentGreen, marginBottom: '8px' }} />
                        <div style={{ fontSize: 'clamp(8px, 0.9vw, 12px)', letterSpacing: '0.2em', marginBottom: '10px', fontWeight: 600 }}>FOLLOW US</div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', fontSize: 'clamp(9px, 1.1vw, 14px)', opacity: 0.9 }}>
                            <div style={{ width: 'clamp(18px, 2vw, 28px)', height: 'clamp(18px, 2vw, 28px)', border: `1.5px solid ${accentGreen}`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: accentGreen, fontSize: 'clamp(9px, 1.1vw, 14px)', fontWeight: 600 }}>X</div>
                            <div>@magineai_mag</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', fontSize: 'clamp(9px, 1.1vw, 14px)', opacity: 0.9 }}>
                            <div style={{ width: 'clamp(18px, 2vw, 28px)', height: 'clamp(18px, 2vw, 28px)', border: `1.5px solid ${accentGreen}`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: accentGreen, fontSize: 'clamp(9px, 1.1vw, 14px)', fontWeight: 600 }}>in</div>
                            <div>Magine AI Magazine</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', fontSize: 'clamp(9px, 1.1vw, 14px)', opacity: 0.9 }}>
                            <div style={{ width: 'clamp(18px, 2vw, 28px)', height: 'clamp(18px, 2vw, 28px)', border: `1.5px solid ${accentGreen}`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: accentGreen }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '50%' }}><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                            </div>
                            <div>@magineai.mag</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: 'clamp(9px, 1.1vw, 14px)', opacity: 0.9 }}>
                            <div style={{ width: 'clamp(18px, 2vw, 28px)', height: 'clamp(18px, 2vw, 28px)', border: `1.5px solid ${accentGreen}`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: accentGreen, fontSize: 'clamp(11px, 1.3vw, 16px)', fontWeight: 600 }}>f</div>
                            <div>Magine AI Magazine</div>
                        </div>
                    </div>

                    <div style={{ background: '#fff', padding: '8px 12px', borderRadius: '4px', color: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ fontSize: 'clamp(8px, 1vw, 12px)', fontWeight: 600, marginBottom: '4px', alignSelf: 'flex-start' }}>ISSN 2997-1296</div>
                        <div style={{ display: 'flex', alignItems: 'flex-end', height: 'clamp(25px, 3.5vw, 50px)', gap: '2px', marginBottom: '4px' }}>
                            {[3,1,2,4,1,3,2,1,5,2,1,2,3,1,4,2,1,3,2,1,2,4].map((w, i) => <div key={i} style={{ width: `${w * 1.5}px`, height: '100%', background: '#000' }} />)}
                            <div style={{ fontSize: 'clamp(9px, 1.1vw, 14px)', fontWeight: 500, paddingLeft: '6px' }}>24 &gt;</div>
                        </div>
                        <div style={{ fontSize: 'clamp(10px, 1.2vw, 16px)', fontWeight: 600, letterSpacing: '0.1em' }}>9 772997 129006</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

/* ── MAIN EXPORT ──────────────────────────────────────────────────────────── */
export function MagazinePageRenderer({ page, structure, renderMode = 'screen' }: MagazinePageRendererProps) {
    const isPrint = renderMode === 'print';
    const isBack = page.type === 'BACK_COVER';
    const isChapter = !['COVER','CONTENTS','EDITOR_NOTE','INTRODUCTION','BACK_COVER','SUMMARY'].includes(page.type || '') || page.layout === 'image-left' || page.layout === 'image-right' || page.layout === 'image-top' || page.layout === 'image-bottom' || page.layout === 'simple-text';
    const dark = useDarkMode();
    const chapterBg = dark ? '#111009' : '#FAF8F4';

    useEffect(() => {
        const fontId = 'magineai-fonts';
        if (!document.getElementById(fontId)) {
            const link = document.createElement('link');
            link.id = fontId; link.rel = 'stylesheet';
            link.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,900;1,400;1,600&family=EB+Garamond:ital,wght@0,400;0,500;1,400;1,500&family=Karla:wght@300;400;500;600&display=swap';
            document.head.appendChild(link);
        }
        const styleId = 'magineai-styles';
        if (!document.getElementById(styleId)) {
            const el = document.createElement('style');
            el.id = styleId; el.textContent = GLOBAL_CSS;
            document.head.appendChild(el);
        }
    }, []);

    const layout = page.layout || 'simple-text';

    const renderPage = () => {
        switch (page.type) {
            case 'COVER':        return <CoverPage page={page} structure={structure} />;
            case 'CONTENTS':     return <ContentsPage page={page} structure={structure} />;
            case 'EDITOR_NOTE':  return <EditorNotePage page={page} structure={structure} />;
            case 'INTRODUCTION': return <IntroductionPage page={page} structure={structure} />;
            case 'BACK_COVER':   return <BackCoverPage structure={structure} />;
            case 'SUMMARY':      return <SummaryPage page={page} structure={structure} />;
        }
        if (layout === 'full-image')  return <FullImagePage page={page} structure={structure} />;
        if (layout === 'image-left')  return <ImageSidePage page={page} structure={structure} imageLeft dark={dark} isPrint={isPrint} />;
        if (layout === 'image-right') return <ImageSidePage page={page} structure={structure} imageLeft={false} dark={dark} isPrint={isPrint} />;
        if (layout === 'image-top' || layout === 'image-bottom') return <ChapterPage page={page} structure={structure} dark={dark} isPrint={isPrint} />;
        return <SimpleTextPage page={page} structure={structure} dark={dark} isPrint={isPrint} />;
    };

    return (
        <div
            className={`mag-page${isBack ? ' mag-back' : ''}${isChapter ? ' mag-chapter' : ''}${isPrint ? ' mag-print' : ''}`}
            style={isPrint
                ? { position: 'relative', width: 1200, height: 1600, overflow: 'hidden' }
                : {
                    position: 'absolute', inset: 0, overflow: 'hidden',
                    ...(isChapter && !isBack ? { background: chapterBg } : {}),
                  }
            }
        >
            {renderPage()}
        </div>
    );
}

export default MagazinePageRenderer;