import { useState, useEffect } from "react";
import { apiCall } from "../shared/api.js";
import DataGrid from "../shared/DataGrid.jsx";

const CSS = `
.gp-wrap{display:flex;flex-direction:column;min-height:calc(100vh - 56px)}
.gp-head{padding:14px 18px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;background:var(--surface)}
.gp-head h2{font-size:20px;font-weight:900}
.gp-bc{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--muted)}
.gp-bc .lnk{cursor:pointer;color:var(--primary);font-weight:900}
.gp-body{flex:1;padding:22px;background:var(--bg);overflow:auto}
.gp-two{display:grid;grid-template-columns:1fr auto 1fr;gap:12px;min-height:420px}
.gp-panel{background:var(--surface);border:1px solid var(--border);border-radius:14px;overflow:hidden;display:flex;flex-direction:column}
.gp-ph{padding:10px 12px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center}
.gp-ph span{font-weight:900;font-size:13px}
.gp-search{height:30px;border:0;border-bottom:1px solid var(--border);padding:0 10px;font-size:12px;outline:none;background:var(--soft)}
.gp-list{flex:1;overflow:auto;padding:6px}
.gp-item{padding:9px 10px;border-radius:8px;background:var(--surface);border:1px solid var(--border);margin-bottom:5px;cursor:grab;display:flex;align-items:center;gap:8px;font-size:12px;font-weight:800;user-select:none}
.gp-item:hover{border-color:var(--primary)}
.gp-item.sel{background:var(--primary-soft);border-color:var(--primary)}
.gp-arrows{display:flex;flex-direction:column;justify-content:center;gap:8px;padding:0 2px}
.gp-arr{height:34px;width:52px;border:1px solid var(--border);border-radius:9px;background:var(--surface);cursor:pointer;font-size:11px;font-weight:900}
.gp-arr:hover{background:var(--primary-soft);border-color:var(--primary);color:var(--primary-dark)}
.gp-num{background:var(--primary-soft);color:var(--primary-dark);width:20px;height:20px;border-radius:50%;display:grid;place-items:center;font-size:11px;font-weight:900;flex-shrink:0}
.gp-mini{height:22px;width:22px;border:1px solid var(--border);border-radius:6px;background:var(--surface);cursor:pointer;font-size:10px}
.gp-rm{height:22px;width:22px;border:0;border-radius:6px;background:#fee2e2;color:#dc2626;cursor:pointer;font-weight:900;font-size:11px}
.gp-drop{border:2px dashed var(--border);border-radius:8px;padding:20px;text-align:center;color:var(--muted);font-size:12px;font-weight:800;margin:4px}
.gp-drop.over{border-color:var(--primary);background:var(--primary-soft);color:var(--primary-dark)}
`;

function injectCSS() {
  if (document.getElementById("gp-css")) return;
  const s = document.createElement("style");
  s.id = "gp-css"; s.textContent = CSS;
  document.head.appendChild(s);
}

