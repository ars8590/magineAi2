import { GoogleGenerativeAI } from '@google/generative-ai';
import { GenerationRequest, MagazinePage, MagazineStructure } from '../types';
import { config } from '../config';
import crypto from 'crypto';
import { findCachedContent } from './storage';

const baseUnsafePatterns = [/violence/i, /hate/i, /nudity/i, /explicit/i, /nsfw/i, /gore/i];
const strictUnsafePatterns = [...baseUnsafePatterns, /weapon/i, /blood/i, /death/i, /kill/i, /murder/i, /swear/i];

export function getUnsafePatterns(strict: boolean = false) {
  return strict ? strictUnsafePatterns : baseUnsafePatterns;
}

export function generatePromptHash(input: GenerationRequest): string {
  const norm = `${input.theme}|${input.genre}|${input.keywords}|${input.language}|${input.age}|${input.contentType || 'story'}|${input.strictModeration || false}`.toLowerCase().replace(/\s+/g, '');
  return crypto.createHash('sha256').update(norm).digest('hex');
}

// Initialize Gemini AI client
let genAI: GoogleGenerativeAI | null = null;

function getGenAI() {
  if (!genAI) {
    if (!config.geminiApiKey) {
      throw new Error('GEMINI_API_KEY is not set in environment variables');
    }
    genAI = new GoogleGenerativeAI(config.geminiApiKey);
  }
  return genAI;
}

// Helper to safely truncate text to a max word count without cutting mid-sentence
function truncateToSentence(text: string, maxWords: number): string {
  if (!text) return "";
  let words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return text;
  
  let truncatedStr = words.slice(0, maxWords).join(' ');
  const lastPunc = Math.max(truncatedStr.lastIndexOf('.'), truncatedStr.lastIndexOf('!'), truncatedStr.lastIndexOf('?'));
  
  if (lastPunc > 0) {
      return truncatedStr.substring(0, lastPunc + 1); 
  } else {
      return truncatedStr + '.'; 
  }
}

