// assets/demlr.js (module)
const PDF_URL = 'DEMLR-Monitoring-Form-Rev-07012020.pdf';

// --- CONFIG: form field overlays -------------------------------------------
// Coordinates are percentages relative to the page (x,y,w,h are 0–100).
// page is 1-based (1 = first page of PDF).
//
// Tip: we can tune these quickly if any field needs nudging.
const FIELDS = [
  // ---- Page 1: Header / Project metadata ----
  { key:'project_name', label:'Project Name', page:1, x:5.5,  y:16.5, w:41,   h:2.8, type:'text' },
  { key:'permit_no',   label:'Permit #',      page:1, x:51.5, y:16.5, w:17.5, h:2.8, type:'text' },
  { key:'authority',   label:'Approving Auth',page:1, x:70.0, y:16.5, w:24,   h:2.8, type:'text' },

  { key:'plan_approval', label:'Plan Approval Date', page:1, x:5.5,  y:20.8, w:14,   h:2.8, type:'text' },
  { key:'expiration',    label:'Expiration',         page:1, x:21.8, y:20.8, w:14,   h:2.8, type:'text' },
  { key:'coc_number',    label:'COC #',              page:1, x:37.8, y:20.8, w:14,   h:2.8, type:'text' },
  { key:'coc_date',      label:'COC Date',           page:1, x:53.8, y:20.8, w:14,   h:2.8, type:'text' },

  // ---- Page 1: Part 1A rainfall (Mon–Sun) ----
  { key:'rain_mon', page:1, x:11.2, y:28.8, w:6.0, h:2.8, type:'text' },
  { key:'rain_tue', page:1, x:18.5, y:28.8, w:6.0, h:2.8, type:'text' },
  { key:'rain_wed', page:1, x:25.9, y:28.8, w:6.0, h:2.8, type:'text' },
  { key:'rain_thu', page:1, x:33.2, y:28.8, w:6.0, h:2.8, type:'text' },
  { key:'rain_fri', page:1, x:40.5, y:28.8, w:6.0, h:2.8, type:'text' },
  { key:'rain_sat', page:1, x:47.8, y:28.8, w:6.0, h:2.8, type:'text' },
  { key:'rain_sun', page:1, x:55.1, y:28.8, w:6.0, h:2.8, type:'text' },

  // ---- Page 1: Part 1B Phases (sample Yes/No checkboxes aligned to columns) ----
  // You can mark these as Y/N with a small checkbox.
  { key:'phase_install', page:1, x:8.0,  y:35.6, w:2.3, h:2.8, type:'checkbox' },
  { key:'phase_cg',      page:1, x:8.0,  y:38.6, w:2.3, h:2.8, type:'checkbox' },
  { key:'phase_grading', page:1, x:8.0,  y:41.6, w:2.3, h:2.8, type:'checkbox' },
  { key:'phase_complete',page:1, x:8.0,  y:44.6, w:2.3, h:2.8, type:'checkbox' },
  { key:'phase_permcover',page:1,x:8.0,  y:47.6, w:2.3, h:2.8, type:'checkbox' },

  // ---- Page 1: Limits (textarea) ----
  { key:'limits', page:1, x:5.5, y:52.5, w:88.5, h:6.0, type:'textarea' },

  // ---- Page 1: Part 2 first few items (Yes/No/NA radio “dots”) EXAMPLE ----
  // These are example dots aligned over the “Yes” column; duplicate per row as needed.
  { key:'p2_A_yes', page:1, x:77.8, y:62.2, w:2.3, h:2.8, type:'radio', name:'p2_A' },
  { key:'p2_A_no',  page:1, x:83.5, y:62.2, w:2.3, h:2.8, type:'radio', name:'p2_A' },
  { key:'p2_A_na',  page:1, x:89.0, y:62.2, w:2.3, h:2.8, type:'radio', name:'p2_A' },

  // ---- Page 2+ NOTE: We can map additional sections the same way once you confirm this layout. ----

  // ---- Signature (bottom of last page – adjust after we confirm # of pages) ----
  { key:'inspector_name', page:2, x:8.0, y:78.0, w:28, h:3.2, type:'text' },
  { key:'employer',       page:2, x:40,  y:78.0, w:23, h:3.2, type:'text' },
  { key:'inspector_type', page:2, x:67,  y:78.0, w:23, h:3.2, type:'text' },
  { key:'address',        page:2, x:8.0, y:82.0, w:38, h:3.2, type:'text' },
  { key:'phone',          page:2, x:48,  y:82.0, w:18, h:3.2, type:'text' },
  { key:'email',          page:2, x:68,  y:82.0, w:22, h:3.2, type:'text' },
  { key:'inspection_dt',  page:2, x:8.0, y:86.0, w:28, h:3.2, type:'text' },
];

// localStorage key so inspectors can come back to drafts
const STORAGE_KEY = 'demlr_overlay_v1';

const pagesEl = document.getElementById('pages');
const toggleBtn = document.getElementById('toggleOutlines');
const previewBtn = document.getElementById('btnPreview');
const downloadBtn = document.getElementById('btnDownload');

let fieldNodes = []; // {key, el}
let outlineOn = true;

// Load any saved data
function loadData() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
  catch { return {}; }
}
function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
function collectData() {
  const out = {};
  for (const { key, el, type } of fieldNodes) {
    if (type === 'checkbox') out[key] = el.checked ? 'Y' : '';
    else if (type === 'radio') {
      // radio groups share name; store group value
      out[el.name] = document.querySelector(`input[name="${el.name}"]:checked`)?.value || '';
    } else {
      out[key] = el.value || '';
    }
  }
  return out;
}
function restoreData() {
  const data = loadData();
  for (const { key, el, type } of fieldNodes) {
    if (type === 'checkbox') {
      el.checked = !!data[key];
    } else if (type === 'radio') {
      if (data[el.name] && el.value === data[el.name]) el.checked = true;
    } else if (data[key] != null) {
      el.value = data[key];
    }
  }
}