export default function GroupPages() {
  injectCSS();

  const [groups, setGroups]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeGroup, setActiveGroup] = useState(null); // null = list view
  const [toast, setToast]     = useState("");

  // detail state
  const [allPages, setAllPages]       = useState([]);
  const [assigned, setAssigned]       = useState([]); // [{PageID,PageName,Icon,SortOrder}]
  const [availSearch, setAvailSearch] = useState("");
  const [dragSrc, setDragSrc]         = useState(null);
  const [dragOver, setDragOver]       = useState(null);
  const [saving, setSaving]           = useState(false);

  useEffect(() => { loadGroups(); }, []);

  function showToast(m) { setToast(m); setTimeout(()=>setToast(""), 2200); }

  async function loadGroups() {
    setLoading(true);
    try { const d = await apiCall("Get Groups"); setGroups(d.List0 || []); } catch { showToast("Failed to load groups"); }
    setLoading(false);
  }

  async function openGroup(g) {
    setActiveGroup(g);
    setAvailSearch("");
    try {
      const dp = await apiCall("Get Pages"); setAllPages(dp.List0 || []);
    } catch { void 0; }
    try {
      const da = await apiCall("Get Group Pages", { GroupID: g.GroupID });
      setAssigned((da.List0 || []).map(p => ({ PageID:p.PageID, PageName:p.PageName, Icon:p.Icon, SortOrder:p.SortOrder })));
    } catch { setAssigned([]); }
  }
  function backToList() { setActiveGroup(null); setAssigned([]); setAllPages([]); }

  // ── assign helpers ──
  function assignPage(p) {
    if (!p || assigned.find(a => a.PageID === p.PageID)) return;
    setAssigned(prev => [...prev, { PageID:p.PageID, PageName:p.PageName, Icon:p.Icon, SortOrder: prev.length+1 }]);
  }
  function unassignPage(pageId) { setAssigned(prev => prev.filter(a => a.PageID !== pageId)); }
  function assignAll() {
    const used = assigned.map(a => a.PageID);
    const add = allPages.filter(p => !used.includes(p.PageID));
    setAssigned(prev => [...prev, ...add.map((p,i)=>({PageID:p.PageID,PageName:p.PageName,Icon:p.Icon,SortOrder:prev.length+i+1}))]);
  }
  function unassignAll() { setAssigned([]); }
  function move(i, dir) { setAssigned(prev => { const a=[...prev]; const t=i+dir; if(t<0||t>=a.length) return a; [a[i],a[t]]=[a[t],a[i]]; return a; }); }

  function handleDrop(target) {
    if (!dragSrc || dragSrc.from === target) { setDragOver(null); return; }
    if (target === "assigned") assignPage(dragSrc.page);
    else unassignPage(dragSrc.page.PageID);
    setDragSrc(null); setDragOver(null);
  }

  async function save() {
    setSaving(true);
    try {
      // remove all then re-add in order — simplest reliable approach
      // 1. get current to remove
      const current = await apiCall("Get Group Pages", { GroupID: activeGroup.GroupID });
      for (const p of (current.List0 || [])) {
        await apiCall("Remove Group Page", { GroupID: activeGroup.GroupID, PageID: p.PageID });
      }
      // 2. add assigned
      if (assigned.length > 0) {
        await apiCall("Add Group Pages", { GroupID: activeGroup.GroupID, PageIDs: assigned.map(a => a.PageID) });
      }
      // 3. set order
      await apiCall("Update Group Pages Order", {
        GroupID: activeGroup.GroupID,
        Pages: assigned.map((a,i) => ({ PageID: a.PageID, SortOrder: i+1 })),
      });
      showToast("Saved");
    } catch { showToast("Save failed"); }
    setSaving(false);
  }

  // ── LIST VIEW ──
  if (!activeGroup) {
    return (
      <>
        <DataGrid
          title="Group Pages"
          subtitle="Select a group to manage its pages"
          loading={loading}
          columns={[
            { key:"GroupID", label:"ID", numeric:true },
            { key:"GroupName", label:"Group Name" },
          ]}
          rows={groups}
          onEdit={openGroup}
          onRefresh={loadGroups}
        />
        {toast && <div className="dg-toast show">{toast}</div>}
      </>
    );
  }

  // ── DETAIL VIEW ──
  const used = assigned.map(a => a.PageID);
  const avail = allPages.filter(p => !used.includes(p.PageID))
    .filter(p => (p.PageName||"").toLowerCase().includes(availSearch.toLowerCase()));

  return (
    <div className="gp-wrap">
      <div className="gp-head">
        <div style={{display:"flex",flexDirection:"column",gap:4}}>
          <div className="gp-bc">
            <span className="lnk" onClick={backToList}>← Group Pages</span>
            <span>›</span>
            <span style={{color:"var(--text)",fontWeight:800}}>{activeGroup.GroupName}</span>
          </div>
          <h2>Manage Pages — {activeGroup.GroupName}</h2>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button className="dg-btn" onClick={backToList}>Back</button>
          <button className="dg-btn primary" disabled={saving} onClick={save}>{saving?"Saving…":"Save"}</button>
        </div>
      </div>

      <div className="gp-body">
        <div className="gp-two">

          {/* Available */}
          <div className="gp-panel">
            <div className="gp-ph"><span>Available Pages</span><span style={{color:"var(--muted)",fontSize:11,fontWeight:800}}>{avail.length}</span></div>
            <input className="gp-search" placeholder="Search..." value={availSearch} onChange={e=>setAvailSearch(e.target.value)} />
            <div className="gp-list"
              onDragOver={e=>{e.preventDefault();setDragOver("avail");}}
              onDrop={()=>handleDrop("avail")}
              onDragLeave={()=>setDragOver(null)}>
              {avail.map(p => (
                <div key={p.PageID} className="gp-item" draggable
                  onDragStart={()=>setDragSrc({page:p,from:"avail"})}
                  onDoubleClick={()=>assignPage(p)}>
                  <span style={{color:"var(--muted)"}}>⠿</span>
                  <span>{p.Icon} {p.PageName}</span>
                </div>
              ))}
              {avail.length===0 && <div style={{padding:14,textAlign:"center",color:"var(--muted)",fontSize:12}}>All pages assigned</div>}
            </div>
          </div>

          {/* Arrows */}
          <div className="gp-arrows">
            <button className="gp-arr" onClick={assignAll}>All →</button>
            <button className="gp-arr" onClick={unassignAll}>← All</button>
          </div>

          {/* Assigned */}
          <div className="gp-panel">
            <div className="gp-ph"><span>Assigned Pages</span><span style={{color:"var(--muted)",fontSize:11,fontWeight:800}}>{assigned.length}</span></div>
            <div className="gp-list"
              onDragOver={e=>{e.preventDefault();setDragOver("assigned");}}
              onDrop={()=>handleDrop("assigned")}
              onDragLeave={()=>setDragOver(null)}>
              {assigned.length===0 && <div className={`gp-drop ${dragOver==="assigned"?"over":""}`}>Drag pages here or double-click to assign</div>}
              {assigned.map((p,i) => (
                <div key={p.PageID} className="gp-item" draggable
                  onDragStart={()=>setDragSrc({page:p,from:"assigned"})}
                  style={{cursor:"grab"}}>
                  <span className="gp-num">{i+1}</span>
                  <span style={{flex:1}}>{p.Icon} {p.PageName}</span>
                  <button className="gp-mini" onClick={()=>move(i,-1)}>↑</button>
                  <button className="gp-mini" onClick={()=>move(i,1)}>↓</button>
                  <button className="gp-rm" onClick={()=>unassignPage(p.PageID)}>✕</button>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {toast && <div className="dg-toast show">{toast}</div>}
    </div>
  );
}
