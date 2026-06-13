import { useState, useEffect } from "react";
import { apiCall } from "../shared/api.js";
import DataGrid from "../shared/DataGrid.jsx";
import SearchDropdown from "../shared/SearchDropdown.jsx";
import FilterTab from "./FilterTab.jsx";
import GroupByTab from "./GroupByTab.jsx";

const CLAUDE_PROXY = "https://sila.silasystem.com:7300/api/claude/suggest";

const CSS = `
.pmd-wrap{display:flex;flex-direction:column;min-height:calc(100vh - 56px)}
.pmd-head{padding:14px 18px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;background:var(--surface)}
.pmd-head h2{font-size:20px;font-weight:900}
.pmd-tabs{display:flex;gap:4px;padding:10px 18px 0;border-bottom:1px solid var(--border);background:var(--surface)}
.pmd-tab{padding:8px 16px;border-radius:10px 10px 0 0;font-weight:900;font-size:13px;cursor:pointer;color:var(--muted);background:var(--soft)}
.pmd-tab.active{background:var(--surface);color:var(--primary);border-bottom:2px solid var(--primary)}
.pmd-body{flex:1;padding:22px;background:var(--bg);overflow:auto}
.pmd-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;max-width:760px}
.pmd-grid .full{grid-column:1/-1}
.pmd-label{display:block;font-size:11px;font-weight:900;color:var(--muted);text-transform:uppercase;margin-bottom:6px}
.pmd-input{width:100%;height:42px;border:1px solid var(--border);border-radius:12px;background:var(--surface);padding:0 12px;font-size:13px;font-weight:700;outline:none;color:var(--text)}
.pmd-input:focus{border-color:var(--primary)}
.pmd-input.ro{background:#f1f5f9;color:var(--muted)}
.pmd-ai-btn{height:36px;padding:0 14px;border-radius:11px;border:0;background:linear-gradient(135deg,#7c3aed,#6d28d9);color:#fff;font-weight:900;font-size:13px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;margin-top:16px}
.pmd-ai-btn:disabled{opacity:.5;cursor:not-allowed}
.pmd-ai-panel{background:#ede9fe;border:1px solid #c4b5fd;border-radius:16px;padding:16px;max-width:760px;margin-top:14px}
.pmd-ai-head{display:flex;align-items:center;gap:8px;margin-bottom:10px;font-weight:900;font-size:14px;color:#7c3aed}
.pmd-ai-typing{display:flex;gap:4px;align-items:center}
.pmd-ai-dot{width:7px;height:7px;border-radius:50%;background:#7c3aed;animation:pmd-b .8s infinite}
.pmd-ai-dot:nth-child(2){animation-delay:.15s}.pmd-ai-dot:nth-child(3){animation-delay:.3s}
@keyframes pmd-b{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}}
.pmd-ai-text{font-size:13px;color:#4c1d95;line-height:1.6}
.pmd-ai-apply{height:30px;padding:0 14px;border-radius:999px;border:0;background:#7c3aed;color:#fff;font-weight:900;font-size:12px;cursor:pointer;margin-top:10px;margin-right:8px}
.pmd-ai-dismiss{height:30px;padding:0 14px;border-radius:999px;border:1px solid #c4b5fd;background:transparent;color:#7c3aed;font-weight:900;font-size:12px;cursor:pointer;margin-top:10px}
.views-layout{display:grid;grid-template-columns:220px 1fr;gap:14px;min-height:400px}
.views-sidebar{background:var(--surface);border:1px solid var(--border);border-radius:14px;overflow:hidden;display:flex;flex-direction:column}
.vs-head{padding:10px 12px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center}
.vs-head span{font-weight:900;font-size:13px}
.vs-list{flex:1;padding:6px;overflow:auto}
.vs-item{padding:9px 10px;border-radius:9px;font-weight:800;font-size:13px;cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:4px;margin-bottom:2px}
.vs-item:hover{background:var(--soft)}
.vs-item.active{background:var(--primary-soft);color:var(--primary-dark)}
.vs-badge{font-size:10px;padding:2px 7px;border-radius:999px;font-weight:900;white-space:nowrap}
.vs-badge.def{background:#dcfce7;color:#16a34a}
.vs-badge.cust{background:#dbeafe;color:#2563eb}
.view-detail{background:var(--surface);border:1px solid var(--border);border-radius:14px;overflow:hidden;display:flex;flex-direction:column}
.vd-toggle{display:flex;align-items:center;gap:7px}
.vd-sw{width:36px;height:20px;border-radius:999px;background:#e5e7eb;position:relative;cursor:pointer;flex-shrink:0;transition:background .15s}
.vd-sw.on{background:#16a34a}
.vd-sw::after{content:'';position:absolute;top:3px;left:3px;width:14px;height:14px;border-radius:50%;background:#fff;transition:left .15s}
.vd-sw.on::after{left:19px}
.vd-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;min-height:280px;color:var(--muted);gap:8px}
.dnd-field{padding:8px 10px;border-radius:8px;background:var(--surface);border:1px solid var(--border);margin-bottom:5px;cursor:grab;display:flex;align-items:center;gap:7px;font-size:12px;font-weight:800;user-select:none}
.dnd-field:hover{border-color:var(--primary)}
.dnd-field.sel{background:var(--primary-soft);border-color:var(--primary)}
.dnd-drop-zone{border:2px dashed var(--border);border-radius:8px;padding:20px;text-align:center;color:var(--muted);font-size:12px;font-weight:800;margin:4px}
.dnd-drop-zone.over{border-color:var(--primary);background:var(--primary-soft);color:var(--primary-dark)}
.pmd-arr{height:24px;width:24px;border:1px solid var(--border);border-radius:6px;background:var(--surface);cursor:pointer;font-size:11px;margin-right:2px}
`;