// Render PDF and overlays
async function renderPdf() {
  // Use PDF.js (ES module build from CDN)
  const pdfjsLib = await import('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.6.82/pdf.min.mjs');
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.6.82/pdf.worker.min.mjs';

  const loadingTask = pdfjsLib.getDocument(PDF_URL);
  const pdf = await loadingTask.promise;

  // Clear previous
  pagesEl.innerHTML = '';
  fieldNodes = [];

  const saved = loadData();

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);

    // Scale to readable width
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = document.createElement('canvas');
    canvas.className = 'pdf-canvas';
    const ctx = canvas.getContext('2d', { willReadFrequently: false });

    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    const wrap = document.createElement('div');
    wrap.className = 'page-wrap';
    wrap.style.width = Math.min(1100, viewport.width) + 'px';
    wrap.appendChild(canvas);

    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    wrap.appendChild(overlay);

    pagesEl.appendChild(wrap);

    await page.render({ canvasContext: ctx, viewport }).promise;

    // Place fields that belong to this page
    const pageFields = FIELDS.filter(f => f.page === i);

    pageFields.forEach(f => {
      const node = document.createElement('div');
      node.className = 'fld';
      node.style.left = (f.x) + '%';
      node.style.top = (f.y) + '%';
      node.style.width = (f.w) + '%';
      node.style.height = (f.h) + '%';
      node.dataset.type = f.type;

      let ctrl;
      if (f.type === 'textarea') {
        ctrl = document.createElement('textarea');
        ctrl.placeholder = f.label || '';
      } else if (f.type === 'checkbox') {
        ctrl = document.createElement('input');
        ctrl.type = 'checkbox';
        ctrl.title = f.label || f.key;
        // place a label visually?
      } else if (f.type === 'radio') {
        ctrl = document.createElement('input');
        ctrl.type = 'radio';
        ctrl.name = f.name;
        ctrl.value = f.key.endsWith('_yes') ? 'Yes'
                  : f.key.endsWith('_no')  ? 'No'
                  : f.key.endsWith('_na')  ? 'N/A' : f.key;
        ctrl.title = f.label || f.key;
      } else {
        ctrl = document.createElement('input');
        ctrl.type = 'text';
        ctrl.placeholder = f.label || '';
      }

      ctrl.style.fontSize = Math.max(12, Math.floor(canvas.height * 0.012)) + 'px';
      node.appendChild(ctrl);
      overlay.appendChild(node);

      fieldNodes.push({ key: f.key, el: ctrl, type: f.type });
    });

    // Resize observer: keep input font sizes roughly proportional on responsive changes
    new ResizeObserver(entries => {
      for (const entry of entries) {
        const h = entry.contentRect.height;
        const size = Math.max(12, Math.floor(h * 0.012));
        overlay.querySelectorAll('input,textarea').forEach(el => { el.style.fontSize = size + 'px'; });
      }
    }).observe(wrap);
  }

  // Restore saved values after all fields exist
  restoreData();

  // Change tracking
  pagesEl.addEventListener('input', () => {
    saveData(collectData());
  });
}

function toggleOutlines() {
  outlineOn = !outlineOn;
  document.querySelectorAll('.fld input, .fld textarea').forEach(el => {
    el.style.borderStyle = outlineOn ? 'dashed' : 'solid';
    el.style.borderColor = outlineOn ? '#cbd5e1' : 'transparent';
    el.style.background = outlineOn ? 'rgba(255,255,255,.9)' : 'transparent';
  });
}

// PDF capture (overlay + canvas together)
async function captureToCanvas() {
  // Wrap all pages into a single tall container for one-shot capture
  const container = document.getElementById('pages');
  // Temporarily hide outlines for cleaner export
  const before = outlineOn;
  if (before) toggleOutlines();

  const canvas = await html2canvas(container, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });

  // Restore outlines to previous state
  if (before !== outlineOn) toggleOutlines();

  return canvas;
}

async function createPdfBlob() {
  const canvas = await captureToCanvas();
  const imgData = canvas.toDataURL('image/png');
  const { jsPDF } = window.jspdf;

  // A4 portrait
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const imgWidth = pageWidth;
  const imgHeight = canvas.height * (imgWidth / canvas.width);

  let y = 0;
  let remaining = imgHeight;

  while (remaining > 0) {
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight, undefined, 'FAST');
    remaining -= pageHeight;
    if (remaining > 0) pdf.addPage();
    y += pageHeight;
  }
  return pdf.output('blob');
}

document.getElementById('toggleOutlines').addEventListener('click', toggleOutlines);
document.getElementById('btnPreview').addEventListener('click', async (e) => {
  e.preventDefault();
  const blob = await createPdfBlob();
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
});
document.getElementById('btnDownload').addEventListener('click', async (e) => {
  e.preventDefault();
  const blob = await createPdfBlob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `DEMLR_Filled_${(new Date()).toISOString().slice(0,10)}.pdf`;
  a.click();
});

// Kick off
renderPdf().catch(err => {
  console.error(err);
  pagesEl.innerHTML = `<div style="padding:12px;border:1px solid #e5e7eb;border-radius:10px;color:#b91c1c">
    Failed to render PDF. Make sure <code>${PDF_URL}</code> exists at the repo root.
  </div>`;
});

