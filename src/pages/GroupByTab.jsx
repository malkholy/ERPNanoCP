import { useState, useEffect } from "react";
import { apiCall } from "../shared/api.js";
import DataGrid from "../shared/DataGrid.jsx";

const FUNCS = ["SUM", "AVG", "MIN", "MAX", "COUNT"];

const CSS = `
.gb-ed-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px}
.gb-bc{display:flex;align-items:center;gap:5px;font-size:12px;color:var(--muted);margin-bottom:4px}
.gb-bc .lnk{color:var(--primary);font-weight:900;cursor:pointer}
.gb-name{height:42px;border:1px solid var(--border);border-radius:12px;padding:0 12px;font-size:15px;font-weight:900;background:var(--surface);outline:none;width:280px;color:var(--text)}
.gb-name:focus{border-color:var(--primary)}
.gb-two{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.gb-panel{background:var(--surface);border:1px solid var(--border);border-radius:14px;overflow:hidden;display:flex;flex-direction:column;min-height:340px}
.gb-ph{padding:11px 14px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center}
.gb-ph .ti{display:flex;align-items:center;gap:8px;font-weight:900;font-size:13px}
.gb-ph .ico{width:26px;height:26px;border-radius:8px;display:grid;place-items:center;font-size:13px}
.gb-ico-g{background:#dbeafe;color:#2563eb}
.gb-ico-c{background:#ede9fe;color:#7c3aed}
.gb-add{display:flex;gap:6px;padding:10px 14px;border-bottom:1px solid var(--border)}
.gb-add select{flex:1;height:34px;border:1px solid var(--border);border-radius:9px;padding:0 8px;font-size:12px;background:var(--surface);outline:none;color:var(--text)}
.gb-pbody{flex:1;overflow:auto;padding:8px}
.gb-row{display:flex;align-items:center;gap:8px;padding:9px 11px;background:var(--soft);border:1px solid var(--border);border-radius:10px;margin-bottom:6px}
.gb-row .drag{color:var(--muted);cursor:grab;font-size:15px}
.gb-row .num{width:20px;height:20px;border-radius:50%;display:grid;place-items:center;font-size:11px;font-weight:900}
.gb-num-g{background:#dbeafe;color:#2563eb}
.gb-row .nm{flex:1;font-weight:800;font-size:13px}
.gb-row .fn{height:30px;border:1px solid var(--border);border-radius:8px;padding:0 8px;font-size:12px;font-weight:800;background:var(--surface);outline:none;color:#7c3aed}
.gb-row .rm{height:24px;width:24px;border:0;border-radius:6px;background:#fee2e2;color:#dc2626;cursor:pointer;font-weight:900;font-size:12px}
.gb-arr{height:22px;width:22px;border:1px solid var(--border);border-radius:6px;background:var(--surface);cursor:pointer;font-size:10px}
.gb-empty{padding:24px;text-align:center;color:var(--muted);font-size:12px}
`;

function injectCSS() {
  if (document.getElementById("gb-css")) return;
  const s = document.createElement("style");
  s.id = "gb-css";
  s.textContent = CSS;
  document.head.appendChild(s);
}

/**
 * Props:
 *  pageId, pageFields [{FieldName}], isRO, showToast
 */
