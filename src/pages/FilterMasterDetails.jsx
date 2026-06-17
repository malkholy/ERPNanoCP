import { useState, useEffect } from "react";
import { apiCall } from "../shared/api.js";
import DataGrid from "../shared/DataGrid.jsx";
import SearchDropdown from "../shared/SearchDropdown.jsx";

const CSS = `
.fmd-wrap{display:flex;flex-direction:column;min-height:calc(100vh - 56px)}
.fmd-head{padding:14px 18px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;background:var(--surface)}
.fmd-head h2{font-size:20px;font-weight:900}
.fmd-body{flex:1;padding:22px;background:var(--bg);overflow:auto}
.fmd-section{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:18px;margin-bottom:16px;max-width:1000px}
.fmd-section-title{font-size:12px;font-weight:900;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:14px;display:flex;align-items:center;justify-content:space-between}
.fmd-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.fmd-grid .full{grid-column:1/-1}
.fmd-label{display:block;font-size:11px;font-weight:900;color:var(--muted);text-transform:uppercase;margin-bottom:6px}
.fmd-input{width:100%;height:42px;border:1px solid var(--border);border-radius:12px;background:var(--surface);padding:0 12px;font-size:13px;font-weight:700;outline:none;color:var(--text)}
.fmd-input:focus{border-color:var(--primary)}
.fmd-input.ro{background:#f1f5f9;color:var(--muted)}
.fmd-order-list{display:flex;flex-direction:column;gap:8px}
.fmd-order-item{display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--soft);border:1px solid var(--border);border-radius:10px}
.fmd-order-num{background:var(--primary-soft);color:var(--primary-dark);width:22px;height:22px;border-radius:50%;display:grid;place-items:center;font-size:11px;font-weight:900;flex-shrink:0}
.fmd-order-name{font-size:13px;font-weight:800;flex:1}
.fmd-order-sel{height:28px;border:1px solid var(--border);border-radius:8px;padding:0 8px;font-size:12px;background:var(--surface);color:var(--text);outline:none}
.fmd-arr{height:24px;width:24px;border:1px solid var(--border);border-radius:6px;background:var(--surface);cursor:pointer;font-size:11px}
.fmd-rm{height:24px;width:24px;border:0;border-radius:6px;background:#fee2e2;color:#dc2626;cursor:pointer;font-weight:900;font-size:12px}
.fmd-add-order{display:flex;gap:8px;margin-top:10px;align-items:center}
`;

function injectCSS() {
  if (document.getElementById("fmd-css")) return;
  const s = document.createElement("style");
  s.id = "fmd-css";
  s.textContent = CSS;
  document.head.appendChild(s);
}

const FILTER_TYPES = ["equals", "contains", "range", "dropdown", "starts"];