// --- Google Imagen API Integration ---
async function generateImageWithImagen(prompt: string, apiKey: string): Promise<string | null> {
  try {
    // Reverted back to the standard Imagen 4 model fully supported on the free tier!
   const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-004:predict?key=${apiKey}`;
    const safePrompt = prompt.substring(0, 480);
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instances: [{ prompt: safePrompt }],
        parameters: { 
          sampleCount: 1,
          aspectRatio: "3:4" // Perfect vertical magazine ratio
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Imagen API Error:", response.status, errorText);
      return null;
    }

    const data = await response.json();
    if (data.predictions && data.predictions[0] && data.predictions[0].bytesBase64Encoded) {
      return `data:image/png;base64,${data.predictions[0].bytesBase64Encoded}`;
    }
    return null;
  } catch (err) {
    console.error("Imagen fetch failed:", err);
    return null;
  }
}

export async function generateStory(input: GenerationRequest): Promise<any> {
  const promptHash = generatePromptHash(input);
  const cached = await findCachedContent(promptHash);

  if (cached) {
    console.log('Cache hit for prompt:', promptHash);
    return {
      title: cached.title,
      introduction: cached.introduction,
      main_story: cached.main_story,
      character_highlights: cached.character_highlights,
      conclusion: cached.conclusion,
      images: cached.image_urls || [],
      isCached: true,
      tokenCost: 0,
      promptHash
    };
  }

  const isStrict = input.strictModeration || input.age < 13;
  const currentUnsafePatterns = getUnsafePatterns(isStrict);
  const combinedInput = `${input.theme} ${input.genre} ${input.keywords}`;
  if (currentUnsafePatterns.some(p => p.test(combinedInput))) {
    throw new Error('Content rejected by pre-generation safety filters.');
  }

  const genAI = getGenAI();
  const model = genAI.getGenerativeModel({
    model: 'models/gemini-2.5-flash',
    generationConfig: {
      maxOutputTokens: 65536,
      temperature: 0.7,
      responseMimeType: 'application/json',
    }
  }, { timeout: 120000 }); 

  // --- DYNAMIC TARGET CALCULATION ---
  const totalRequestedPages = Math.max(5, input.pages || 10);
  const hasFrontMatter = totalRequestedPages >= 8;
  const fixedPageCount = hasFrontMatter ? 6 : 4; 
  const availableChapterSlots = Math.max(1, totalRequestedPages - fixedPageCount);

 const reqLang = (input.language || 'english').toLowerCase(); 
const isDenseLanguage = ['malayalam', 'hindi', 'tamil', 'telugu', 'bengali', 'marathi', 'kannada', 'gujarati', 'german', 'russian', 'arabic'].some(l => reqLang.includes(l));
  
  const numArticles = isDenseLanguage 
  ? Math.max(1, Math.round(availableChapterSlots / 3))
  : Math.max(1, Math.round(availableChapterSlots / 2));
  const avgPagesPerArticle = availableChapterSlots / numArticles;

  
  
  // FIX: Detect heavily agglutinative/compounded languages where 1 word = 3 English words
  

  // DRASTICALLY slashed limits for dense languages so they don't visually overflow
 const firstPageCapacity = isDenseLanguage ? 60 : 340;
const contPageCapacity = isDenseLanguage ? 120 : 650;
  // Frontend limits for Intro/Summary
  const introMax = isDenseLanguage ? 25 : 50;
  const editorMax = isDenseLanguage ? 35 : 75;
  const summaryMax = isDenseLanguage ? 40 : 85;

  const targetWordsPerArticle = Math.floor(firstPageCapacity + Math.max(0, avgPagesPerArticle - 1) * contPageCapacity);
  
  const contentPrompt = `You are the Editor-in-Chief of a premium magazine.
  
  Create a REAL MAGAZINE (not a book) about the theme: "${input.theme}"
  Language: ${input.language || 'English'} | Audience age: ${input.age} | Genre: ${input.genre}
  ${input.keywords ? `Keywords to include: ${input.keywords}` : ''}
  
  A REAL MAGAZINE has:
  - Multiple DIFFERENT articles (not chapters of one story)
  - Each article covers a DIFFERENT angle, subtopic, or format
  - Variety: mix of feature articles, how-to guides, interviews, profiles, listicles, opinion pieces
  - Each article is SELF-CONTAINED — a reader can read any article independently
  - Visual descriptions for photography/illustration
  
  Generate exactly ${numArticles} DISTINCT articles. Each article must:
  - Have a UNIQUE angle on "${input.theme}" (not continuation of another)
  - Be written in an appropriate style for age ${input.age} and ${input.genre} genre
  - Feel like it belongs in a real ${input.genre} magazine

  CRITICAL LENGTH RULES TO PREVENT TEXT CLIPPING IN THE BROWSER PREVIEW:
  - KEEP TITLES SHORT: All Article and Chapter Titles MUST be 2-5 words maximum. Do not write long titles.
  - Editor's Note MUST be EXACTLY ${editorMax - 10}-${editorMax} words. Do not exceed ${editorMax} words.
  - Introduction MUST be EXACTLY ${introMax - 10}-${introMax} words. Do not exceed ${introMax} words because it shares physical space with a massive image and huge headline.
  - Summary MUST be EXACTLY ${summaryMax - 10}-${summaryMax} words. Do not exceed ${summaryMax} words.
  - Chapter articles MUST be extremely detailed and verbose. Write EXACTLY around ${targetWordsPerArticle} words each to completely fill their pages.
  
  Article type variety (use a mix):
  ${input.contentType === 'story' ? '- Short fiction, narrative feature, character profile, adventure report' :
    input.contentType === 'poem' ? '- Poem, lyric essay, imagery piece, illustrated verse' :
    input.contentType === 'article' ? '- Feature article, explainer, interview, listicle, opinion' :
    '- Profile, timeline, memoir excerpt, legacy piece'}
  
  RETURN ONLY VALID JSON:
  {
    "cover": { 
      "title": "Magazine name related to ${input.theme} (in ${input.language || 'English'})",
      "tagline": "Exciting cover line that makes you want to read (in ${input.language || 'English'})",
      "image_prompt": "Vivid cover photo description in English"
    },
    "editors_note": { 
      "title": "Editor's welcome message title (in ${input.language || 'English'})",
      "content": "Warm welcome from the editor. (STRICT LIMIT: ${editorMax} words max)."
    },
    "introduction": { 
      "title": "Issue introduction article title (Short, in ${input.language || 'English'})",
      "content": "Introduction setting the scene. (STRICT LIMIT: ${introMax} words max to fit next to massive image).",
      "image_prompt": "Compelling opening spread photo description in English"
    },
    "chapters": [
      { 
        "title": "Article title (Short, punchy, 2-5 words in ${input.language || 'English'})",
        "content": "Write EXACTLY ${targetWordsPerArticle} words. (STRICT LIMIT: Provide massive detail to fill the layout gaps).",
        "image_prompt": "Specific photo or illustration description for this article in English"
      }
    ],
    "summary": { 
      "title": "Short summary title like 'Highlights' or 'What We Covered' (in ${input.language || 'English'})",
      "content": "Recap highlighting the best bits. (STRICT LIMIT: ${summaryMax} words max)."
    }
  }
  
  Layout Notes: 'image_prompt' must be English visual descriptions.
  IMPORTANT: Write full narrative arcs. Do not end mid-sentence.`;

  let magazine: MagazineStructure;
  const finalPages: MagazinePage[] = [];

  try {
    console.log(`Generating full magazine content... Targeting ${totalRequestedPages} total pages.`);
    
    let result: any;
    const delays = [1000, 2000, 4000, 8000, 16000];
    let lastError: any;

    for (let i = 0; i <= delays.length; i++) {
      try {
        result = await model.generateContent(contentPrompt);
        break; 
      } catch (error) {
        lastError = error;
        if (i < delays.length) {
          await new Promise(resolve => setTimeout(resolve, delays[i]));
        }
      }
    }

    if (!result) {
      throw new Error("Unable to connect to the AI service after multiple attempts. Please check your connection and try again.");
    }

    let rawText = result.response.text().trim();
    console.log('Raw response length:', rawText.length, 'chars. First 200:', rawText.substring(0, 200));

    const firstBrace = rawText.indexOf('{');
    let lastBrace = rawText.lastIndexOf('}');
    
    if (firstBrace === -1) {
        throw new Error('No valid JSON object bounds found in Gemini response');
    }

    let jsonStr = (lastBrace !== -1 && lastBrace >= firstBrace)
        ? rawText.substring(firstBrace, lastBrace + 1)
        : rawText.substring(firstBrace);

    let cleanedJson = '';
    let inString = false;
    let isEscaped = false;
    for (let i = 0; i < jsonStr.length; i++) {
        const char = jsonStr[i];
        if (inString) {
            if (char === '\\') {
                isEscaped = !isEscaped;
                cleanedJson += char;
            } else if (char === '"' && !isEscaped) {
                inString = false;
                cleanedJson += char;
            } else if (char === '\n') {
                cleanedJson += '\\n';
                isEscaped = false;
            } else if (char === '\r') {
                cleanedJson += '\\r';
                isEscaped = false;
            } else if (char === '\t') {
                cleanedJson += '\\t';
                isEscaped = false;
            } else {
                cleanedJson += char;
                isEscaped = false;
            }
        } else {
            if (char === '"') {
                inString = true;
            }
            cleanedJson += char;
        }
    }
    
    cleanedJson = cleanedJson.replace(/,\s*([}\]])/g, '$1');
    jsonStr = cleanedJson;

    let genData: any;
    try {
      genData = JSON.parse(jsonStr);
    } catch (parseErr) {
      console.warn('Initial JSON parse failed, attempting robust truncation recovery...');
      try {
          const lastGoodEnd = jsonStr.lastIndexOf('"}');
          if (lastGoodEnd !== -1) {
              let truncated = jsonStr.substring(0, lastGoodEnd + 2);
              
              const openBraces = (truncated.match(/\{/g) || []).length;
              const closeBraces = (truncated.match(/\}/g) || []).length;
              const openBrackets = (truncated.match(/\[/g) || []).length;
              const closeBrackets = (truncated.match(/\]/g) || []).length;
              
              if (openBrackets > closeBrackets) {
                  truncated += ']';
              }
              for (let i = 0; i < openBraces - closeBraces; i++) {
                  truncated += '}';
              }
              genData = JSON.parse(truncated);
          } else {
              throw parseErr;
          }
      } catch (finalErr) {
          throw new Error('Could not parse generated JSON even after recovery attempts.');
      }
    }

    if (genData.editors_note) {
        genData.editors_note.content = truncateToSentence(genData.editors_note.content, editorMax + 5);
    }
    if (genData.introduction) {
        genData.introduction.content = truncateToSentence(genData.introduction.content, introMax + 5);
    }
    if (genData.summary) {
        genData.summary.content = truncateToSentence(genData.summary.content, summaryMax + 5);
    }

    let pageNum = 1;

    // 1. Cover
    finalPages.push({
      pageNumber: pageNum++,
      type: 'COVER',
      title: genData.cover?.title || `${input.theme} Magazine`,
      content: genData.cover?.tagline || "",
      imagePrompt: genData.cover?.image_prompt,
      layout: 'full-image'
    });

    // 2. Editor's Note & TOC
    if (hasFrontMatter) {
      finalPages.push({
        pageNumber: pageNum++,
        type: 'EDITOR_NOTE',
        title: genData.editors_note?.title || "Editor's Note",
        content: genData.editors_note?.content || "",
        layout: 'simple-text'
      });
      finalPages.push({
        pageNumber: pageNum++,
        type: 'CONTENTS',
        title: "Contents",
        content: "[]",
        layout: 'simple-text'
      });
    }

    // 3. Introduction
    finalPages.push({
      pageNumber: pageNum++,
      type: 'INTRODUCTION',
      title: genData.introduction?.title || "Introduction",
      content: genData.introduction?.content || "",
      imagePrompt: genData.introduction?.image_prompt,
      layout: 'image-top'
    });

    // 4. CHAPTERS
    const generatedChapters = genData.chapters || [];
    const tocItems: { page: number, title: string }[] = [];

    const toleranceBuffer = Math.floor(contPageCapacity * 0.20);
    const absoluteMaxWords = targetWordsPerArticle + toleranceBuffer;

    for (let i = 0; i < generatedChapters.length; i++) {
      const chapter = generatedChapters[i];

      let words = (chapter.content || '').trim().split(/\s+/);
      
      if (words.length > absoluteMaxWords) {
        words = truncateToSentence(chapter.content || '', absoluteMaxWords).split(/\s+/);
      }

      let wIdx = 0;
      let isFirstPage = true;

      while (wIdx < words.length) {
        const limit = isFirstPage ? firstPageCapacity : contPageCapacity;
        const TOLERANCE = Math.floor(limit * 0.15); 

        let end = Math.min(wIdx + limit, words.length);

        if (words.length - end <= TOLERANCE) {
          end = words.length;
        }

        const chunkText = words.slice(wIdx, end).join(' ');
        const isContinuation = !isFirstPage;

        finalPages.push({
          pageNumber: pageNum++,
          type: 'CHAPTER',
          chapterNumber: i + 1,
          title: isContinuation ? `${chapter.title} (Cont.)` : chapter.title,
          content: chunkText,
          imagePrompt: isContinuation ? undefined : chapter.image_prompt,
          layout: isContinuation ? 'simple-text' : (i % 2 === 0 ? 'image-right' : 'image-left')
        });

        if (isFirstPage) {
          tocItems.push({ page: pageNum - 1, title: chapter.title });
        }

        wIdx = end;
        isFirstPage = false; 
      }
    }

    // 5. Summary
    if (genData.summary) {
      finalPages.push({
        pageNumber: pageNum++,
        type: 'SUMMARY',
        title: genData.summary.title || "Summary",
        content: genData.summary.content || "",
        layout: 'simple-text'
      });
    }

    // 6. Back Cover
    finalPages.push({
      pageNumber: pageNum++,
      type: 'BACK_COVER',
      title: genData.cover?.title || `${input.theme} Magazine`,
      layout: 'full-image'
    });

    const tocPage = finalPages.find(p => p.type === 'CONTENTS');
    if (tocPage) {
      tocPage.content = JSON.stringify(tocItems);
    }

    // --- IMAGEN INTEGRATION: BATCHED GENERATION ---
    console.log("Generating AI Artwork via Imagen 4 (Batched)...");
    const globalStylePrefix = `High-end editorial magazine photography/illustration. Genre: ${input.genre}. Theme: ${input.theme}. `;
    
    // Grab all pages that need custom images
    const pagesNeedingImages = finalPages.filter(p => p.type !== 'BACK_COVER' && p.type !== 'CONTENTS' && p.imagePrompt);
    
    // Adjusted batch size to 3: The sweet spot for speed without hitting free-tier Rate Limits
    const BATCH_SIZE = 3; 

    for (let i = 0; i < pagesNeedingImages.length; i += BATCH_SIZE) {
      const batch = pagesNeedingImages.slice(i, i + BATCH_SIZE);
      
      await Promise.all(batch.map(async (page) => {
        console.log(`Creating image for Page ${page.pageNumber}...`);
        const enhancedPrompt = globalStylePrefix + page.imagePrompt;
        
        const base64Image = await generateImageWithImagen(enhancedPrompt, config.imagenApiKey!);
        if (base64Image) {
          page.image = base64Image;
        } else {
          console.warn(`Imagen failed for page ${page.pageNumber}, using fallback.`);
          const seed = (page.title || input.theme).replace(/[^a-z0-9]/gi, '-');
          page.image = `https://picsum.photos/seed/${seed}/800/1200`;
        }
      }));

      // Adjusted delay to 2 seconds to safely respect the standard model's limits
      if (i + BATCH_SIZE < pagesNeedingImages.length) {
        console.log("Waiting 2 seconds to respect API rate limits...");
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // Assign dummy images to any remaining non-prompted pages just in case
    for (const page of finalPages) {
      if (page.type === 'BACK_COVER' || page.type === 'CONTENTS') continue;
      if (!page.image) {
        const seed = (page.title || input.theme).replace(/[^a-z0-9]/gi, '-');
        page.image = `https://picsum.photos/seed/${seed}/800/1200`;
      }
    }
    
    console.log("All artwork successfully generated.");

    magazine = {
      title: genData.cover?.title || `${input.theme} Magazine`,
      totalPages: finalPages.length,
      pages: finalPages
    };

  } catch (error) {
    console.error("Failed to generate content:", error);
    magazine = {
      title: "Fallback Generation",
      totalPages: 1,
      pages: [{ pageNumber: 1, type: 'COVER', title: 'Error', content: 'Generation failed.' }]
    };
  }

  const intro = magazine.pages.find(p => p.type === 'INTRODUCTION');
  const sum = magazine.pages.find(p => p.type === 'SUMMARY');

  return {
    title: magazine.title,
    introduction: intro?.content || "",
    main_story: JSON.stringify(magazine),
    character_highlights: sum?.content || "",
    conclusion: "End",
    images: magazine.pages.map(p => p.image || ""),
    isCached: false,
    promptHash: promptHash,
    tokenCost: Math.floor(JSON.stringify(magazine).length / 4) + 150
  };
}

export async function generateImages(input: GenerationRequest) {
  return [];
}

export function isUnsafe(text: string, strict: boolean = false) {
  return getUnsafePatterns(strict).some((pattern) => pattern.test(text));
}

export async function moderateOutput(sections: Record<string, string>, retries = 2, strict = false) {
  const unsafe = Object.values(sections).some((s) => isUnsafe(s || '', strict));
  if (unsafe) throw new Error('Content rejected. Please revise your inputs.');
  return sections;
}