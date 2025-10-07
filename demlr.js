(function(){
  const $ = (sel, ctx=document) => ctx.querySelector(sel);
  const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));

  // --- Part 3A dynamic rows ---
  const part3aBody = $('#part3aTable tbody');
  const addP3aRowBtn = $('#addP3aRow');
  function addP3aRow() {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input type="text" name="p3a_id[]" placeholder="e.g., Silt Fence @ NE corner"/></td>
      <td><input type="text" name="p3a_ok[]" placeholder="Y/N"/></td>
      <td><input type="date" name="p3a_date[]" /></td>
      <td><input type="text" name="p3a_actions[]" placeholder="Corrective actions..."/></td>
      <td><input type="date" name="p3a_corrected[]" /></td>
    `;
    part3aBody.appendChild(tr);
  }
  addP3aRowBtn.addEventListener('click', addP3aRow);
  addP3aRow(); // start with one row

  // --- Part 2 add row ---
  $('#addP2Row').addEventListener('click', () => {
    const tbody = $('#part2Table tbody');
    const ref = String.fromCharCode(65 + tbody.children.length);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${ref}</td>
      <td><input type="text" name="p2_q_${ref}" placeholder="Enter your question text..."/></td>
      <td><input type="radio" name="${ref}" value="Yes" /></td>
      <td><input type="radio" name="${ref}" value="No" /></td>
      <td><input type="radio" name="${ref}" value="N/A" /></td>
    `;
    tbody.appendChild(tr);
  });

  // --- Local save ---
  const STORAGE_KEY = 'demlr_form_v1';
  const btnSaveLocal = $('#btnSaveLocal');
  const btnClear = $('#btnClear');

  function saveLocal(){
    const data = {};
    $$('input, select, textarea').forEach(el => {
      if (el.type === 'radio') {
        if (el.checked) data[el.name] = el.value;
      } else if (el.name) {
        if(!data[el.name]) data[el.name] = [];
        if(el.name.endsWith('[]')) data[el.name].push(el.value);
        else data[el.name] = el.value;
      }
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    alert('Saved locally.');
  }

  function loadLocal(){
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return;
    const data = JSON.parse(raw);
    $$('input, select, textarea').forEach(el => {
      if(!el.name) return;
      if(el.type === 'radio') {
        if(data[el.name] === el.value) el.checked = true;
      } else if(el.name.endsWith('[]')) { /* skip array restore */ }
      else if (data[el.name] != null) el.value = data[el.name];
    });
  }

  function clearForm(){
    if(!confirm('Clear all fields?')) return;
    $$('input, select, textarea').forEach(el => {
      if(el.type === 'radio' || el.type === 'checkbox') el.checked = false;
      else el.value = '';
    });
    localStorage.removeItem(STORAGE_KEY);
  }

  btnSaveLocal.addEventListener('click', saveLocal);
  btnClear.addEventListener('click', clearForm);
  loadLocal();

  // --- Footer year ---
  $('#year').textContent = new Date().getFullYear();

  // --- PDF generation ---
  async function captureToCanvas() {
    const main = document.querySelector('main');
    return await html2canvas(main, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
  }

  async function createPdfBlob() {
    const canvas = await captureToCanvas();
    const imgData = canvas.toDataURL('image/png');
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const imgHeight = canvas.height * (imgWidth / canvas.width);

    let y = 0;
    let remaining = imgHeight;
    while (remaining > 0) {
      pdf.addImage(imgData, 'PNG', 0, y ? 0 : 0, imgWidth, imgHeight);
      remaining -= pageHeight;
      if (remaining > 0) pdf.addPage();
      y += pageHeight;
    }
    return pdf.output('blob');
  }

  $('#btnPreview').addEventListener('click', async (e) => {
    e.preventDefault();
    const blob = await createPdfBlob();
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  });

  $('#btnDownload').addEventListener('click', async (e) => {
    e.preventDefault();
    const blob = await createPdfBlob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `DEMLR_Monitoring_${(new Date()).toISOString().slice(0,10)}.pdf`;
    a.click();
  });
})();