export default function FilterMasterDetails({ mode, row, onBack, onSaved }) {
  injectCSS();

  const isRO = mode === "view";
  const [form, setForm]         = useState({ FilterName:"", DatabaseName:"", SchemaName:"", TableName:"", ...row });
  const [fields, setFields]     = useState([]);       // [{FieldName,Label,DataType,FilterType,IsActive,SortOrder}]
  const [orderBy, setOrderBy]   = useState([]);       // [{FieldName,Direction,SortOrder}]
  const [databases, setDatabases] = useState([]);
  const [schemas, setSchemas]   = useState([]);
  const [tables, setTables]     = useState([]);
  const [tableFields, setTableFields] = useState([]);
  const [saving, setSaving]     = useState(false);
  const [initLoading, setInitLoading] = useState(mode !== "add");
  const [addOrderField, setAddOrderField] = useState("");
  const [selectedFields, setSelectedFields] = useState(new Set());
  const [toast, setToast]       = useState("");

  const fieldsLoadedFromDB = { current: false };
  const savedFields = { current: [] };

  useEffect(() => {
    async function init() {
      setInitLoading(true);
      await loadDatabases();
      if (row?.FilterID) {
        try {
          const d = await apiCall("Get Filter Fields", { FilterID: row.FilterID });
          if (d.List0?.length) {
            const mapped = d.List0.map(f => ({
              FieldName:  f.FieldName,
              Label:      f.Label,
              DataType:   f.DataType,
              FilterType: f.FilterType || "equals",
              IsActive:   f.IsActive ? 1 : 0,
              SortOrder:  f.SortOrder,
            }));
            setFields(mapped);
            fieldsLoadedFromDB.current = true;
            const activeFields = mapped.filter(f => f.IsActive === 1).map(f => f.FieldName);
            setSelectedFields(new Set(activeFields));
          }
        } catch { void 0; }
        try {
          const d = await apiCall("Get Filter OrderBy", { FilterID: row.FilterID });
          setOrderBy((d.List0 || []).map(o => ({ FieldName:o.FieldName, Direction:o.Direction || "ASC", SortOrder:o.SortOrder })));
        } catch { void 0; }
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
        const dt = col.DataType || col.DATA_TYPE || "nvarchar";
        return {
          FieldName: name,
          Label: name.replace(/([A-Z])/g," $1").replace(/_/g," ").trim(),
          DataType: dt,
          FilterType: defaultFilterType(dt),
          IsActive: 1,
          SortOrder: i + 1,
        };
      });
      setTableFields(f);
      if (savedFields.current.length > 0) {
        const savedNames = savedFields.current.map(s => s.FieldName);
        const remaining = f.filter(c => !savedNames.includes(c.FieldName));
        const merged = [
          ...savedFields.current.map(s => {
            const col = f.find(c => c.FieldName === s.FieldName);
            return { ...col, ...s };
          }),
          ...remaining,
        ];
        setFields(merged);
        setSelectedFields(new Set(savedNames));
        savedFields.current = [];
        fieldsLoadedFromDB.current = true;
      } else if (!fieldsLoadedFromDB.current) {
        setFields(f);
        setSelectedFields(new Set(f.map(c => c.FieldName)));
      }
    } catch { void 0; }
  }

  function defaultFilterType(dt) {
    const t = (dt || "").toLowerCase();
    if (["int","decimal","float","bigint","money","numeric"].includes(t)) return "range";
    if (["datetime","date","datetime2","smalldatetime"].includes(t)) return "range";
    return "contains";
  }

  // field helpers
  function setFieldProp(i, key, val) { setFields(p => p.map((f,idx) => idx===i ? {...f,[key]:val} : f)); }
  function toggleActive(i) { setFields(p => p.map((f,idx) => idx===i ? {...f,IsActive:f.IsActive?0:1} : f)); }
  function checkAll()   { setSelectedFields(new Set(fields.map(f => f.FieldName))); }
  function uncheckAll() { setSelectedFields(new Set()); }
  function toggleSel(name) { setSelectedFields(p => { const n = new Set(p); n.has(name) ? n.delete(name) : n.add(name); return n; }); }

  // order by helpers
  function addOrder() {
    if (!addOrderField) return;
    if (orderBy.find(o => o.FieldName === addOrderField)) { showToast("Already added"); return; }
    setOrderBy(p => [...p, { FieldName: addOrderField, Direction: "ASC", SortOrder: p.length + 1 }]);
    setAddOrderField("");
  }
  function removeOrder(i)  { setOrderBy(p => p.filter((_,idx) => idx!==i)); }
  function setDirection(i, dir) { setOrderBy(p => p.map((o,idx) => idx===i ? {...o,Direction:dir} : o)); }
  function moveOrder(i, dir) { setOrderBy(p => { const a=[...p]; const t=i+dir; if(t<0||t>=a.length) return a; [a[i],a[t]]=[a[t],a[i]]; return a; }); }

  async function handleSave() {
    if (!form.FilterName) { showToast("Filter Name is required"); return; }
    if (!form.TableName)  { showToast("Please select a table"); return; }
    setSaving(true);
    try {
      const op = mode === "add" ? "Save Filter" : "Update Filter";
      const payload = {
        FilterName:   form.FilterName,
        DatabaseName: form.DatabaseName,
        SchemaName:   form.SchemaName,
        TableName:    form.TableName,
        Fields: fields.map((f,i) => ({
          FieldName:  f.FieldName,
          Label:      f.Label,
          DataType:   f.DataType,
          FilterType: f.FilterType,
          IsActive:   selectedFields.has(f.FieldName) ? 1 : 0,
          SortOrder:  i + 1,
        })),
        OrderBy: orderBy.map((o,i) => ({
          FieldName: o.FieldName,
          Direction: o.Direction,
          SortOrder: i + 1,
        })),
      };
      if (mode !== "add") payload.FilterID = form.FilterID;
      const d = await apiCall(op, payload);
      if (d.State === 0) { showToast(mode === "add" ? "Filter created" : "Filter updated"); onSaved(); }
      else showToast(d.Message || "Error");
    } catch { showToast("Save failed"); }
    setSaving(false);
  }

  if (initLoading) return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"60vh",gap:16,color:"var(--muted)"}}>
      <div style={{width:44,height:44,border:"4px solid var(--border)",borderTop:"4px solid var(--primary)",borderRadius:"50%",animation:"fmd-spin .8s linear infinite"}} />
      <div style={{fontWeight:900,fontSize:14}}>Loading filter data…</div>
      <style>{`@keyframes fmd-spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  // fields available for order-by = active fields not already in orderBy
  const orderByNames = orderBy.map(o => o.FieldName);
  const availOrderFields = fields.filter(f => !orderByNames.includes(f.FieldName));

  return (
    <div className="fmd-wrap">
      {/* Head */}
      <div className="fmd-head">
        <div style={{display:"flex",flexDirection:"column",gap:4}}>
          <div style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:"var(--muted)"}}>
            <span style={{cursor:"pointer",color:"var(--primary)",fontWeight:900}} onClick={onBack}>← Filters</span>
            <span>›</span>
            <span style={{color:"var(--text)",fontWeight:800}}>{mode==="add"?"New Filter":mode==="edit"?`Edit — ${form.FilterName||"…"}`:`${form.FilterName||"…"}`}</span>
          </div>
          <h2>{mode==="add"?"Add Filter":mode==="edit"?"Edit Filter":"View Filter"}</h2>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button className="dg-btn" onClick={onBack}>Cancel</button>
          {!isRO && <button className="dg-btn primary" disabled={saving} onClick={handleSave}>{saving?"Saving…":"Save"}</button>}
        </div>
      </div>

      <div className="fmd-body">

        {/* ── Data Source ── */}
        <div className="fmd-section">
          <div className="fmd-section-title">🗄 Data Source</div>
          <div className="fmd-grid">
            <div className="full">
              <label className="fmd-label">Filter Name</label>
              <input className={`fmd-input${isRO?" ro":""}`} value={form.FilterName||""} readOnly={isRO}
                onChange={e=>setForm(p=>({...p,FilterName:e.target.value}))} placeholder="e.g. Active Customer Orders" />
            </div>
            <div>
              <label className="fmd-label">Database</label>
              <SearchDropdown value={form.DatabaseName||""} disabled={isRO} placeholder="— Select Database —"
                options={databases.map(d=>({value:d.DatabaseName,label:d.DatabaseName}))}
                onChange={v=>{setForm(p=>({...p,DatabaseName:v,SchemaName:"",TableName:""}));loadSchemas(v);}} />
            </div>
            <div>
              <label className="fmd-label">Schema</label>
              <SearchDropdown value={form.SchemaName||""} disabled={isRO||!form.DatabaseName} placeholder="— Select Schema —"
                options={schemas.map(s=>({value:s.SchemaName,label:s.SchemaName}))}
                onChange={v=>{setForm(p=>({...p,SchemaName:v,TableName:""}));loadTables(form.DatabaseName,v);}} />
            </div>
            <div className="full">
              <label className="fmd-label">Table</label>
              <SearchDropdown value={form.TableName||""} disabled={isRO||!form.SchemaName} placeholder="— Select Table —"
                options={tables.map(t=>({value:t.TableName,label:t.TableName}))}
                onChange={v=>{setForm(p=>({...p,TableName:v}));loadTableFields(form.DatabaseName,form.SchemaName,v);}} />
            </div>
          </div>
        </div>

        {/* ── Filter Fields ── */}
        <div className="fmd-section">
          <DataGrid
            title="Filter Fields"
            subtitle={`${selectedFields.size > 0 ? selectedFields.size : fields.length} of ${fields.length} will be saved`}
            columns={[
              { key:"SortOrder", label:"#", numeric:true },
              { key:"FieldName", label:"Field Name" },
              { key:"Label", label:"Label", render:(v,r) => {
                const idx = fields.findIndex(f=>f.FieldName===r.FieldName);
                return isRO ? v : <input type="text" value={v||""} onChange={e=>setFieldProp(idx,"Label",e.target.value)}
                  style={{height:28,border:"1px solid var(--border)",borderRadius:7,padding:"0 8px",fontSize:12,width:"100%",background:"var(--soft)",outline:"none"}} />;
              }},
              { key:"DataType", label:"Type" },
              { key:"FilterType", label:"Filter Type", render:(v,r) => {
                const idx = fields.findIndex(f=>f.FieldName===r.FieldName);
                return isRO ? v : (
                  <select value={v||"equals"} onChange={e=>setFieldProp(idx,"FilterType",e.target.value)}
                    style={{height:28,border:"1px solid var(--border)",borderRadius:7,padding:"0 6px",fontSize:12,background:"var(--soft)",outline:"none"}}>
                    {FILTER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                );
              }},
              { key:"_sel", label:"Save", render:(v,r) => (
                <input type="checkbox" checked={selectedFields.has(r.FieldName)} disabled={isRO} onChange={()=>toggleSel(r.FieldName)} onClick={e => e.stopPropagation()} style={{width:16,height:16,cursor:"pointer"}} />
              )},
            ]}
            rows={fields.map((f,i)=>({...f,SortOrder:i+1}))}
            extraButtons={[
              ...(!isRO ? [{ label:"☑ Check All", onClick:checkAll }] : []),
              ...(!isRO ? [{ label:"☐ Uncheck All", onClick:uncheckAll }] : []),
              ...(!isRO && tableFields.length > 0 ? [{ label:"↺ Reload from Table", onClick:()=>setFields(tableFields) }] : []),
            ]}
          />
        </div>

        {/* ── Order By ── */}
        <div className="fmd-section">
          <div className="fmd-section-title">↕ Order By</div>
          <div className="fmd-order-list">
            {orderBy.length === 0 && <div style={{color:"var(--muted)",fontSize:12,padding:"8px 0"}}>No order fields — add one below</div>}
            {orderBy.map((o,i) => (
              <div key={o.FieldName} className="fmd-order-item">
                <span className="fmd-order-num">{i+1}</span>
                <span className="fmd-order-name">{o.FieldName}</span>
                {!isRO && <>
                  <button className="fmd-arr" onClick={()=>moveOrder(i,-1)}>↑</button>
                  <button className="fmd-arr" onClick={()=>moveOrder(i,1)}>↓</button>
                </>}
                <select className="fmd-order-sel" value={o.Direction} disabled={isRO}
                  onChange={e=>setDirection(i,e.target.value)}>
                  <option value="ASC">ASC</option>
                  <option value="DESC">DESC</option>
                </select>
                {!isRO && <button className="fmd-rm" onClick={()=>removeOrder(i)}>✕</button>}
              </div>
            ))}
          </div>
          {!isRO && (
            <div className="fmd-add-order">
              <div style={{flex:1}}>
                <SearchDropdown value={addOrderField} placeholder="+ Add field to order by..."
                  options={availOrderFields.map(f=>({value:f.FieldName,label:f.FieldName}))}
                  onChange={v=>setAddOrderField(v)} clearable={false} />
              </div>
              <button className="dg-btn primary" onClick={addOrder} style={{whiteSpace:"nowrap"}}>+ Add</button>
            </div>
          )}
        </div>

      </div>

      {toast && <div className="dg-toast show">{toast}</div>}
    </div>
  );
}
