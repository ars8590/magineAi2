import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import type { GeneratedContent, MagazineStructure, MagazinePage } from '../types';

// Load image and convert to base64 (for legacy fallback)
function loadImageAsDataUrl(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      } else {
        reject(new Error('Could not get canvas context'));
      }
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = url;
  });
}

// Split text into lines that fit within width (for legacy fallback)
function splitTextIntoLines(pdf: jsPDF, text: string, maxWidth: number, fontSize: number): string[] {
  const originalSize = pdf.getFontSize();
  pdf.setFontSize(fontSize);
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  words.forEach((word) => {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = pdf.getTextWidth(testLine);
    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  });
  if (currentLine) {
    lines.push(currentLine);
  }
  pdf.setFontSize(originalSize);
  return lines;
}

// ── HIGH FIDELITY MAGAZINE CAPTURE (For New Generations) ─────────────────
export async function exportMultiPageToPdf(elementIds: string[], fileName = 'magineai-magazine.pdf') {
  // Create a PDF with custom dimensions matching our 3:4 print layout (1200x1600 pixels)
  // This completely eliminates white borders and aspect ratio mismatches!
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'px',
    format: [1200, 1600]
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // Await fonts to ensure Playfair Display and Garamond are fully loaded
  await document.fonts.ready;

  let pagesAdded = 0;

  for (let i = 0; i < elementIds.length; i++) {
    const element = document.getElementById(elementIds[i]);
    if (!element) continue;

    try {
      // Give images a tiny moment to ensure they are fully painted in the DOM
      await new Promise(resolve => setTimeout(resolve, 150));

      const canvas = await html2canvas(element, {
        scale: 2, // 2x scale for crisp retina text and images
        useCORS: true,
        logging: false,
        backgroundColor: null, // Allow it to naturally pick up the magazine's cream or dark background!
        width: 1200,
        height: 1600,
        onclone: (documentClone) => {
          // 1. UNHIDE THE PRINT CONTAINER
          // The container in page.tsx has opacity: 0 and left: 200vw. We must bring it into view for the camera!
          const clonedElement = documentClone.getElementById(elementIds[i]);
          if (clonedElement && clonedElement.parentElement) {
            const printWrapper = clonedElement.parentElement;
            printWrapper.style.opacity = '1';
            printWrapper.style.position = 'absolute';
            printWrapper.style.left = '0px';
            printWrapper.style.top = '0px';
          }

          // 2. FIX HTML2CANVAS MULTI-COLUMN BUG
          // html2canvas completely ignores CSS 'column-count'. We must convert it to Flexbox manually!
          const bodyCols = documentClone.querySelectorAll('.body-col');
          for (let j = 0; j < bodyCols.length; j++) {
            const col = bodyCols[j] as HTMLElement;
            const styleStr = col.getAttribute('style') || '';
            
            // Check if this container is supposed to have 2 columns
            if (styleStr.includes('column-count: 2') || styleStr.includes('columns: 2')) {
              
              // Extract the drop cap if it exists
              const dropCap = col.querySelector('.dc');
              let dropCapHtml = '';
              if (dropCap) {
                dropCapHtml = dropCap.outerHTML;
                dropCap.remove();
              }
              
              // Extract text and split mathematically by words
              const words = col.innerHTML.trim().split(/\s+/).filter(w => w.length > 0);
              const mid = Math.ceil(words.length / 2);
              
              const leftWords = words.slice(0, mid).join(' ');
              const rightWords = words.slice(mid).join(' ');
              
              // Convert to Flexbox to emulate columns perfectly for html2canvas
              col.style.display = 'flex';
              col.style.flexDirection = 'row';
              col.style.gap = '0'; // We use padding below instead to center the border perfectly
              col.style.columnCount = '';
              col.style.columns = '';
              
              col.innerHTML = `
                <div style="flex: 1; text-align: justify; border-right: 1px solid var(--rule, #C8C4BC); padding-right: 1.25rem; height: 100%;">
                  ${dropCapHtml}${leftWords}
                </div>
                <div style="flex: 1; text-align: justify; padding-left: 1.25rem; height: 100%;">
                  ${rightWords}
                </div>
              `;
            }
          }

          // 3. ADJUST FONT SIZE FOR PDF ONLY
          // Inject custom CSS into the cloned document. This changes the PDF without affecting the web view.
          const pdfStyle = documentClone.createElement('style');
          pdfStyle.innerHTML = `
            .body-col {
              font-size: 17px !important; /* Set your desired PDF body font size here */
              line-height: 1.7 !important;
            }
            .hl {
              font-size: 42px !important; /* Set your desired PDF headline font size here */
            }
            .deck {
              font-size: 18px !important; /* Set your desired PDF subtitle/deck font size here */
            }
          `;
          documentClone.head.appendChild(pdfStyle);
        }
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);

      if (pagesAdded > 0) {
        pdf.addPage([1200, 1600], 'portrait');
      }

      // Draw the image perfectly filling the exact 1200x1600 canvas
      pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight);
      pagesAdded++;

    } catch (error) {
      console.error(`Failed to capture page ${i}:`, error);
    }
  }

  if (pagesAdded > 0) {
    pdf.save(fileName);
  } else {
    throw new Error("No pages were captured successfully.");
  }
}

// ── LEGACY FALLBACK (For old, flat-text stories generated before the fix) ──
export async function exportContentToPdf(content: GeneratedContent, fileName = 'magineai-magazine.pdf') {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - 2 * margin;
  let yPosition = margin;

  const setPageBackground = () => {
    pdf.setFillColor(10, 10, 26);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');
  };

  const addNewPage = () => {
    pdf.addPage();
    setPageBackground();
    yPosition = margin;
  };

  const checkNewPage = (requiredHeight: number) => {
    if (yPosition + requiredHeight > pageHeight - margin) {
      addNewPage();
      return true;
    }
    return false;
  };

  setPageBackground();
  pdf.setTextColor(255, 255, 255);

  pdf.setTextColor(200, 200, 255);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text('MAGINEAI ISSUE', margin, yPosition);
  yPosition += 10;

  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  const titleLines = splitTextIntoLines(pdf, content.title || 'Untitled Story', contentWidth, 24);
  titleLines.forEach((line) => {
    checkNewPage(12);
    pdf.text(line, margin, yPosition);
    yPosition += 12;
  });
  yPosition += 8;

  if (content.introduction) {
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(200, 200, 200);
    const introLines = splitTextIntoLines(pdf, content.introduction, contentWidth, 12);
    introLines.forEach((line) => {
      checkNewPage(7);
      pdf.text(line, margin, yPosition);
      yPosition += 7;
    });
    yPosition += 16;
  }

  if (content.mainStory) {
    checkNewPage(15);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(150, 150, 255);
    pdf.text('Main Story', margin, yPosition);
    yPosition += 10;

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(240, 240, 240);
    const storyLines = splitTextIntoLines(pdf, content.mainStory, contentWidth, 11);
    storyLines.forEach((line) => {
      checkNewPage(7);
      pdf.text(line, margin, yPosition);
      yPosition += 7;
    });
    yPosition += 16;
  }

  if (content.images && content.images.length > 0) {
    for (let i = 0; i < content.images.length; i++) {
      try {
        checkNewPage(60);
        const imgData = await loadImageAsDataUrl(content.images[i]);
        pdf.addImage(imgData, 'JPEG', margin, yPosition, contentWidth, 50);
        yPosition += 58;
      } catch (error) {
        console.warn(`Failed to load image ${i + 1}:`, error);
      }
    }
  }

  pdf.save(fileName);
}