(function(){
  // Tiny helpers
  function $(s, r){ return (r||document).querySelector(s); }
  function $$(s, r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); }

  const STORAGE_KEY = 'demlrDrafts_v1';
  let currentId = null;

  function uid(){ return Math.random().toString(36).slice(2) + Date.now().toString(36); }
  function getDrafts(){ try{ return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }catch(e){ return []; } }
  function setDrafts(arr){ localStorage.setItem(STORAGE_KEY, JSON.stringify(arr)); }

  // Collect the whole form
  function getForm(){
    return {
      id: currentId || uid(),
      // Project info
      project_name: $('#project_name')?.value || '',
      permit_no: $('#permit_no')?.value || '',
      authority: $('#authority')?.value || '',
      plan_approval: $('#plan_approval')?.value || '',
      expiration: $('#expiration')?.value || '',
      coc_number: $('#coc_number')?.value || '',
      coc_date: $('#coc_date')?.value || '',
      // Rainfall
      rain_mon: $('#rain_mon')?.value || '',
      rain_tue: $('#rain_tue')?.value || '',
      rain_wed: $('#rain_wed')?.value || '',
      rain_thu: $('#rain_thu')?.value || '',
      rain_fri: $('#rain_fri')?.value || '',
      rain_sat: $('#rain_sat')?.value || '',
      rain_sun: $('#rain_sun')?.value || '',
      // Phases + limits
      phase_install: $('#phase_install')?.checked || false,
      phase_cg: $('#phase_cg')?.checked || false,
      phase_grading: $('#phase_grading')?.checked || false,
      phase_complete: $('#phase_complete')?.checked || false,
      phase_permcover: $('#phase_permcover')?.checked || false,
      limits: $('#limits')?.value || '',
      // Part 2 + Part 3A tables
      part2: tableToJSON('#part2Table'),
      part3a: tableToJSON('#part3aTable'),
      // Signature
      inspector_name: $('#inspector_name')?.value || '',
      employer: $('#employer')?.value || '',
      inspector_type: $('#inspector_type')?.value || '',
      address: $('#address')?.value || '',
      phone: $('#phone')?.value || '',
      email: $('#email')?.value || '',
      inspection_dt: $('#inspection_dt')?.value || '',
      savedAt: new Date().toISOString()
    };
  }

  function setForm(d){
    function setVal(sel, val){ const el = $(sel); if(el) el.value = val || ''; }
    function setChk(sel, val){ const el = $(sel); if(el) el.checked = !!val; }

    setVal('#project_name', d.project_name);
    setVal('#permit_no', d.permit_no);
    setVal('#authority', d.authority);
    setVal('#plan_approval', d.plan_approval);
    setVal('#expiration', d.expiration);
    setVal('#coc_number', d.coc_number);
    setVal('#coc_date', d.coc_date);

    setVal('#rain_mon', d.rain_mon);
    setVal('#rain_tue', d.rain_tue);
    setVal('#rain_wed', d.rain_wed);
    setVal('#rain_thu', d.rain_thu);
    setVal('#rain_fri', d.rain_fri);
    setVal('#rain_sat', d.rain_sat);
    setVal('#rain_sun', d.rain_sun);

    setChk('#phase_install', d.phase_install);
    setChk('#phase_cg', d.phase_cg);
    setChk('#phase_grading', d.phase_grading);
    setChk('#phase_complete', d.phase_complete);
    setChk('#phase_permcover', d.phase_permcover);
    setVal('#limits', d.limits);

    jsonToTable('#part2Table', d.part2 || []);
    jsonToTable('#part3aTable', d.part3a || []);

    setVal('#inspector_name', d.inspector_name);
    setVal('#employer', d.employer);
    setVal('#inspector_type', d.inspector_type);
    setVal('#address', d.address);
    setVal('#phone', d.phone);
    setVal('#email', d.email);
    setVal('#inspection_dt', d.inspection_dt);
  }

  function tableToJSON(sel){
    const rows = $$(sel+' tbody tr');
    return rows.map(tr => {
      return Array.prototype.slice.call(tr.querySelectorAll('td')).map((td, idx) => {
        // skip last action column if present
        const el = td.querySelector('input,textarea,select');
        return el ? el.value : td.textContent;
      });
    });
  }

  function inputForCell(idx, val, tableSel){
    const isYN = (tableSel==='#part2Table' && (idx===2 || idx===3 || idx===4));
    const isDate = (tableSel==='#part3aTable' && (idx===2 || idx===4));
    const isNotes = (tableSel==='#part3aTable' && (idx===3));

    if (isNotes) return '<textarea>'+ (val||'') +'</textarea>';
    if (isDate)  return '<input type="date" value="'+ (val||'') +'"/>';
    if (isYN)    return '<input value="'+ (val||'') +'" placeholder="Y/N/NA"/>';
    return '<input value="'+ (val||'') +'"/>';
  }

  function addRow(tbody, cells){
    if(!tbody) return;
    const tr = document.createElement('tr');
    tr.innerHTML = cells.map(c => '<td>'+c+'</td>').join('') + '<td style="width:56px"><button class="btn ghost" data-remove>✕</button></td>';
    tbody.appendChild(tr);
  }

  function jsonToTable(sel, rows){
    const tbody = $(sel+' tbody'); if(!tbody) return;
    // preserve header structure; detect if table has action col
    const hasAction = (sel==='#part3aTable'); // we add remove button to 3A; for Part2 we’ll regenerate rows w/out action col
    tbody.innerHTML = '';
    rows.forEach((r) => {
      if (sel==='#part2Table') {
        // Expect: [Ref, Question, Yes, No, NA]
        const cells = [
          '<input value="'+ (r[0]||'') +'"/>',
          '<input value="'+ (r[1]||'') +'"/>',
          '<input value="'+ (r[2]||'') +'"/>',
          '<input value="'+ (r[3]||'') +'"/>',
          '<input value="'+ (r[4]||'') +'"/>'
        ];
        const tr = document.createElement('tr');
        tr.innerHTML = cells.map(c => '<td>'+c+'</td>').join('');
        tbody.appendChild(tr);
      } else {
        // Part3A: 5 columns + remove
        addRow(tbody, r.map((v, idx) => inputForCell(idx, v, sel)));
      }
    });
  }

  // UI events
  document.addEventListener('click', function(e){
    const btn = e.target.closest && e.target.closest('button');
    if(!btn) return;

    if (btn.hasAttribute('data-remove')) {
      const row = btn.closest && btn.closest('tr');
      if(row) row.remove();
      return;
    }

    switch(btn.id){
      case 'saveBtn': {
        const draft = getForm();
        const ds = getDrafts();
        const i = ds.findIndex(d => d.id === draft.id);
        if(i>=0) ds[i] = draft; else ds.push(draft);
        setDrafts(ds); currentId = draft.id; renderHistory();
        break;
      }
      case 'newBtn': {
        if (confirm('Clear the form for a new DEMLR entry?')) { currentId = null; setForm({}); seed(); }
        break;
      }
      case 'printBtn': {
        setTimeout(() => window.print(), 0);
        break;
      }
      case 'addP2Row': {
        const tbody = $('#part2Table tbody');
        const nextRef = String.fromCharCode(65 + tbody.children.length); // A, B, C...
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><input value="${nextRef}"/></td>
          <td><input placeholder="Enter question..."/></td>
          <td><input placeholder="Y"/></td>
          <td><input placeholder="N"/></td>
          <td><input placeholder="NA"/></td>
        `;
        tbody.appendChild(tr);
        break;
      }
      case 'clearP2': {
        if(confirm('Clear Part 2 table?')) $('#part2Table tbody').innerHTML='';
        break;
      }
      case 'addP3aRow': {
        addRow($('#part3aTable tbody'), [
          '<input placeholder="e.g., Silt Fence @ NE corner"/>',
          '<input placeholder="Y/N"/>',
          '<input type="date"/>',
          '<textarea placeholder="Corrective actions..."></textarea>',
          '<input type="date"/>'
        ]);
        break;
      }
      case 'clearP3a': {
        if(confirm('Clear Part 3A table?')) $('#part3aTable tbody').innerHTML='';
        break;
      }
      case 'wipeAll': {
        if(confirm('Delete ALL DEMLR drafts saved in this browser?')){
          localStorage.removeItem(STORAGE_KEY);
          const h = $('#history'); if(h) h.innerHTML='';
        }
        break;
      }
    }
  });

  // Render saved drafts list
  function renderHistory(){
    const drafts = getDrafts().sort((a,b) => (b.savedAt||'').localeCompare(a.savedAt||''));
    const el = $('#history'); if(!el){ return; }
    if(!drafts.length){ el.innerHTML = '<p class="muted">No drafts saved yet.</p>'; return; }
    el.innerHTML = drafts.map(d => {
      const title = (d.savedAt||'').slice(0,10) + ' · ' + (d.project_name||'Project');
      return `
        <div style="display:flex;gap:10px;align-items:center;margin:8px 0;padding:10px;border:1px solid var(--border);border-radius:10px">
          <div style="flex:1 1 auto">${title}</div>
          <button class="btn" data-load="${d.id}">Open</button>
          <button class="btn ghost" data-del="${d.id}">Delete</button>
        </div>
      `;
    }).join('');
  }

  // Load/delete from history
  document.addEventListener('click', function(e){
    const loadBtn = e.target.closest && e.target.closest('button[data-load]');
    const delBtn = e.target.closest && e.target.closest('button[data-del]');
    if (loadBtn){
      const id = loadBtn.getAttribute('data-load');
      const d = getDrafts().find(x => x.id === id);
      if(d){ currentId = id; setForm(d); }
    }
    if (delBtn){
      const id = delBtn.getAttribute('data-del');
      if(confirm('Delete this draft?')){
        const remain = getDrafts().filter(x => x.id !== id);
        setDrafts(remain);
        if(currentId===id) currentId = null;
        renderHistory();
      }
    }
  });

  // Seed initial blank rows
  function seed(){
    // Part 2 already has A, B, C in HTML
    // Part 3A start with one row
    addRow($('#part3aTable tbody'), [
      '<input placeholder="e.g., Silt Fence @ NE corner"/>',
      '<input placeholder="Y/N"/>',
      '<input type="date"/>',
      '<textarea placeholder="Corrective actions..."></textarea>',
      '<input type="date"/>'
    ]);
  }

  // Start
  document.addEventListener('DOMContentLoaded', function(){
    // optional: prefill date/time-like fields
    if($('#inspection_dt') && !$('#inspection_dt').value){
      const now = new Date();
      const pad = n => String(n).padStart(2,'0');
      const isoLocal = now.getFullYear()+'-'+pad(now.getMonth()+1)+'-'+pad(now.getDate())+'T'+pad(now.getHours())+':'+pad(now.getMinutes());
      $('#inspection_dt').value = isoLocal;
    }
    seed();
    renderHistory();
  });
})();