function injectCSS() {
  if (document.getElementById("pmd-css")) return;
  const s = document.createElement("style");
  s.id = "pmd-css";
  s.textContent = CSS;
  document.head.appendChild(s);
}

const thS = { padding:"9px 12px", textAlign:"left", fontWeight:900, fontSize:11, color:"var(--muted)", textTransform:"uppercase", borderBottom:"1px solid var(--border)", background:"var(--soft)" };
const tdS = { padding:"9px 12px", borderBottom:"1px solid var(--border)" };

export default function PageMasterDetails({ mode, row, onBack, onSaved }) {
  injectCSS();

  const isRO = mode === "view";
  const [tab, setTab]               = useState("info");
  const [form, setForm]             = useState({ PageName:"", Icon:"▦", PageType:"grid", DatabaseName:"", SchemaName:"", TableName:"", SPName:"", ...row });
  const [fields, setFields]         = useState([]);
  const [databases, setDatabases]   = useState([]);
  const [schemas, setSchemas]       = useState([]);
  const [tables, setTables]         = useState([]);
  const [tableFields, setTableFields] = useState([]);
  const [saving, setSaving]         = useState(false);
  const [initLoading, setInitLoading] = useState(mode !== "add");
  const [toast, setToast]           = useState("");

  // AI
  const [aiLoading, setAiLoading]   = useState(false);
  const [aiVisible, setAiVisible]   = useState(false);
  const [aiText, setAiText]         = useState("");
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [selectedFields, setSelectedFields] = useState(new Set());

  // Views
  const [views, setViews]           = useState([]);
  const [activeView, setActiveView] = useState(null);
  const [viewMode, setViewMode]     = useState(null);
  const [viewSaving, setViewSaving] = useState(false);
  const [dragSrc, setDragSrc]       = useState(null);
  const [selAvail, setSelAvail]     = useState(null);
  const [selView, setSelView]       = useState(null);
  const [availSearch, setAvailSearch] = useState("");
  const [viewSearch, setViewSearch]   = useState("");
  const [dragOver, setDragOver]     = useState(null);
  const fieldsLoadedFromDB = { current: false };

  useEffect(() => {
    setAiSuggestion(null);
    setAiVisible(false);
    async function init() {
      setInitLoading(true);
      await loadDatabases();
      if (row?.PageID) {
        try { const d = await apiCall("Get Page Fields", { PageID: row.PageID }); if(d.List0?.length){ setFields(d.List0.map(f=>({...f,FieldID:f.FieldID,Visible:f.Visible?1:0,Sortable:f.Sortable?1:0,Filterable:f.Filterable?1:0}))); fieldsLoadedFromDB.current=true; } } catch { void 0; }
        try { const d = await apiCall("Get Page Views",  { PageID: row.PageID }); setViews(d.List0 || []); } catch { void 0; }
      }
      if (row?.DatabaseName) {
        await loadSchemas(row.DatabaseName);
        if (row.SchemaName) {
          await loadTables(row.DatabaseName, row.SchemaName);
          if (row.TableName) await loadTableFields(row.DatabaseName, row.SchemaName, row.TableName);
        }
      }
      setInitLoading(false);
    }
    init();
  }, []);

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(""), 2200); }

  async function loadDatabases() {
    try { const d = await apiCall("Get Databases"); setDatabases(d.List0 || []); } catch { void 0; }
  }
  async function loadSchemas(db) {
    setSchemas([]); setTables([]); setTableFields([]);
    if (!db) return;
    try { const d = await apiCall("Get Schemas", { DatabaseName: db }); setSchemas(d.List0 || []); } catch { void 0; }
  }
  async function loadTables(db, schema) {
    setTables([]); setTableFields([]);
    if (!db || !schema) return;
    try { const d = await apiCall("Get Tables", { DatabaseName: db, SchemaName: schema }); setTables(d.List0 || []); } catch { void 0; }
  }
  async function loadTableFields(db, schema, table) {
    setTableFields([]);
    if (!db || !schema || !table) return;
    try {
      const d = await apiCall("Get Fields", { DatabaseName: db, SchemaName: schema, TableName: table });
      const f = (d.List0 || []).map((col, i) => {
        const name = col.FieldName || col.COLUMN_NAME || col.ColumnName || Object.values(col)[0] || "";
        return { FieldName: name, Label: name.replace(/([A-Z])/g," $1").replace(/_/g," ").trim(), DataType: col.DataType || col.DATA_TYPE || "nvarchar", Visible:1, Sortable:1, Filterable:1, SortOrder:i+1, ColorRules:"" };
      });
      setTableFields(f);
      // only auto-populate if no fields loaded from DB
      if (!fieldsLoadedFromDB.current) setFields(f);
    } catch { void 0; }
  }

  async function handleSave() {
    if (!form.PageName) { showToast("Page Name is required"); return; }
    setSaving(true);
    try {
      const op = mode === "add" ? "Save Page Setup" : "Update Page Setup";
      const fieldsToSave = selectedFields.size > 0
        ? fields.filter(f => selectedFields.has(f.FieldName)).map((f,i) => ({ ...f, SortOrder:i+1 }))
        : fields.map((f,i) => ({ ...f, SortOrder:i+1 }));
      console.log("Saving fields sample:", JSON.stringify(fieldsToSave.slice(0,2)));
      const d = await apiCall(op, { ...form, Fields: fieldsToSave });
      if (d.State === 0) { showToast(mode === "add" ? "Page created" : "Page updated"); onSaved(); }
      else showToast(d.Message || "Error");
    } catch { showToast("Save failed"); }
    setSaving(false);
  }

  // Fields helpers
  function updateLabel(i, v) { setFields(p => p.map((x,idx) => idx===i?{...x,Label:v}:x)); }
  function toggleF(i, key)   { setFields(p => p.map((x,idx) => idx===i?{...x,[key]:x[key]?0:1}:x)); }
  function move(i, dir)      { setFields(p => { const a=[...p]; const t=i+dir; if(t<0||t>=a.length) return a; [a[i],a[t]]=[a[t],a[i]]; return a; }); }
  function remove(i)         { setFields(p => p.filter((_,idx) => idx!==i)); }
  function checkAll()        { setSelectedFields(new Set(fields.map(f => f.FieldName))); showToast(`${fields.length} fields selected`); }
  function uncheckAll()      { setSelectedFields(new Set()); }
  function toggleCheck(name) { setSelectedFields(p => { const n = new Set(p); n.has(name) ? n.delete(name) : n.add(name); return n; }); }
  function removeSelected()  { setFields(p => p.filter(f => !selectedFields.has(f.FieldName))); setSelectedFields(new Set()); }

  // AI
  async function handleAISuggest() {
    if (!form.TableName) { showToast("Select a table first"); return; }
    setAiVisible(true); setAiLoading(true); setAiText(""); setAiSuggestion(null);
    const fieldNames = (tableFields.length > 0 ? tableFields : fields).map(f => f.FieldName).join(",");
    try {
      const res = await fetch(CLAUDE_PROXY, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ Fields: fieldNames }) });
      const data = await res.json();
      if (data.state !== 0) { setAiText(data.message || "Error"); setAiLoading(false); return; }
      const suggestions = JSON.parse(data.suggestions);
      setAiSuggestion(suggestions);
      setAiText(`AI configured ${suggestions.length} fields — labels and visibility updated. Click Apply to use.`);
    } catch { setAiText("Could not get AI suggestion. Check proxy connection."); }
    setAiLoading(false);
  }

  function applyAI() {
    if (!aiSuggestion) return;
    const base = tableFields.length > 0 ? tableFields : fields;
    setFields(base.map((f,i) => {
      const s = aiSuggestion.find(x => x.FieldName === f.FieldName);
      if (!s) return f;
      return {
        ...f,
        Label:      s.Label      ?? f.Label,
        Visible:    s.Visible    ? 1 : 0,
        Format:     s.Format     ?? f.Format ?? "",
        ColorRules: (["int","decimal","float","bigint","money"].includes(f.DataType) && s.BadgeColors && Object.keys(s.BadgeColors).length)
          ? JSON.stringify(s.BadgeColors)
          : (f.ColorRules || ""),
        SortOrder:  i + 1,
      };
    }));
    setAiSuggestion(null); setAiVisible(false); setSelectedFields(new Set());
    showToast("AI suggestions applied! Click Save to persist.");
  }

  // Views
  async function selectView(v) {
    try {
      const d = await apiCall("Get View Fields", { ViewID: v.ViewID });
      const viewF = (d.List0 || []).map(f => ({
        ...f,
        FieldID: f.FieldID,
        FieldName: f.FieldName,
        Label: f.Label,
        DataType: f.DataType,
        Visible: f.Visible ?? 1,
      }));
      const viewNames = viewF.map(x => x.FieldName);
      const availF = fields.filter(f => !viewNames.includes(f.FieldName));
      setActiveView({ ...v, viewFields: viewF, availFields: availF });
    } catch {
      setActiveView({ ...v, viewFields: [], availFields: [...fields] });
    }
    setSelAvail(null); setSelView(null); setAvailSearch(""); setViewSearch("");
    setViewMode("edit");
  }

  async function newView() {
    // Reload fields from DB to ensure FieldID is present
    let pageFields = fields;
    if (row?.PageID && (!fields[0]?.FieldID)) {
      try {
        const d = await apiCall("Get Page Fields", { PageID: row.PageID });
        pageFields = d.List0 || [];
        setFields(pageFields);
      } catch { void 0; }
    }
    setActiveView({ ViewID: null, ViewName:"", IsDefault:0, viewFields: [], availFields: pageFields.map(f => ({
      FieldID: f.FieldID,
      FieldName: f.FieldName,
      Label: f.Label,
      DataType: f.DataType,
      Visible: f.Visible ?? 1,
    })) });
    setSelAvail(null); setSelView(null); setAvailSearch(""); setViewSearch("");
    setViewMode("new");
  }

  function moveFieldToView(f) {
    if (!f) return;
    setActiveView(p => ({ ...p, availFields:(p.availFields||[]).filter(x=>x.FieldName!==f.FieldName), viewFields:[...(p.viewFields||[]),f] }));
    setSelAvail(null);
  }

  function moveFieldToAvail(f) {
    if (!f) return;
    setActiveView(p => ({ ...p, viewFields:(p.viewFields||[]).filter(x=>x.FieldName!==f.FieldName), availFields:[...(p.availFields||[]),f] }));
    setSelView(null);
  }

  function addAllFields()    { setActiveView(p => ({ ...p, viewFields:[...(p.viewFields||[]),...(p.availFields||[])], availFields:[] })); }
  function removeAllFields() { setActiveView(p => ({ ...p, availFields:[...(p.availFields||[]),...(p.viewFields||[])], viewFields:[] })); }

  function handleDrop(target) {
    if (!dragSrc || dragSrc.from === target) { setDragOver(null); return; }
    if (target === "view") moveFieldToView(dragSrc.field);
    else moveFieldToAvail(dragSrc.field);
    setDragSrc(null); setDragOver(null);
  }

  async function saveView() {
    if (!activeView?.ViewName) { showToast("View name is required"); return; }
    setViewSaving(true);
    try {
      const payload = {
        PageID: row?.PageID,
        ViewName: activeView.ViewName,
        IsDefault: activeView.IsDefault,
        Fields: (activeView.viewFields||[]).map((f,i) => ({
          FieldID:   f.FieldID || fields.find(x=>x.FieldName===f.FieldName)?.FieldID,
          Label:     f.Label,
          Visible:   f.Visible ?? 1,
          SortOrder: i + 1,
        })),
      };
      if (activeView.ViewID) payload.ViewID = activeView.ViewID;
      console.log("Save View payload:", JSON.stringify(payload));
      console.log("fields state:", JSON.stringify(fields.slice(0,2)));
      console.log("viewFields:", JSON.stringify((activeView.viewFields||[]).slice(0,2)));
      const d = await apiCall("Save View", payload);
      if (d.State === 0) {
        showToast(viewMode === "new" ? "View created" : "View saved");
        const vd = await apiCall("Get Page Views", { PageID: row?.PageID });
        setViews(vd.List0 || []);
        setViewMode(null); setActiveView(null);
      } else showToast(d.Message || "Error");
    } catch { showToast("Save failed"); }
    setViewSaving(false);
  }

  async function deleteView() {
    if (!activeView?.ViewID || !confirm(`Delete view "${activeView.ViewName}"?`)) return;
    try {
      await apiCall("Delete View", { ViewID: activeView.ViewID });
      showToast("View deleted");
      const d = await apiCall("Get Page Views", { PageID: row?.PageID });
      setViews(d.List0 || []);
      setViewMode(null); setActiveView(null);
    } catch { showToast("Delete failed"); }
  }

  async function setDefaultView() {
    if (!activeView?.ViewID) return;
    try {
      await apiCall("Set Default View", { PageID: row?.PageID, ViewID: activeView.ViewID });
      showToast("Default view updated");
      const d = await apiCall("Get Page Views", { PageID: row?.PageID });
      setViews(d.List0 || []);
      setActiveView(p => ({ ...p, IsDefault:1 }));
    } catch { showToast("Failed"); }
  }

  if (initLoading) return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"60vh",gap:16,color:"var(--muted)"}}>
      <div style={{width:44,height:44,border:"4px solid var(--border)",borderTop:"4px solid var(--primary)",borderRadius:"50%",animation:"pmd-spin .8s linear infinite"}} />
      <div style={{fontWeight:900,fontSize:14}}>Loading page data…</div>
      <style>{`@keyframes pmd-spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const fieldItemStyle = (sel) => ({
    padding:"8px 10px", borderRadius:8,
    background: sel ? "var(--primary-soft)" : "var(--surface)",
    border: `1px solid ${sel ? "var(--primary)" : "var(--border)"}`,
    marginBottom:5, cursor:"grab", display:"flex", alignItems:"center",
    gap:7, fontSize:12, fontWeight:800, userSelect:"none",
  });

  const listPanelStyle = {
    background:"var(--surface)", border:"1px solid var(--border)",
    borderRadius:14, overflow:"hidden", display:"flex", flexDirection:"column",
  };

  return (
    <div className="pmd-wrap">
      <div className="pmd-head">
        <div style={{display:"flex",flexDirection:"column",gap:4}}>
          <div style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:"var(--muted)"}}>
            <span style={{cursor:"pointer",color:"var(--primary)",fontWeight:900}} onClick={onBack}>← Pages</span>
            <span>›</span>
            <span style={{color:"var(--text)",fontWeight:800}}>{mode==="add"?"New Page":mode==="edit"?`Edit — ${form.PageName||"…"}`:`${form.PageName||"…"}`}</span>
          </div>
          <h2>{mode==="add"?"Add Page":mode==="edit"?"Edit Page":"View Page"}</h2>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button className="dg-btn" onClick={onBack}>Cancel</button>
          {!isRO && <button className="dg-btn primary" disabled={saving} onClick={handleSave}>{saving?"Saving…":"Save"}</button>}
        </div>
      </div>

      <div className="pmd-tabs">
        <div className={`pmd-tab ${tab==="info"?"active":""}`}   onClick={()=>setTab("info")}>📋 Info</div>
        <div className={`pmd-tab ${tab==="fields"?"active":""}`} onClick={()=>setTab("fields")}>🔧 Fields ({fields.length})</div>
        {mode !== "add" && <div className={`pmd-tab ${tab==="views"?"active":""}`} onClick={()=>{setTab("views");setViewMode(null);setActiveView(null);}}>👁 Views ({views.length})</div>}
        {mode !== "add" && <div className={`pmd-tab ${tab==="filters"?"active":""}`} onClick={()=>setTab("filters")}>🔍 Filters</div>}
        {mode !== "add" && <div className={`pmd-tab ${tab==="groupby"?"active":""}`} onClick={()=>setTab("groupby")}>📊 Group By</div>}
      </div>

      <div className="pmd-body">

        {/* INFO */}
        {tab === "info" && (
          <div className="pmd-grid">
            <div className="full">
              <label className="pmd-label">Page Name</label>
              <input className={`pmd-input${isRO?" ro":""}`} value={form.PageName||""} readOnly={isRO} onChange={e=>setForm(p=>({...p,PageName:e.target.value}))} />
            </div>
            <div>
              <label className="pmd-label">Icon</label>
              <input className={`pmd-input${isRO?" ro":""}`} style={{fontSize:20}} value={form.Icon||""} readOnly={isRO} onChange={e=>setForm(p=>({...p,Icon:e.target.value}))} />
            </div>
            <div>
              <label className="pmd-label">Page Type</label>
              <select className={`pmd-input${isRO?" ro":""}`} value={form.PageType||"grid"} disabled={isRO} onChange={e=>setForm(p=>({...p,PageType:e.target.value}))}>
                <option value="grid">Grid</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div>
              <label className="pmd-label">Database</label>
              <SearchDropdown value={form.DatabaseName||""} disabled={isRO} placeholder="— Select Database —"
                options={databases.map(d=>({value:d.DatabaseName,label:d.DatabaseName}))}
                onChange={v=>{setForm(p=>({...p,DatabaseName:v,SchemaName:"",TableName:""}));loadSchemas(v);}} />
            </div>
            <div>
              <label className="pmd-label">Schema</label>
              <SearchDropdown value={form.SchemaName||""} disabled={isRO||!form.DatabaseName} placeholder="— Select Schema —"
                options={schemas.map(s=>({value:s.SchemaName,label:s.SchemaName}))}
                onChange={v=>{setForm(p=>({...p,SchemaName:v,TableName:""}));loadTables(form.DatabaseName,v);}} />
            </div>
            <div className="full">
              <label className="pmd-label">Table</label>
              <SearchDropdown value={form.TableName||""} disabled={isRO||!form.SchemaName} placeholder="— Select Table —"
                options={tables.map(t=>({value:t.TableName,label:t.TableName}))}
                onChange={v=>{setForm(p=>({...p,TableName:v}));loadTableFields(form.DatabaseName,form.SchemaName,v);}} />
            </div>
            <div className="full">
              <label className="pmd-label">SP Name <span style={{color:"var(--muted)",fontWeight:400,textTransform:"none"}}>(optional)</span></label>
              <input className={`pmd-input${isRO?" ro":""}`} value={form.SPName||""} readOnly={isRO} onChange={e=>setForm(p=>({...p,SPName:e.target.value}))} />
            </div>
          </div>
        )}

        {/* FIELDS */}
        {tab === "fields" && (
          <>
            {!isRO && (
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
                <button className="pmd-ai-btn" style={{marginTop:0}} disabled={aiLoading||!form.TableName} onClick={handleAISuggest}>
                  <span style={{fontSize:15}}>✦</span>{aiLoading?"Thinking…":"AI Suggest Fields"}
                </button>
                {aiSuggestion && !aiLoading && (
                  <>
                    <button className="pmd-ai-apply" style={{marginTop:0}} onClick={applyAI}>✓ Apply All</button>
                    <button className="pmd-ai-dismiss" style={{marginTop:0}} onClick={()=>{setAiSuggestion(null);setAiVisible(false);}}>✕ Dismiss</button>
                  </>
                )}
              </div>
            )}
            {aiVisible && aiLoading && (
              <div className="pmd-ai-panel" style={{marginBottom:12}}>
                <div className="pmd-ai-head"><span>✦</span><span>AI is analyzing fields…</span></div>
                <div className="pmd-ai-typing"><div className="pmd-ai-dot"/><div className="pmd-ai-dot"/><div className="pmd-ai-dot"/></div>
              </div>
            )}
            {aiSuggestion && !aiLoading && (
              <div style={{marginBottom:12,padding:"14px 16px",background:"#ede9fe",border:"1px solid #c4b5fd",borderRadius:12,maxWidth:900}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:16}}>✦</span>
                    <span style={{fontWeight:900,fontSize:13,color:"#7c3aed"}}>{aiText}</span>
                  </div>
                  <div style={{display:"flex",gap:8}}>
                    <button className="pmd-ai-apply" style={{marginTop:0}} onClick={applyAI}>✓ Apply All</button>
                    <button className="pmd-ai-dismiss" style={{marginTop:0}} onClick={()=>{setAiSuggestion(null);setAiVisible(false);}}>✕ Dismiss</button>
                  </div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:7}}>
                  {aiSuggestion.map((s,i) => (
                    <div key={i} style={{background:"#fff",border:"1px solid #c4b5fd",borderRadius:9,padding:"8px 10px",fontSize:12}}>
                      <div style={{fontWeight:900,color:"#4c1d95",marginBottom:4}}>{s.FieldName}</div>
                      <div style={{color:"#6d28d9",fontSize:11,lineHeight:1.5}}>
                        {s.Label && <div>Label: <strong>{s.Label}</strong></div>}
                        {s.Format && <div>Format: <strong>{s.Format}</strong></div>}
                        <div>Visible: <strong>{s.Visible?"Yes":"No"}</strong></div>
                        {s.Reason && <div style={{color:"#7c3aed",marginTop:3,fontStyle:"italic"}}>{s.Reason}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <DataGrid
              title="Fields"
              subtitle={`${fields.length} fields configured`}
              columns={[
                { key:"FieldName", label:"", render:(v) => !isRO ? (
                  <input type="checkbox" checked={selectedFields.has(v)} onChange={()=>toggleCheck(v)}
                    style={{width:16,height:16,cursor:"pointer"}} />
                ) : null },
                { key:"SortOrder", label:"#", numeric:true },
                { key:"FieldName", label:"Field Name" },
                { key:"Label", label:"Label", render:(v,row) => {
                  const idx = fields.findIndex(f=>f.FieldName===row.FieldName);
                  const aiRow = aiSuggestion?.find(s=>s.FieldName===row.FieldName);
                  const changed = aiRow && aiRow.Label !== v;
                  return isRO ? v : (
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <input type="text" value={v||""} onChange={e=>updateLabel(idx,e.target.value)}
                        style={{height:28,border:`1px solid ${changed?"#7c3aed":"var(--border)"}`,borderRadius:7,padding:"0 8px",fontSize:12,flex:1,background:changed?"#ede9fe":"var(--soft)",outline:"none"}} />
                      {changed && <span style={{fontSize:11,color:"#7c3aed",fontWeight:900,cursor:"pointer",whiteSpace:"nowrap"}} onClick={()=>updateLabel(idx,aiRow.Label)}>✦ {aiRow.Label}</span>}
                    </div>
                  );
                }},
                { key:"DataType", label:"Type" },
                { key:"Visible",    label:"Visible", render:(v,row) => { const idx=fields.findIndex(f=>f.FieldName===row.FieldName); return <input type="checkbox" checked={!!v} disabled={isRO} onChange={()=>toggleF(idx,"Visible")} style={{width:16,height:16}} />; }},
                { key:"Sortable",   label:"Sort",    render:(v,row) => { const idx=fields.findIndex(f=>f.FieldName===row.FieldName); return <input type="checkbox" checked={!!v} disabled={isRO} onChange={()=>toggleF(idx,"Sortable")} style={{width:16,height:16}} />; }},
                { key:"Filterable", label:"Filter",  render:(v,row) => { const idx=fields.findIndex(f=>f.FieldName===row.FieldName); return <input type="checkbox" checked={!!v} disabled={isRO} onChange={()=>toggleF(idx,"Filterable")} style={{width:16,height:16}} />; }},
                { key:"Format", label:"Format", render:(v,row) => {
                  const idx=fields.findIndex(f=>f.FieldName===row.FieldName);
                  const aiRow=aiSuggestion?.find(s=>s.FieldName===row.FieldName);
                  const aiFormat=aiRow?.Format;
                  const changed=aiFormat && aiFormat!==v;
                  return isRO ? (v||"") : (
                    <div style={{display:"flex",alignItems:"center",gap:5}}>
                      <select value={v||""} onChange={e=>setFields(p=>p.map((x,i)=>i===idx?{...x,Format:e.target.value}:x))}
                        style={{height:28,border:`1px solid ${changed?"#7c3aed":"var(--border)"}`,borderRadius:7,padding:"0 6px",fontSize:12,background:changed?"#ede9fe":"var(--soft)",outline:"none",flex:1}}>
                        <option value="">— none —</option>
                        <option value="text">Text</option>
                        <option value="number">Number</option>
                        <option value="decimal">Decimal</option>
                        <option value="currency">Currency</option>
                        <option value="date">Date</option>
                        <option value="datetime">DateTime</option>
                        <option value="badge">Badge</option>
                        <option value="boolean">Boolean</option>
                        <option value="image">Image</option>
                        <option value="hidden">Hidden</option>
                        <option value="link">Link</option>
                        <option value="percent">Percent</option>
                      </select>
                      {changed && <span style={{fontSize:10,color:"#7c3aed",fontWeight:900,cursor:"pointer",whiteSpace:"nowrap"}}
                        onClick={()=>setFields(p=>p.map((x,i)=>i===idx?{...x,Format:aiFormat}:x))}>✦ {aiFormat}</span>}
                    </div>
                  );
                }},
                { key:"ColorRules", label:"Color Rules", render:(v,row) => {
                  const idx=fields.findIndex(f=>f.FieldName===row.FieldName);
                  const aiRow=aiSuggestion?.find(s=>s.FieldName===row.FieldName);
                  const isNumeric=["int","decimal","float","bigint","money"].includes(row.DataType);
                  const aiColor=isNumeric&&aiRow?.BadgeColors&&Object.keys(aiRow.BadgeColors).length?JSON.stringify(aiRow.BadgeColors):null;
                  const changed=aiColor && aiColor!==v;
                  return isRO ? (v||"") : (
                    <div style={{display:"flex",alignItems:"center",gap:5}}>
                      <input type="text" value={v||""} placeholder='e.g. {"Active":"green"}'
                        onChange={e=>setFields(p=>p.map((x,i)=>i===idx?{...x,ColorRules:e.target.value}:x))}
                        style={{height:28,border:`1px solid ${changed?"#7c3aed":"var(--border)"}`,borderRadius:7,padding:"0 8px",fontSize:12,flex:1,background:changed?"#ede9fe":"var(--soft)",outline:"none"}} />
                      {changed && <span style={{fontSize:10,color:"#7c3aed",fontWeight:900,cursor:"pointer",whiteSpace:"nowrap"}}
                        onClick={()=>setFields(p=>p.map((x,i)=>i===idx?{...x,ColorRules:aiColor}:x))}>✦ apply</span>}
                    </div>
                  );
                }},
              ]}
              rows={fields.map((f,i)=>({...f,SortOrder:i+1}))}
              extraButtons={[
                ...(!isRO ? [{ label:"☑ Check All", onClick:checkAll }] : []),
                ...(!isRO ? [{ label:"☐ Uncheck All", onClick:uncheckAll }] : []),
                ...(!isRO && selectedFields.size > 0 ? [{ label:`Remove (${selectedFields.size})`, className:"red", onClick:removeSelected }] : []),
                ...(!isRO && tableFields.length > 0 ? [{ label:"↺ Reload from Table", onClick:()=>setFields(tableFields) }] : []),
                ...(!isRO && form.TableName ? [{ label: aiLoading ? "Thinking…" : "✦ AI Suggest", className:"primary", onClick:handleAISuggest }] : []),
                ...(aiSuggestion && !isRO ? [{ label:"✓ Apply All", onClick:applyAI }] : []),
              ]}
            />

          </>
        )}

        {/* VIEWS — list */}
        {tab === "views" && !viewMode && (
          <div className="views-layout">
            <div className="views-sidebar">
              <div className="vs-head">
                <span>Views</span>
                {!isRO && <button className="dg-btn blue" style={{height:28,fontSize:12,padding:"0 10px"}} onClick={newView}>+ New</button>}
              </div>
              <div className="vs-list">
                {views.length === 0 && <div style={{padding:14,color:"var(--muted)",fontSize:12,textAlign:"center"}}>No views yet</div>}
                {views.map(v => (
                  <div key={v.ViewID} className="vs-item" onClick={() => selectView(v)}>
                    <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{v.ViewName}</span>
                    <span className={`vs-badge ${v.IsDefault?"def":"cust"}`}>{v.IsDefault?"Default":"Custom"}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="view-detail">
              <div className="vd-empty">
                <div style={{fontSize:32}}>👁</div>
                <div style={{fontWeight:900,fontSize:14}}>Select a view to edit</div>
                <div style={{fontSize:12,color:"var(--muted)"}}>or click + New to create one</div>
              </div>
            </div>
          </div>
        )}

        {/* VIEWS — editor */}
        {tab === "views" && viewMode && (
          <div>
            {/* Editor head */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:10}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <button className="dg-btn" onClick={()=>{setViewMode(null);setActiveView(null);}}>← Views</button>
                <div style={{fontSize:12,color:"var(--muted)",display:"flex",gap:5,alignItems:"center"}}>
                  <span style={{cursor:"pointer",color:"var(--primary)",fontWeight:900}} onClick={()=>{setViewMode(null);setActiveView(null);}}>Views</span>
                  <span>›</span>
                  <span style={{color:"var(--text)",fontWeight:800}}>{viewMode==="new"?"New View":`Edit — ${activeView?.ViewName||"…"}`}</span>
                </div>
              </div>
              <div style={{display:"flex",gap:8}}>
                {viewMode==="edit" && !isRO && !activeView?.IsDefault && (
                  <button className="dg-btn" style={{color:"var(--green)",borderColor:"var(--green)"}} onClick={setDefaultView}>✓ Set Default</button>
                )}
                {viewMode==="edit" && !isRO && <button className="dg-btn red" onClick={deleteView}>Delete</button>}
                {!isRO && <button className="dg-btn primary" disabled={viewSaving} onClick={saveView}>{viewSaving?"Saving…":"Save View"}</button>}
              </div>
            </div>

            {/* View name + toggle */}
            <div style={{display:"flex",gap:14,alignItems:"flex-end",marginBottom:16,flexWrap:"wrap"}}>
              <div>
                <label style={{display:"block",fontSize:11,fontWeight:900,color:"var(--muted)",textTransform:"uppercase",marginBottom:5}}>View Name</label>
                <input className="pmd-input" style={{width:220}} value={activeView?.ViewName||""} readOnly={isRO}
                  onChange={e=>setActiveView(p=>({...p,ViewName:e.target.value}))} />
              </div>
              <div className="vd-toggle" style={{marginBottom:8}}>
                <div className={`vd-sw ${activeView?.IsDefault?"on":""}`}
                  onClick={()=>!isRO&&setActiveView(p=>({...p,IsDefault:p.IsDefault?0:1}))} />
                <span style={{fontSize:13,fontWeight:800,color:"var(--muted)"}}>{activeView?.IsDefault?"Is Default":"Not Default"}</span>
              </div>
            </div>

            {/* Drag & Drop */}
            <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",gap:12,minHeight:360}}>

              {/* Left — available */}
              <div style={listPanelStyle}>
                <div style={{padding:"9px 12px",borderBottom:"1px solid var(--border)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontWeight:900,fontSize:13}}>Available Fields</span>
                  <span style={{color:"var(--muted)",fontSize:11,fontWeight:800}}>{(activeView?.availFields||[]).length}</span>
                </div>
                <input placeholder="Search..." value={availSearch} onChange={e=>setAvailSearch(e.target.value)}
                  style={{height:30,border:0,borderBottom:"1px solid var(--border)",padding:"0 10px",fontSize:12,outline:"none",background:"var(--soft)"}} />
                <div style={{flex:1,overflow:"auto",padding:6}}
                  onDragOver={e=>{e.preventDefault();setDragOver("avail");}}
                  onDrop={()=>handleDrop("avail")}
                  onDragLeave={()=>setDragOver(null)}>
                  {(activeView?.availFields||[])
                    .filter(f=>(f.Label||f.FieldName||"").toLowerCase().includes(availSearch.toLowerCase()))
                    .map(f => (
                      <div key={f.FieldName}
                        draggable onDragStart={()=>setDragSrc({field:f,from:"avail"})}
                        onDoubleClick={()=>moveFieldToView(f)}
                        onClick={()=>setSelAvail(f.FieldName===selAvail?null:f.FieldName)}
                        style={fieldItemStyle(selAvail===f.FieldName)}>
                        <span style={{color:"var(--muted)"}}>⠿</span>
                        <span style={{flex:1}}>{f.Label||f.FieldName}</span>
                        <span style={{fontSize:10,color:"var(--muted)",background:"var(--soft)",border:"1px solid var(--border)",padding:"2px 6px",borderRadius:5}}>{f.DataType||"nvarchar"}</span>
                      </div>
                    ))}
                  {(activeView?.availFields||[]).length===0 && (
                    <div style={{padding:14,textAlign:"center",color:"var(--muted)",fontSize:12}}>All fields added</div>
                  )}
                </div>
              </div>

              {/* Arrows */}
              <div style={{display:"flex",flexDirection:"column",justifyContent:"center",gap:8,padding:"0 2px"}}>
                {[
                  {label:"→", fn:()=>selAvail&&moveFieldToView((activeView?.availFields||[]).find(f=>f.FieldName===selAvail))},
                  {label:"←", fn:()=>selView&&moveFieldToAvail((activeView?.viewFields||[]).find(f=>f.FieldName===selView))},
                  {label:"All →", fn:addAllFields},
                  {label:"← All", fn:removeAllFields},
                ].map((b,i) => (
                  <button key={i} onClick={b.fn}
                    style={{height:34,width:52,border:"1px solid var(--border)",borderRadius:9,background:"var(--surface)",cursor:"pointer",fontSize:11,fontWeight:900}}>
                    {b.label}
                  </button>
                ))}
              </div>

              {/* Right — view fields */}
              <div style={listPanelStyle}>
                <div style={{padding:"9px 12px",borderBottom:"1px solid var(--border)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontWeight:900,fontSize:13}}>View Fields</span>
                  <span style={{color:"var(--muted)",fontSize:11,fontWeight:800}}>{(activeView?.viewFields||[]).length}</span>
                </div>
                <input placeholder="Search..." value={viewSearch} onChange={e=>setViewSearch(e.target.value)}
                  style={{height:30,border:0,borderBottom:"1px solid var(--border)",padding:"0 10px",fontSize:12,outline:"none",background:"var(--soft)"}} />
                <div style={{flex:1,overflow:"auto",padding:6}}
                  onDragOver={e=>{e.preventDefault();setDragOver("view");}}
                  onDrop={()=>handleDrop("view")}
                  onDragLeave={()=>setDragOver(null)}>
                  {(activeView?.viewFields||[]).length === 0 && (
                    <div className={`dnd-drop-zone ${dragOver==="view"?"over":""}`}>Drop fields here or use →</div>
                  )}
                  {(activeView?.viewFields||[])
                    .filter(f=>(f.Label||f.FieldName||"").toLowerCase().includes(viewSearch.toLowerCase()))
                    .map((f,i) => (
                      <div key={f.FieldName}
                        draggable onDragStart={()=>setDragSrc({field:f,from:"view"})}
                        onDoubleClick={()=>moveFieldToAvail(f)}
                        onClick={()=>setSelView(f.FieldName===selView?null:f.FieldName)}
                        style={fieldItemStyle(selView===f.FieldName)}>
                        <span style={{color:"var(--muted)"}}>⠿</span>
                        <span style={{flex:1}}>{f.Label||f.FieldName}</span>
                        <span style={{fontSize:10,color:"var(--muted)",marginRight:2}}>#{i+1}</span>
                        <button onClick={e=>{e.stopPropagation();moveFieldToAvail(f);}}
                          style={{height:20,width:20,border:0,borderRadius:5,background:"#fee2e2",color:"#dc2626",cursor:"pointer",fontWeight:900,fontSize:11,flexShrink:0}}>✕</button>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "filters" && (
          <FilterTab pageId={row?.PageID} pageFields={fields} isRO={isRO} showToast={showToast} />
        )}

        {tab === "groupby" && (
          <GroupByTab pageId={row?.PageID} pageFields={fields} isRO={isRO} showToast={showToast} />
        )}

      </div>

      {toast && <div className="dg-toast show">{toast}</div>}
    </div>
  );
}
