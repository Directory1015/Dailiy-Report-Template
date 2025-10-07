(function(){
  // Helpers
  function $(s, r){ return (r||document).querySelector(s); }
  function $$(s, r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); }

  const STORAGE_KEY = 'demlrDrafts_v2';
  let currentId = null;

  function uid(){ return Math.random().toString(36).slice(2) + Date.now().toString(36); }
  function getDrafts(){ try{ return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }catch(e){ return []; } }
  function setDrafts(arr){ localStorage.setItem(STORAGE_KEY, JSON.stringify(arr)); }

  // Row helpers
  function addRow(tbody, cells){
    if(!tbody) return;
    const tr = document.createElement('tr');
    tr.innerHTML = cells.map(c => '<td>'+c+'</td>').join('') + '<td style="width:56px"><button type="button" class="btn ghost" data-remove>✕</button></td>';
    tbody.appendChild(tr);
  }
  function tableToJSON(sel, hasRemoveCol){
    const rows = $$(sel+' tbody tr');
    return rows.map(tr => {
      const tds = Array.prototype.slice.call(tr.querySelectorAll('td'));
      const take = hasRemoveCol ? tds.slice(0, -1) : tds;
      return take.map(td => {
        const el = td.querySelector('input,textarea,select');
        return el ? el.value : td.textContent;
      });
    });
  }
  function jsonToTable(sel, rows, makeCell, withRemoveCol){
    const tbody = $(sel+' tbody'); if(!tbody) return;
    tbody.innerHTML = '';
    rows.forEach(r => {
      const cells = r.map((v, idx) => makeCell(idx, v));
      if (withRemoveCol) addRow(tbody, cells);
      else {
        const tr = document.createElement('tr');
        tr.innerHTML = cells.map(c => '<td>'+c+'</td>').join('');
        tbody.appendChild(tr);
      }
    });
  }

  // Part 2 restore into fixed rows
  function restorePart2(d){
    const t2a = $('#part2aTable tbody'); const t2b = $('#part2bTable tbody');
    const t2c = $('#part2cTable tbody'); const t2d = $('#part2dTable tbody');
    if(!t2a || !t2b || !t2c || !t2d) return;

    function fillRow(tbody, rowIdx, yes, no, na){
      const tr = tbody.children[rowIdx]; if(!tr) return;
      const inputs = tr.querySelectorAll('input');
      if (inputs[0]) inputs[0].value = yes || '';
      if (inputs[1]) inputs[1].value = no || '';
      if (inputs[2]) inputs[2].value = na || '';
    }
    if (d.part2a && d.part2a.length >= 2){
      fillRow(t2a, 0, d.part2a[0][2], d.part2a[0][3], d.part2a[0][4]);
      fillRow(t2a, 1, d.part2a[1][2], d.part2a[1][3], d.part2a[1][4]);
    }
    if (d.part2b && d.part2b.length >= 5){
      for (let i=0;i<5;i++){ fillRow(t2b, i, d.part2b[i][2], d.part2b[i][3], d.part2b[i][4]); }
    }
    if (d.part2c && d.part2c.length >= 4){
      for (let i=0;i<4;i++){ fillRow(t2c, i, d.part2c[i][2], d.part2c[i][3], d.part2c[i][4]); }
    }
    if (d.part2d && d.part2d.length >= 2){
      for (let i=0;i<2;i++){ fillRow(t2d, i, d.part2d[i][2], d.part2d[i][3], d.part2d[i][4]); }
    }
  }

  // Cell factories for Part 3 tables
  function p3aCell(idx, v){
    if (idx === 2) return '<input value="'+(v||'')+'" placeholder="Y/N"/>';
    if (idx === 3) return '<input type="date" value="'+(v||'')+'"/>';
    if (idx === 4) return '<textarea>'+ (v||'') +'</textarea>';
    if (idx === 5) return '<input type="date" value="'+(v||'')+'"/>';
    return '<input value="'+(v||'')+'"/>';
  }
  function p3bCell(idx, v){
    if ([1,2,3,4].includes(idx)) return '<input value="'+(v||'')+'" placeholder="Y/N"/>';
    if ([5,7].includes(idx))    return '<input type="date" value="'+(v||'')+'"/>';
    if (idx === 6)              return '<textarea>'+ (v||'') +'</textarea>';
    return '<input value="'+(v||'')+'"/>';
  }
  function p3cCell(idx, v){
    if (idx === 2 || idx === 4) return '<input value="'+(v||'')+'" placeholder="Y/N"/>';
    if (idx === 3)              return '<input value="'+(v||'')+'" placeholder="T/P"/>';
    if (idx === 5 || idx === 7) return '<input type="date" value="'+(v||'')+'"/>';
    if (idx === 6)              return '<textarea>'+ (v||'') +'</textarea>';
    return '<input value="'+(v||'')+'"/>';
  }
  function p3dCell(idx, v){
    if (idx === 3) return '<input value="'+(v||'')+'" placeholder="Y/N"/>';
    if (idx === 4) return '<input type="date" value="'+(v||'')+'"/>';
    if (idx === 5) return '<input value="'+(v||'')+'" placeholder="I/A/R/X"/>';
    return '<input value="'+(v||'')+'"/>';
  }

  // Collect / Set
  function getForm(){
    return {
      id: currentId || uid(),
      project_name: $('#project_name')?.value || '',
      permit_no: $('#permit_no')?.value || '',
      authority: $('#authority')?.value || '',
      plan_approval: $('#plan_approval')?.value || '',
      expiration: $('#expiration')?.value || '',
      coc_number: $('#coc_number')?.value || '',
      coc_date: $('#coc_date')?.value || '',

      rain_mon: $('#rain_mon')?.value || '',
      rain_tue: $('#rain_tue')?.value || '',
      rain_wed: $('#rain_wed')?.value || '',
      rain_thu: $('#rain_thu')?.value || '',
      rain_fri: $('#rain_fri')?.value || '',
      rain_sat: $('#rain_sat')?.value || '',
      rain_sun: $('#rain_sun')?.value || '',

      phase_install: $('#phase_install')?.checked || false,
      phase_cg: $('#phase_cg')?.checked || false,
      phase_grading: $('#phase_grading')?.checked || false,
      phase_complete: $('#phase_complete')?.checked || false,
      phase_permcover: $('#phase_permcover')?.checked || false,
      limits: $('#limits')?.value || '',

      part2a: tableToJSON('#part2aTable', false),
      part2b: tableToJSON('#part2bTable', false),
      part2c: tableToJSON('#part2cTable', false),
      part2d: tableToJSON('#part2dTable', false),

      part3a: tableToJSON('#part3aTable', true),
      part3b: tableToJSON('#part3bTable', true),
      part3c: tableToJSON('#part3cTable', true),
      part3d: tableToJSON('#part3dTable', true),

      inspector_name: $('#inspector_name')?.value || '',
      employer: $('#employer')?.value || '',
      inspector_type: $('#inspector_type')?.value || '',
      address: $('#address')?.value || '',
      county: $('#county')?.value || '',
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

    restorePart2(d);
    jsonToTable('#part3aTable', d.part3a || [], p3aCell, true);
    jsonToTable('#part3bTable', d.part3b || [], p3bCell, true);
    jsonToTable('#part3cTable', d.part3c || [], p3cCell, true);
    jsonToTable('#part3dTable', d.part3d || [], p3dCell, true);

    setVal('#inspector_name', d.inspector_name);
    setVal('#employer', d.employer);
    setVal('#inspector_type', d.inspector_type);
    setVal('#address', d.address);
    setVal('#county', d.county);
    setVal('#phone', d.phone);
    setVal('#email', d.email);
    setVal('#inspection_dt', d.inspection_dt);
  }

  // History rendering + load/delete
  function renderHistory(){
    const drafts = getDrafts().sort((a,b) => (b.savedAt||'').localeCompare(a.savedAt||''));
    const el = $('#history'); if(!el){ return; }
    if(!drafts.length){ el.innerHTML = '<p class="muted">No drafts saved yet.</p>'; return; }
    el.innerHTML = drafts.map(d => {
      const title = (d.savedAt||'').slice(0,10) + ' · ' + (d.project_name||'Project');
      return `
        <div style="display:flex;gap:10px;align-items:center;margin:8px 0;padding:10px;border:1px solid var(--border);border-radius:10px">
          <div style="flex:1 1 auto">${title}</div>
          <button type="button" class="btn" data-load="${d.id}">Open</button>
          <button type="button" class="btn ghost" data-del="${d.id}">Delete</button>
        </div>
      `;
    }).join('');
  }

  // Direct button bindings (reliable)
  function bindClicks(){
    const map = [
      ['saveBtn', onSave],
      ['newBtn', onNew],
      ['printBtn', onPrint],
      ['addP3aRow', () => addRow($('#part3aTable tbody'), [
        '<input placeholder="Measure ID / Location and Description"/>',
        '<input placeholder="Ref letter(s) e.g., A,C"/>',
        '<input placeholder="Y/N"/>',
        '<input type="date"/>',
        '<textarea placeholder="Corrective actions..."></textarea>',
        '<input type="date"/>'
      ])],
      ['clearP3a', () => { if(confirm('Clear Part 3A table?')) $('#part3aTable tbody').innerHTML=''; }],
      ['addP3bRow', () => addRow($('#part3bTable tbody'), [
        '<input placeholder="Outfall ID / Location"/>',
        '<input placeholder="Y/N"/>',
        '<input placeholder="Y/N"/>',
        '<input placeholder="Y/N"/>',
        '<input placeholder="Y/N"/>',
        '<input type="date"/>',
        '<textarea placeholder="Corrective actions..."></textarea>',
        '<input type="date"/>'
      ])],
      ['clearP3b', () => { if(confirm('Clear Part 3B table?')) $('#part3bTable tbody').innerHTML=''; }],
      ['addP3cRow', () => addRow($('#part3cTable tbody'), [
        '<input placeholder="Area description and location"/>',
        '<input placeholder="Time limit"/>',
        '<input placeholder="Y/N"/>',
        '<input placeholder="T/P"/>',
        '<input placeholder="Y/N"/>',
        '<input type="date"/>',
        '<textarea placeholder="Corrective actions..."></textarea>',
        '<input type="date"/>'
      ])],
      ['clearP3c', () => { if(confirm('Clear Part 3C table?')) $('#part3cTable tbody').innerHTML=''; }],
      ['addP3dRow', () => addRow($('#part3dTable tbody'), [
        '<input placeholder="Measure ID / Location and Description"/>',
        '<input placeholder="Proposed ft."/>',
        '<input placeholder="Actual ft."/>',
        '<input placeholder="Y/N"/>',
        '<input type="date"/>',
        '<input placeholder="I/A/R/X"/>'
      ])],
      ['clearP3d', () => { if(confirm('Clear Part 3D table?')) $('#part3dTable tbody').innerHTML=''; }],
      ['wipeAll', () => {
        if(confirm('Delete ALL DEMLR drafts saved in this browser?')){
          localStorage.removeItem(STORAGE_KEY);
          const h = $('#history'); if(h) h.innerHTML='';
        }
      }]
    ];
    map.forEach(([id, handler]) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', function(ev){ ev.preventDefault(); handler(); });
    });

    // Delegated events for dynamic buttons in tables + history
    document.addEventListener('click', function(e){
      const removeBtn = e.target.closest && e.target.closest('button[data-remove]');
      if (removeBtn){ e.preventDefault(); const row = removeBtn.closest && removeBtn.closest('tr'); if(row) row.remove(); return; }

      const loadBtn = e.target.closest && e.target.closest('button[data-load]');
      if (loadBtn){
        e.preventDefault();
        const id = loadBtn.getAttribute('data-load');
        const d = getDrafts().find(x => x.id === id);
        if(d){ currentId = id; setForm(d); }
        return;
      }
      const delBtn = e.target.closest && e.target.closest('button[data-del]');
      if (delBtn){
        e.preventDefault();
        const id = delBtn.getAttribute('data-del');
        if(confirm('Delete this draft?')){
          const remain = getDrafts().filter(x => x.id !== id);
          setDrafts(remain);
          if(currentId===id) currentId = null;
          renderHistory();
        }
      }
    });
  }

  // Button handlers
  function onSave(){
    const draft = getForm();
    const ds = getDrafts();
    const i = ds.findIndex(d => d.id === draft.id);
    if(i>=0) ds[i] = draft; else ds.push(draft);
    setDrafts(ds); currentId = draft.id; renderHistory();
  }
  function onNew(){
    if (confirm('Clear the form for a new DEMLR entry?')) { currentId = null; setForm({}); seed(); }
  }
  function onPrint(){
    // The classic print call, wrapped to ensure a clean layout tick
    setTimeout(function(){ window.print(); }, 0);
  }

  // Seed one row in each Part 3 table
  function seed(){
    addRow($('#part3aTable tbody'), [
      '<input placeholder="Measure ID / Location and Description"/>',
      '<input placeholder="Ref letter(s) e.g., A,C"/>',
      '<input placeholder="Y/N"/>',
      '<input type="date"/>',
      '<textarea placeholder="Corrective actions..."></textarea>',
      '<input type="date"/>'
    ]);
    addRow($('#part3bTable tbody'), [
      '<input placeholder="Outfall ID / Location"/>',
      '<input placeholder="Y/N"/>',
      '<input placeholder="Y/N"/>',
      '<input placeholder="Y/N"/>',
      '<input placeholder="Y/N"/>',
      '<input type="date"/>',
      '<textarea placeholder="Corrective actions..."></textarea>',
      '<input type="date"/>'
    ]);
    addRow($('#part3cTable tbody'), [
      '<input placeholder="Area description and location"/>',
      '<input placeholder="Time limit"/>',
      '<input placeholder="Y/N"/>',
      '<input placeholder="T/P"/>',
      '<input placeholder="Y/N"/>',
      '<input type="date"/>',
      '<textarea placeholder="Corrective actions..."></textarea>',
      '<input type="date"/>'
    ]);
    addRow($('#part3dTable tbody'), [
      '<input placeholder="Measure ID / Location and Description"/>',
      '<input placeholder="Proposed ft."/>',
      '<input placeholder="Actual ft."/>',
      '<input placeholder="Y/N"/>',
      '<input type="date"/>',
      '<input placeholder="I/A/R/X"/>'
    ]);
  }

  // Startup
  document.addEventListener('DOMContentLoaded', function(){
    // Prefill inspection datetime if blank
    if($('#inspection_dt') && !$('#inspection_dt').value){
      const now = new Date(); const pad = n => String(n).padStart(2,'0');
      $('#inspection_dt').value =
        now.getFullYear()+'-'+pad(now.getMonth()+1)+'-'+pad(now.getDate())+'T'+pad(now.getHours())+':'+pad(now.getMinutes());
    }
    seed();
    renderHistory();
    bindClicks();
  });

  // Flag for health check in HTML
  window.__DEMLR_JS_READY = true;
})();

