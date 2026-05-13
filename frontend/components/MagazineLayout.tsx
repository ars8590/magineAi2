import Image from 'next/image';
import { GeneratedContent } from '../types';
import { GlassCard } from './GlassCard';

type Props = {
  content: GeneratedContent;
};

export function MagazineLayout({ content }: Props) {
  // Ensure we have content with fallbacks
  const title = content?.title || 'Untitled Story';
  const introduction = content?.introduction || '';
  const mainStory = content?.mainStory || '';
  const characterHighlights = content?.characterHighlights || '';
  const conclusion = content?.conclusion || '';
  const images = content?.images || [];

  let mainBodyLabel = 'Main Story';
  let highlightsLabel = 'Characters';
  let conclusionLabel = 'Moral & Wrap-up';

  if (content?.content_type === 'poem') {
    mainBodyLabel = 'Poem';
    highlightsLabel = 'Themes & Imagery';
    conclusionLabel = 'Meaning';
  } else if (content?.content_type === 'article') {
    mainBodyLabel = 'Article Body';
    highlightsLabel = 'Key Highlights';
    conclusionLabel = 'Summary';
  } else if (content?.content_type === 'biography') {
    mainBodyLabel = 'Biography';
    highlightsLabel = 'Major Achievements';
    conclusionLabel = 'Legacy';
  }

  return (
    <div className="space-y-6" style={{ minHeight: '400px' }}>
      <GlassCard className="relative overflow-hidden bg-gradient-to-br from-white/10 via-white/5 to-brand-500/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(91,107,255,0.25),transparent_30%)]" />
        <div className="relative space-y-4">
          <p className="text-xs uppercase tracking-[0.3em] text-brand-200">MagineAI Issue</p>
          <h1 className="text-3xl font-bold text-white lg:text-4xl">{title}</h1>
          {introduction && <p className="text-base text-white/80">{introduction}</p>}
        </div>
      </GlassCard>

      <div className="magazine-grid">
        {mainStory && (
          <section className="break-inside-avoid pb-6">
            <GlassCard className="h-full space-y-3">
              <h2 className="text-xl font-semibold text-brand-100">{mainBodyLabel}</h2>
              <p className="text-white/80 leading-relaxed whitespace-pre-wrap">{mainStory}</p>
            </GlassCard>
          </section>
        )}

        {characterHighlights && (
          <section className="break-inside-avoid pb-6">
            <GlassCard className="h-full space-y-3">
              <h2 className="text-xl font-semibold text-brand-100">{highlightsLabel}</h2>
              <p className="text-white/80 leading-relaxed whitespace-pre-wrap">{characterHighlights}</p>
            </GlassCard>
          </section>
        )}

        {conclusion && (
          <section className="break-inside-avoid pb-6">
            <GlassCard className="h-full space-y-3">
              <h2 className="text-xl font-semibold text-brand-100">{conclusionLabel}</h2>
              <p className="text-white/80 leading-relaxed whitespace-pre-wrap">{conclusion}</p>
            </GlassCard>
          </section>
        )}
      </div>

      {images.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {images.map((url, idx) => (
            <GlassCard key={`${url}-${idx}`} className="overflow-hidden p-0">
              <div className="relative aspect-[4/3] w-full">
                <Image
                  src={url}
                  alt={`Generated art ${idx + 1}`}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}