export default function GroupByTab({ pageId, pageFields = [], isRO = false, showToast = () => {} }) {
  injectCSS();

  const [configs, setConfigs]   = useState([]);   // list of group configs
  const [loading, setLoading]   = useState(false);

  // editor
  const [editing, setEditing]   = useState(false);
  const [editId, setEditId]     = useState(null);  // GroupByID | null = new
  const [name, setName]         = useState("");
  const [groupFields, setGroupFields] = useState([]);  // [FieldName]
  const [calcFields, setCalcFields]   = useState([]);  // [{FieldName, Func}]
  const [addGroupSel, setAddGroupSel] = useState("");
  const [addCalcSel, setAddCalcSel]   = useState("");
  const [saving, setSaving]     = useState(false);

  useEffect(() => { loadList(); }, []);

  async function loadList() {
    setLoading(true);
    try { const d = await apiCall("Get Page GroupBy", { PageID: pageId }); setConfigs(d.List0 || []); }
    catch { void 0; }
    setLoading(false);
  }

  // ── editor open/close ──
  async function openNew() {
    setEditId(null); setName(""); setGroupFields([]); setCalcFields([]);
    setAddGroupSel(""); setAddCalcSel("");
    setEditing(true);
  }
  async function openEdit(cfg) {
    setEditId(cfg.GroupByID); setName(cfg.ConfigName);
    setAddGroupSel(""); setAddCalcSel("");
    try {
      const d = await apiCall("Get GroupBy Fields", { GroupByID: cfg.GroupByID });
      const all = d.List0 || [];
      setGroupFields(all.filter(f => f.Role === "group").map(f => f.FieldName));
      setCalcFields(all.filter(f => f.Role === "calc").map(f => ({ FieldName: f.FieldName, Func: f.Func || "SUM" })));
    } catch { setGroupFields([]); setCalcFields([]); }
    setEditing(true);
  }
  function closeEditor() { setEditing(false); }

  // ── group field helpers ──
  function addGroup() {
    if (!addGroupSel || groupFields.includes(addGroupSel)) return;
    setGroupFields(p => [...p, addGroupSel]); setAddGroupSel("");
  }
  function removeGroup(i) { setGroupFields(p => p.filter((_, idx) => idx !== i)); }
  function moveGroup(i, dir) { setGroupFields(p => { const a=[...p]; const t=i+dir; if(t<0||t>=a.length) return a; [a[i],a[t]]=[a[t],a[i]]; return a; }); }

  // ── calc field helpers ──
  function addCalc() {
    if (!addCalcSel || calcFields.find(c => c.FieldName === addCalcSel)) return;
    setCalcFields(p => [...p, { FieldName: addCalcSel, Func: "SUM" }]); setAddCalcSel("");
  }
  function removeCalc(i) { setCalcFields(p => p.filter((_, idx) => idx !== i)); }
  function setCalcFunc(i, fn) { setCalcFields(p => p.map((c, idx) => idx===i ? {...c, Func:fn} : c)); }

  async function saveConfig() {
    if (!name) { showToast("Config name is required"); return; }
    if (groupFields.length === 0) { showToast("Add at least one group field"); return; }
    setSaving(true);
    try {
      const Fields = [
        ...groupFields.map((f, i) => ({ FieldName: f, Role: "group", Func: null, SortOrder: i + 1 })),
        ...calcFields.map((c, i) => ({ FieldName: c.FieldName, Role: "calc", Func: c.Func, SortOrder: i + 1 })),
      ];
      const op = editId === null ? "Save GroupBy" : "Update GroupBy";
      const payload = { PageID: pageId, ConfigName: name, Fields };
      if (editId !== null) payload.GroupByID = editId;
      const d = await apiCall(op, payload);
      if (d.State === 0) { showToast(editId === null ? "Config created" : "Config updated"); setEditing(false); loadList(); }
      else showToast(d.Message || "Error");
    } catch { showToast("Save failed"); }
    setSaving(false);
  }

  async function deleteConfig(rows) {
    if (!confirm(`Delete ${rows.length} config(s)?`)) return;
    for (const r of rows) {
      try { await apiCall("Delete GroupBy", { GroupByID: r.GroupByID }); } catch { showToast("Delete failed"); return; }
    }
    showToast("Deleted"); loadList();
  }

  // available fields for the add dropdowns
  const availGroup = pageFields.filter(f => !groupFields.includes(f.FieldName));
  const availCalc  = pageFields.filter(f => !calcFields.find(c => c.FieldName === f.FieldName));

  // ── LIST VIEW ──
  if (!editing) {
    return (
      <DataGrid
        title="Group By Configurations"
        subtitle={`${configs.length} config(s)`}
        loading={loading}
        columns={[
          { key:"_n", label:"#", numeric:true, render:(v,r) => configs.indexOf(r)+1 },
          { key:"ConfigName", label:"Config Name" },
          { key:"GroupCount", label:"Group Fields", numeric:true, render:v => <span style={{padding:"3px 9px",borderRadius:999,fontSize:11,fontWeight:900,background:"#dbeafe",color:"#2563eb"}}>{v ?? 0}</span> },
          { key:"CalcCount",  label:"Calc Fields",  numeric:true, render:v => <span style={{padding:"3px 9px",borderRadius:999,fontSize:11,fontWeight:900,background:"#ede9fe",color:"#7c3aed"}}>{v ?? 0}</span> },
        ]}
        rows={configs}
        onAdd={isRO ? undefined : openNew}
        onEdit={isRO ? undefined : openEdit}
        onDelete={isRO ? undefined : deleteConfig}
        onRefresh={loadList}
      />
    );
  }

  // ── EDITOR VIEW ──
  return (
    <div>
      <div className="gb-ed-head">
        <div>
          <div className="gb-bc">
            <span className="lnk" onClick={closeEditor}>Group By</span>
            <span>›</span>
            <span style={{color:"var(--text)",fontWeight:800}}>{editId===null ? "New Config" : `Edit — ${name||"…"}`}</span>
          </div>
          <input className="gb-name" value={name} readOnly={isRO} onChange={e=>setName(e.target.value)} placeholder="Config name e.g. By Item" />
        </div>
        <div style={{display:"flex",gap:8}}>
          <button className="dg-btn" onClick={closeEditor}>Cancel</button>
          {!isRO && <button className="dg-btn primary" disabled={saving} onClick={saveConfig}>{saving?"Saving…":"Save Config"}</button>}
        </div>
      </div>

      <div className="gb-two">
        {/* GROUP BY FIELDS */}
        <div className="gb-panel">
          <div className="gb-ph">
            <div className="ti"><span className="ico gb-ico-g">⊞</span> Group By Fields</div>
            <span style={{color:"var(--muted)",fontSize:11,fontWeight:800}}>{groupFields.length}</span>
          </div>
          {!isRO && (
            <div className="gb-add">
              <select value={addGroupSel} onChange={e=>setAddGroupSel(e.target.value)}>
                <option value="">+ Add group field...</option>
                {availGroup.map(f => <option key={f.FieldName} value={f.FieldName}>{f.FieldName}</option>)}
              </select>
              <button className="dg-btn primary" style={{height:34}} onClick={addGroup}>Add</button>
            </div>
          )}
          <div className="gb-pbody">
            {groupFields.length === 0 && <div className="gb-empty">No group fields</div>}
            {groupFields.map((g, i) => (
              <div key={g} className="gb-row">
                <span className="num gb-num-g">{i+1}</span>
                <span className="nm">{g}</span>
                {!isRO && <>
                  <button className="gb-arr" onClick={()=>moveGroup(i,-1)}>↑</button>
                  <button className="gb-arr" onClick={()=>moveGroup(i,1)}>↓</button>
                  <button className="rm" onClick={()=>removeGroup(i)}>✕</button>
                </>}
              </div>
            ))}
          </div>
        </div>

        {/* CALCULATED FIELDS */}
        <div className="gb-panel">
          <div className="gb-ph">
            <div className="ti"><span className="ico gb-ico-c">∑</span> Calculated Fields</div>
            <span style={{color:"var(--muted)",fontSize:11,fontWeight:800}}>{calcFields.length}</span>
          </div>
          {!isRO && (
            <div className="gb-add">
              <select value={addCalcSel} onChange={e=>setAddCalcSel(e.target.value)}>
                <option value="">+ Add calculated field...</option>
                {availCalc.map(f => <option key={f.FieldName} value={f.FieldName}>{f.FieldName}</option>)}
              </select>
              <button className="dg-btn primary" style={{height:34}} onClick={addCalc}>Add</button>
            </div>
          )}
          <div className="gb-pbody">
            {calcFields.length === 0 && <div className="gb-empty">No calculated fields</div>}
            {calcFields.map((c, i) => (
              <div key={c.FieldName} className="gb-row">
                <span className="nm">{c.FieldName}</span>
                {isRO ? <span className="fn">{c.Func}</span> : (
                  <select className="fn" value={c.Func} onChange={e=>setCalcFunc(i, e.target.value)}>
                    {FUNCS.map(fn => <option key={fn} value={fn}>{fn}</option>)}
                  </select>
                )}
                {!isRO && <button className="rm" onClick={()=>removeCalc(i)}>✕</button>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* preview */}
      {(groupFields.length > 0 || calcFields.length > 0) && (
        <div style={{background:"var(--soft)",borderRadius:14,padding:16,marginTop:16}}>
          <div style={{fontSize:11,fontWeight:900,color:"var(--muted)",textTransform:"uppercase",letterSpacing:".05em",marginBottom:10}}>👁 Result Columns</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {groupFields.map(g => <span key={g} style={{padding:"4px 10px",borderRadius:999,fontSize:12,fontWeight:900,background:"#dbeafe",color:"#2563eb"}}>{g}</span>)}
            {calcFields.map(c => <span key={c.FieldName} style={{padding:"4px 10px",borderRadius:999,fontSize:12,fontWeight:900,background:"#ede9fe",color:"#7c3aed"}}>{c.Func}({c.FieldName})</span>)}
          </div>
        </div>
      )}
    </div>
  );
}
