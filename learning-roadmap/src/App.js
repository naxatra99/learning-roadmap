import { useState, useEffect, useRef } from "react";

const PHASE_COLORS = [
  "#4A9EFF","#A78BFA","#34D399","#FB923C","#F472B6",
  "#FBBF24","#38BDF8","#F87171","#86EFAC","#FCD34D"
];

const STORAGE_KEY = "zeroToOne_roadmap_v2";

const SYSTEM_PROMPT = `You are an expert learning coach and curriculum designer. Create a detailed, actionable, phased learning roadmap based on the user's inputs.

Respond with ONLY valid JSON — no markdown fences, no explanation, nothing else. Schema:

{
  "topic": "string",
  "tagline": "string — short motivating subtitle",
  "totalWeeks": number,
  "totalHours": number,
  "summary": "string — 2 sentences",
  "stats": [{"label":"string","value":"string"}],
  "phases": [{
    "id": number,
    "code": "string — PHASE 01 etc",
    "title": "string",
    "subtitle": "string",
    "duration": "string — Weeks X–Y",
    "hours": "string — ~N hrs",
    "description": "string — 2-3 sentences",
    "milestone": "string — one concrete verifiable milestone",
    "tracks": [{
      "name": "string",
      "icon": "string — one emoji",
      "items": [{
        "task": "string — specific actionable task",
        "time": "string — e.g. 2h",
        "resource": "string — specific free resource matching their available tools"
      }]
    }]
  }]
}

Rules:
- 4–6 phases, 2–4 tracks each, 3–7 tasks per track
- Tasks must be specific and actionable
- Resources must match user's available resources
- Milestones must be concrete and testable
- Stats: include total weeks, hrs/week, total hours, cost estimate, exam/cert name if applicable
- Early phases = concepts, middle = hands-on, late = projects + mastery
- Output ONLY the JSON object.`;

const QUESTIONS = [
  { id:"topic", label:"What do you want to master?", hint:"Be specific — e.g. 'Machine Learning', 'Guitar', 'SAP MM', 'Copywriting'", type:"text", placeholder:"e.g. Python for Data Science" },
  { id:"goal", label:"What's your end goal?", hint:"What does success look like for you?", type:"options", allowCustom:true, options:["Get a job / switch careers","Get certified","Build a personal project","Become a consultant / freelancer","Academic / research purposes","Personal growth & curiosity"] },
  { id:"hoursPerWeek", label:"How many hours can you dedicate per week?", hint:"Be honest — consistency beats intensity", type:"options", options:["1–3 hours (light)","4–7 hours (moderate)","8–15 hours (serious)","15+ hours (intensive)"] },
  { id:"resources", label:"What learning resources do you have access to?", hint:"Select everything that applies", type:"multi", options:["YouTube / free video content","A sandbox / practice environment","Official documentation","Budget for paid courses (Udemy, Coursera etc.)","A mentor or colleague to learn from","Books or physical materials","Platform-specific LMS (SAP, AWS, etc.)"] }
];

function deepClone(o) { return JSON.parse(JSON.stringify(o)); }
function loadStored() { try { const r=localStorage.getItem(STORAGE_KEY); return r?JSON.parse(r):null; } catch { return null; } }
function persist(data) { try { localStorage.setItem(STORAGE_KEY,JSON.stringify(data)); } catch {} }

function Editable({ value, onChange, style={}, multiline=false, editMode }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef();
  useEffect(()=>{ if(editing&&ref.current) ref.current.focus(); },[editing]);
  useEffect(()=>{ setDraft(value); },[value]);
  if(!editMode) return <span style={style}>{value}</span>;
  if(!editing) return <span onClick={()=>{setDraft(value);setEditing(true);}} title="Click to edit" style={{...style,cursor:"text",borderBottom:"1px dashed rgba(255,255,255,0.25)",paddingBottom:1}}>{value}</span>;
  const commit=()=>{ setEditing(false); if(draft.trim()) onChange(draft.trim()); else setDraft(value); };
  const ps={ ref, value:draft, onChange:e=>setDraft(e.target.value), onBlur:commit, onKeyDown:e=>{ if(e.key==="Enter"&&!multiline){e.preventDefault();commit();} if(e.key==="Escape"){setEditing(false);setDraft(value);} }, style:{...style,background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.3)",borderRadius:4,padding:"2px 6px",outline:"none",color:"inherit",fontFamily:"inherit",fontSize:"inherit",fontWeight:"inherit",width:"100%",resize:multiline?"vertical":"none"} };
  return multiline?<textarea rows={3} {...ps}/>:<input {...ps}/>;
}

const S = {
  root:{ fontFamily:"'DM Sans','Segoe UI',sans-serif",background:"#060B14",minHeight:"100vh",color:"#E2E8F0" },
  landingWrap:{ maxWidth:620,margin:"0 auto",padding:"12vh 24px 48px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center" },
  intakeWrap:{ maxWidth:540,margin:"0 auto",padding:"56px 24px 80px" },
  smallBtn:{ background:"#1E293B",border:"1px solid #2D3748",borderRadius:5,color:"#94A3B8",fontSize:11,padding:"3px 7px",cursor:"pointer",fontFamily:"inherit" }
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  ::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-track{background:#0A0F1A;}::-webkit-scrollbar-thumb{background:#1E293B;border-radius:2px;}
  .btn-primary{display:inline-flex;align-items:center;gap:8px;padding:13px 26px;background:#4A9EFF;color:#000;border:none;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;transition:all 0.15s;}
  .btn-primary:hover{background:#6AB4FF;transform:translateY(-1px);}
  .btn-ghost{display:inline-flex;align-items:center;gap:6px;padding:9px 16px;background:#1E293B;color:#94A3B8;border:1px solid #2D3748;border-radius:8px;font-size:13px;cursor:pointer;font-family:inherit;transition:all 0.15s;}
  .btn-ghost:hover{background:#273444;color:#E2E8F0;}
  .big-input{width:100%;padding:15px 18px;background:#0F172A;border:1px solid #2D3748;border-radius:12px;color:#F8FAFC;font-size:16px;outline:none;font-family:inherit;transition:border-color 0.15s;}
  .big-input:focus{border-color:#4A9EFF;}
  .opt-btn{width:100%;display:flex;align-items:center;gap:12px;padding:13px 16px;background:#0F172A;border:1px solid #1E293B;border-radius:12px;color:#CBD5E1;font-size:14px;cursor:pointer;font-family:inherit;transition:all 0.15s;}
  .opt-btn:hover{border-color:#2D3748;background:#131F2E;}
  .opt-btn.sel{border-color:#4A9EFF66;background:rgba(74,158,255,0.08);color:#F8FAFC;}
  .phase-card{transition:transform 0.15s;}
  .phase-card:hover{transform:translateY(-2px);}
  .trk-hdr:hover{background:rgba(255,255,255,0.03)!important;}
  .task-row:hover{background:rgba(255,255,255,0.025)!important;}
  .fade-in{animation:fadeUp 0.3s ease;}
  @keyframes fadeUp{from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:translateY(0);}}
  @keyframes spin{to{transform:rotate(360deg);}}
  @keyframes pdot{0%,100%{opacity:0.25;}50%{opacity:1;}}
`;

export default function App() {
  const [screen,setScreen]       = useState("landing");
  const [step,setStep]           = useState(0);
  const [answers,setAnswers]     = useState({});
  const [customGoal,setCustomGoal] = useState("");
  const [roadmap,setRoadmap]     = useState(null);
  const [checked,setChecked]     = useState({});
  const [activePhase,setActivePhase] = useState(null);
  const [expandedTrack,setExpandedTrack] = useState(null);
  const [editMode,setEditMode]   = useState(false);
  const [genError,setGenError]   = useState(null);
  const [genStatus,setGenStatus] = useState("");

  useEffect(()=>{ const s=loadStored(); if(s?.roadmap){setRoadmap(s.roadmap);setChecked(s.checked||{});setScreen("dashboard");} },[]);
  useEffect(()=>{ if(roadmap) persist({roadmap,checked}); },[roadmap,checked]);

async function generateRoadmap(ans) {
  setScreen("generating"); 
  setGenError(null); 
  setGenStatus("Analysing your learning profile...");
  
  const msgs=[[900,"Designing your phase structure..."],[2100,"Building tasks and milestones..."],[3400,"Sourcing resources for each task..."],[4600,"Calibrating timeline to your schedule..."],[5600,"Almost there..."]];
  const timers=msgs.map(([ms,m])=>setTimeout(()=>setGenStatus(m),ms));
  const resList=Array.isArray(ans.resources)?ans.resources.join(", "):ans.resources;
  
  try {
    const res=await fetch("https://learning-roadmap-api.onrender.com/api/generate-roadmap",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({topic:ans.topic,goal:ans.goal,hoursPerWeek:ans.hoursPerWeek,resources:resList})
    });
    
    timers.forEach(clearTimeout);
    
    if(!res.ok) {
      const errorData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      throw new Error(errorData.error || `Server error ${res.status}`);
    }
    
    const data = await res.json();
    if (!data || typeof data !== 'object') {
      throw new Error("Invalid response format from server");
    }
    
    setRoadmap(data);
    setChecked({});
    setActivePhase(null);
    setExpandedTrack(null);
    setEditMode(false);
    setScreen("dashboard");
  } catch(e) {
    timers.forEach(clearTimeout);
    console.error("Generation error:", e);
    setGenError(e.message || "Something went wrong. Check server logs for details.");
    setScreen("intake");
  }
}

  const q=QUESTIONS[step]; const curAns=answers[q?.id];
  function canAdvance(){ if(!q) return false; if(q.type==="text") return !!(curAns?.trim()); if(q.type==="options"){ if(curAns==="__custom__") return customGoal.trim().length>0; return !!curAns; } if(q.type==="multi") return Array.isArray(curAns)&&curAns.length>0; return false; }
  function handleOpt(v){ setAnswers(a=>({...a,[q.id]:v})); }
  function toggleMulti(v){ const c=curAns||[]; setAnswers(a=>({...a,[q.id]:c.includes(v)?c.filter(x=>x!==v):[...c,v]})); }
  function advance(){ if(!canAdvance()) return; const fa={...answers}; if(q.id==="goal"&&answers.goal==="__custom__") fa.goal=customGoal; if(step<QUESTIONS.length-1) setStep(s=>s+1); else generateRoadmap(fa); }

  // editing
  const up=(fn)=>setRoadmap(r=>{const n=deepClone(r);fn(n);return n;});
  function updPhase(pid,f,v){ up(n=>{const p=n.phases.find(p=>p.id===pid);if(p)p[f]=v;}); }
  function delPhase(pid){ up(n=>{n.phases=n.phases.filter(p=>p.id!==pid);}); if(activePhase===pid)setActivePhase(null); }
  function addPhase(){ up(n=>{const id=Math.max(...n.phases.map(p=>p.id),0)+1;n.phases.push({id,code:`PHASE ${String(id).padStart(2,"0")}`,title:"New Phase",subtitle:"Add a subtitle",duration:"Weeks ?–?",hours:"~? hrs",description:"Describe this phase.",milestone:"Define a milestone.",tracks:[{name:"New Track",icon:"📌",items:[{task:"Add your first task",time:"1h",resource:"Add a resource"}]}]}); }); }
  function updTrack(pid,ti,f,v){ up(n=>{const p=n.phases.find(p=>p.id===pid);if(p&&p.tracks[ti])p.tracks[ti][f]=v;}); }
  function delTrack(pid,ti){ up(n=>{const p=n.phases.find(p=>p.id===pid);if(p)p.tracks.splice(ti,1);}); }
  function addTrack(pid){ up(n=>{const p=n.phases.find(p=>p.id===pid);if(p)p.tracks.push({name:"New Track",icon:"📌",items:[{task:"Add your first task",time:"1h",resource:"Add a resource"}]});}); }
  function updTask(pid,ti,ii,f,v){ up(n=>{const p=n.phases.find(p=>p.id===pid);if(p?.tracks[ti]?.items[ii])p.tracks[ti].items[ii][f]=v;}); }
  function delTask(pid,ti,ii){ up(n=>{const p=n.phases.find(p=>p.id===pid);if(p?.tracks[ti])p.tracks[ti].items.splice(ii,1);}); }
  function addTask(pid,ti){ up(n=>{const p=n.phases.find(p=>p.id===pid);if(p?.tracks[ti])p.tracks[ti].items.push({task:"New task — click to edit",time:"1h",resource:"Add a resource"});}); }
  function moveTask(pid,ti,ii,dir){ up(n=>{const p=n.phases.find(p=>p.id===pid);if(!p?.tracks[ti])return;const its=p.tracks[ti].items;const ni=ii+dir;if(ni<0||ni>=its.length)return;[its[ii],its[ni]]=[its[ni],its[ii]];}); }

  const allKeys=roadmap?roadmap.phases.flatMap((p)=>p.tracks.flatMap((t,ti)=>t.items.map((_,ii)=>`${p.id}-${ti}-${ii}`))): [];
  const doneCount=allKeys.filter(k=>checked[k]).length;
  const pct=allKeys.length?Math.round((doneCount/allKeys.length)*100):0;
  const phaseObj=roadmap?.phases.find(p=>p.id===activePhase);
  const phaseC=phaseObj?PHASE_COLORS[(phaseObj.id-1)%PHASE_COLORS.length]:"#4A9EFF";

  // ── LANDING
  if(screen==="landing") return (
    <div style={S.root}><style>{CSS}</style>
      <div style={S.landingWrap}>
        <div style={{fontFamily:"'Space Mono',monospace",fontSize:11,letterSpacing:"0.3em",color:"#4A9EFF",textTransform:"uppercase",marginBottom:22}}>Zero → One</div>
        <h1 style={{fontSize:"clamp(34px,6vw,66px)",fontWeight:800,lineHeight:1.05,color:"#F8FAFC",fontFamily:"'Syne',sans-serif",marginBottom:18}}>
          Learn anything.<br/><span style={{color:"#4A9EFF"}}>Master everything.</span>
        </h1>
        <p style={{fontSize:16,color:"#94A3B8",maxWidth:440,lineHeight:1.8,marginBottom:38}}>
          Answer 4 questions. Get a personalised AI-generated learning roadmap — phases, tasks, milestones and resources tailored to your goals and schedule.
        </p>
        <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
          <button className="btn-primary" onClick={()=>{setStep(0);setAnswers({});setCustomGoal("");setScreen("intake");}}>Build my roadmap →</button>
          {loadStored()?.roadmap&&<button className="btn-ghost" onClick={()=>setScreen("dashboard")}>Continue my roadmap</button>}
        </div>
        <div style={{marginTop:44,display:"flex",gap:24,flexWrap:"wrap"}}>
          {["AI-generated in seconds","Fully editable","Progress tracking","Saves automatically"].map(f=>(
            <div key={f} style={{display:"flex",alignItems:"center",gap:7}}>
              <div style={{width:5,height:5,borderRadius:"50%",background:"#4A9EFF"}}/>
              <span style={{fontSize:12,color:"#4B5563"}}>{f}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ── INTAKE
  if(screen==="intake") return (
    <div style={S.root}><style>{CSS}</style>
      <div style={S.intakeWrap}>
        <button className="btn-ghost" style={{marginBottom:28,padding:"6px 13px",fontSize:12}} onClick={()=>step===0?setScreen("landing"):setStep(s=>s-1)}>← Back</button>
        {genError&&<div style={{background:"rgba(248,113,113,0.1)",border:"1px solid rgba(248,113,113,0.3)",borderRadius:12,padding:"13px 18px",marginBottom:22,color:"#FCA5A5",fontSize:13}}>⚠ {genError}</div>}
        <div style={{display:"flex",gap:6,marginBottom:36}}>
          {QUESTIONS.map((_,i)=><div key={i} style={{height:3,flex:1,borderRadius:3,background:i<step?"#4A9EFF":i===step?"#4A9EFF55":"#1E293B",transition:"background 0.3s"}}/>)}
        </div>
        <div className="fade-in" key={step}>
          <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:"#4A9EFF",letterSpacing:"0.2em",marginBottom:10}}>{step+1} / {QUESTIONS.length}</div>
          <h2 style={{fontSize:"clamp(20px,4vw,28px)",fontWeight:700,color:"#F8FAFC",fontFamily:"'Syne',sans-serif",marginBottom:7}}>{q.label}</h2>
          <p style={{fontSize:13,color:"#64748B",marginBottom:26}}>{q.hint}</p>
          {q.type==="text"&&<input className="big-input" placeholder={q.placeholder} value={curAns||""} onChange={e=>setAnswers(a=>({...a,[q.id]:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&advance()} autoFocus/>}
          {q.type==="options"&&(
            <div style={{display:"flex",flexDirection:"column",gap:9}}>
              {q.options.map(o=>(
                <button key={o} className={`opt-btn ${curAns===o?"sel":""}`} onClick={()=>handleOpt(o)}>
                  <span style={{flex:1,textAlign:"left"}}>{o}</span>
                  {curAns===o&&<span style={{color:"#4A9EFF",fontSize:13}}>✓</span>}
                </button>
              ))}
              {q.allowCustom&&<div>
                <button className={`opt-btn ${curAns==="__custom__"?"sel":""}`} onClick={()=>handleOpt("__custom__")}>
                  <span style={{flex:1,textAlign:"left",color:"#94A3B8"}}>Something else...</span>
                  {curAns==="__custom__"&&<span style={{color:"#4A9EFF",fontSize:13}}>✓</span>}
                </button>
                {curAns==="__custom__"&&<input className="big-input" style={{marginTop:9,fontSize:14}} placeholder="Describe your goal..." value={customGoal} onChange={e=>setCustomGoal(e.target.value)} autoFocus/>}
              </div>}
            </div>
          )}
          {q.type==="multi"&&(
            <div style={{display:"flex",flexDirection:"column",gap:9}}>
              {q.options.map(o=>{const sel=(curAns||[]).includes(o);return(
                <button key={o} className={`opt-btn ${sel?"sel":""}`} onClick={()=>toggleMulti(o)}>
                  <span style={{flex:1,textAlign:"left"}}>{o}</span>
                  <div style={{width:17,height:17,borderRadius:4,border:`2px solid ${sel?"#4A9EFF":"#374151"}`,background:sel?"#4A9EFF":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    {sel&&<span style={{color:"#000",fontSize:10,fontWeight:700}}>✓</span>}
                  </div>
                </button>
              );})}
            </div>
          )}
          <button className="btn-primary" style={{marginTop:30,opacity:canAdvance()?1:0.35,cursor:canAdvance()?"pointer":"not-allowed"}} onClick={advance}>
            {step===QUESTIONS.length-1?"Generate my roadmap →":"Next →"}
          </button>
        </div>
      </div>
    </div>
  );

  // ── GENERATING
  if(screen==="generating") return (
    <div style={S.root}><style>{CSS}</style>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",gap:28,padding:24}}>
        <div style={{position:"relative",width:76,height:76}}>
          <svg width="76" height="76" viewBox="0 0 76 76" style={{animation:"spin 2s linear infinite"}}>
            <circle cx="38" cy="38" r="30" fill="none" stroke="#1E293B" strokeWidth="6"/>
            <circle cx="38" cy="38" r="30" fill="none" stroke="#4A9EFF" strokeWidth="6" strokeDasharray="55 133" strokeLinecap="round" transform="rotate(-90 38 38)"/>
          </svg>
          <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>🧠</div>
        </div>
        <div style={{textAlign:"center"}}>
          <h2 style={{fontSize:22,fontWeight:700,color:"#F8FAFC",fontFamily:"'Syne',sans-serif",marginBottom:7}}>Building your roadmap</h2>
          <p style={{fontSize:13,color:"#64748B",minHeight:18,transition:"opacity 0.3s"}}>{genStatus}</p>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:9,width:"100%",maxWidth:300}}>
          {["Analysing topic","Designing phases","Writing tasks","Matching resources","Calibrating timeline"].map((s,i)=>(
            <div key={s} style={{display:"flex",alignItems:"center",gap:11}}>
              <div style={{width:18,height:18,borderRadius:"50%",background:"#4A9EFF15",border:"1px solid #4A9EFF33",display:"flex",alignItems:"center",justifyContent:"center",animation:`pdot 1.5s ease-in-out ${i*0.28}s infinite`}}>
                <div style={{width:5,height:5,borderRadius:"50%",background:"#4A9EFF"}}/>
              </div>
              <span style={{fontSize:12,color:"#475569"}}>{s}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ── DASHBOARD
  if(screen==="dashboard"&&roadmap){
    const phases=roadmap.phases;
    return(
      <div style={S.root}><style>{CSS}</style>
        {/* TOPBAR */}
        <div style={{background:"#08101C",borderBottom:"1px solid #1E293B",padding:"0 20px",position:"sticky",top:0,zIndex:100}}>
          <div style={{maxWidth:1080,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",height:52,gap:12}}>
            <div style={{display:"flex",alignItems:"center",gap:10,overflow:"hidden"}}>
              <span style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:"#4A9EFF",letterSpacing:"0.2em",flexShrink:0}}>ZERO→ONE</span>
              <span style={{color:"#1E293B",flexShrink:0}}>|</span>
              <span style={{fontSize:13,fontWeight:600,color:"#F8FAFC",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{roadmap.topic}</span>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
              <button onClick={()=>setEditMode(e=>!e)}
                style={{display:"flex",alignItems:"center",gap:5,padding:"5px 12px",
                  background:editMode?"rgba(251,191,36,0.12)":"#1E293B",
                  border:editMode?"1px solid rgba(251,191,36,0.4)":"1px solid #2D3748",
                  borderRadius:7,fontSize:12,color:editMode?"#FBBF24":"#94A3B8",cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s"}}>
                {editMode?"✏️ Editing":"✏️ Edit"}
              </button>
              <button className="btn-ghost" style={{fontSize:11,padding:"5px 12px"}}
                onClick={()=>{if(window.confirm("Start a new roadmap? Current one will be replaced.")){localStorage.removeItem(STORAGE_KEY);setRoadmap(null);setChecked({});setStep(0);setAnswers({});setScreen("intake");}}}>
                New
              </button>
            </div>
          </div>
        </div>

        <div style={{maxWidth:1080,margin:"0 auto",padding:"24px 20px 80px"}}>
          {/* HERO */}
          <div style={{marginBottom:24}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:16,flexWrap:"wrap"}}>
              <div>
                <h1 style={{fontSize:"clamp(24px,4vw,38px)",fontWeight:800,color:"#F8FAFC",fontFamily:"'Syne',sans-serif",lineHeight:1.1}}>{roadmap.topic}</h1>
                <p style={{fontSize:13,color:"#4A9EFF",marginTop:5,fontStyle:"italic"}}>{roadmap.tagline}</p>
                <p style={{fontSize:12,color:"#64748B",marginTop:9,maxWidth:520,lineHeight:1.75}}>{roadmap.summary}</p>
              </div>
              <div style={{textAlign:"center",flexShrink:0}}>
                <svg width="84" height="84" viewBox="0 0 84 84">
                  <circle cx="42" cy="42" r="33" fill="none" stroke="#1E293B" strokeWidth="7"/>
                  <circle cx="42" cy="42" r="33" fill="none" stroke="#4A9EFF" strokeWidth="7"
                    strokeDasharray={`${2*Math.PI*33}`} strokeDashoffset={`${2*Math.PI*33*(1-pct/100)}`}
                    strokeLinecap="round" transform="rotate(-90 42 42)" style={{transition:"stroke-dashoffset 0.5s ease"}}/>
                  <text x="42" y="47" textAnchor="middle" fill="#F8FAFC" fontSize="16" fontWeight="800" fontFamily="Syne">{pct}%</text>
                </svg>
                <div style={{fontSize:10,color:"#475569",fontFamily:"'Space Mono',monospace",marginTop:3}}>{doneCount}/{allKeys.length}</div>
              </div>
            </div>
            <div style={{display:"flex",gap:9,marginTop:16,flexWrap:"wrap"}}>
              {(roadmap.stats||[]).map(s=>(
                <div key={s.label} style={{background:"#0F172A",border:"1px solid #1E293B",borderRadius:9,padding:"7px 14px"}}>
                  <div style={{fontSize:9,color:"#475569",textTransform:"uppercase",letterSpacing:"0.1em"}}>{s.label}</div>
                  <div style={{fontSize:14,fontWeight:700,color:"#F8FAFC",fontFamily:"'Space Mono',monospace"}}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* TIMELINE BAR */}
          <div style={{display:"flex",background:"#08101C",borderRadius:11,overflow:"hidden",border:"1px solid #1E293B",marginBottom:20}}>
            {phases.map((p,i)=>{
              const c=PHASE_COLORS[(p.id-1)%PHASE_COLORS.length];const act=activePhase===p.id;
              return(
                <div key={p.id} onClick={()=>{setActivePhase(act?null:p.id);setExpandedTrack(null);}}
                  style={{flex:1,padding:"9px 3px",textAlign:"center",cursor:"pointer",
                    borderRight:i<phases.length-1?"1px solid #1E293B":"none",
                    background:act?`${c}20`:"transparent",
                    borderBottom:act?`2px solid ${c}`:"2px solid transparent",transition:"all 0.15s"}}>
                  <div style={{fontFamily:"'Space Mono',monospace",fontSize:8,color:c,letterSpacing:"0.08em"}}>{p.code}</div>
                  <div style={{fontSize:10,fontWeight:600,color:act?"#F8FAFC":"#94A3B8",marginTop:2}}>{p.title}</div>
                  <div style={{fontSize:9,color:"#475569",marginTop:1}}>{p.duration}</div>
                </div>
              );
            })}
            {editMode&&<div onClick={addPhase} title="Add phase"
              style={{padding:"9px 14px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#4A9EFF",fontSize:18,borderLeft:"1px solid #1E293B",flexShrink:0}}>+</div>}
          </div>

          {/* OVERVIEW GRID */}
          {!activePhase&&(
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(272px,1fr))",gap:14}}>
              {phases.map(p=>{
                const c=PHASE_COLORS[(p.id-1)%PHASE_COLORS.length];
                const pKeys=p.tracks.flatMap((t,ti)=>t.items.map((_,ii)=>`${p.id}-${ti}-${ii}`));
                const pDone=pKeys.filter(k=>checked[k]).length;
                const pPct=pKeys.length?Math.round((pDone/pKeys.length)*100):0;
                return(
                  <div key={p.id} className="phase-card"
                    style={{background:"#0F172A",border:`1px solid ${c}30`,borderRadius:14,padding:20,boxShadow:`0 0 18px ${c}0a`,cursor:"pointer",position:"relative"}}
                    onClick={()=>{setActivePhase(p.id);setExpandedTrack(null);}}>
                    {editMode&&<button onClick={e=>{e.stopPropagation();delPhase(p.id);}}
                      style={{position:"absolute",top:9,right:9,background:"rgba(248,113,113,0.1)",border:"1px solid rgba(248,113,113,0.25)",borderRadius:5,color:"#F87171",fontSize:10,padding:"2px 7px",cursor:"pointer",fontFamily:"inherit"}}>del</button>}
                    <div style={{display:"flex",justifyContent:"space-between"}}>
                      <div style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:c,letterSpacing:"0.15em"}}>{p.code}</div>
                      <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:"#475569"}}>{p.hours}</div>
                    </div>
                    <h3 style={{fontSize:18,fontWeight:700,color:"#F8FAFC",marginTop:9,fontFamily:"'Syne',sans-serif"}}>{p.title}</h3>
                    <div style={{fontSize:12,color:c,marginTop:2}}>{p.subtitle}</div>
                    <p style={{fontSize:11,color:"#94A3B8",marginTop:9,lineHeight:1.65}}>{p.description}</p>
                    <div style={{marginTop:12,padding:"9px 11px",background:`${c}0f`,borderRadius:7,borderLeft:`3px solid ${c}`}}>
                      <div style={{fontSize:9,color:c,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:3}}>Milestone</div>
                      <div style={{fontSize:11,color:"#CBD5E1",lineHeight:1.55}}>{p.milestone}</div>
                    </div>
                    <div style={{marginTop:12}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                        <span style={{fontSize:10,color:"#475569"}}>{p.duration}</span>
                        <span style={{fontSize:10,color:c,fontFamily:"'Space Mono',monospace"}}>{pDone}/{pKeys.length}</span>
                      </div>
                      <div style={{height:2,background:"#1E293B",borderRadius:2}}>
                        <div style={{height:2,background:c,borderRadius:2,width:`${pPct}%`,transition:"width 0.4s ease"}}/>
                      </div>
                    </div>
                  </div>
                );
              })}
              {editMode&&(
                <div onClick={addPhase} style={{background:"#0F172A",border:"1px dashed #1E293B",borderRadius:14,padding:20,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:7,cursor:"pointer",color:"#374151",minHeight:180}}>
                  <div style={{fontSize:28}}>+</div><div style={{fontSize:12}}>Add phase</div>
                </div>
              )}
            </div>
          )}

          {/* PHASE DETAIL */}
          {activePhase&&phaseObj&&(()=>{
            const p=phaseObj;const c=PHASE_COLORS[(p.id-1)%PHASE_COLORS.length];
            const pIdx=phases.findIndex(x=>x.id===p.id);
            return(
              <div>
                <button className="btn-ghost" style={{marginBottom:18,fontSize:11,padding:"5px 12px"}} onClick={()=>{setActivePhase(null);setExpandedTrack(null);}}>← All phases</button>
                {/* phase header */}
                <div style={{background:"#0F172A",border:`1px solid ${c}40`,borderRadius:16,padding:24,marginBottom:18,boxShadow:`0 0 36px ${c}0d`}}>
                  <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:14}}>
                    <div style={{flex:1,minWidth:240}}>
                      <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:c,letterSpacing:"0.18em"}}>{p.code}</div>
                      <h2 style={{fontSize:24,fontWeight:800,color:"#F8FAFC",marginTop:5,fontFamily:"'Syne',sans-serif"}}>
                        <Editable value={p.title} editMode={editMode} onChange={v=>updPhase(p.id,"title",v)} style={{fontSize:24,fontWeight:800,color:"#F8FAFC",fontFamily:"'Syne',sans-serif"}}/>
                      </h2>
                      <div style={{fontSize:14,color:c,marginTop:2}}>
                        <Editable value={p.subtitle} editMode={editMode} onChange={v=>updPhase(p.id,"subtitle",v)} style={{fontSize:14,color:c}}/>
                      </div>
                      <div style={{fontSize:12,color:"#94A3B8",marginTop:9,lineHeight:1.75,maxWidth:500}}>
                        <Editable value={p.description} editMode={editMode} multiline onChange={v=>updPhase(p.id,"description",v)} style={{fontSize:12,color:"#94A3B8"}}/>
                      </div>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:7,flexShrink:0}}>
                      {[["Duration",p.duration,"duration"],["Hours",p.hours,"hours"],["Tracks",p.tracks.length,null],["Tasks",p.tracks.flatMap(t=>t.items).length,null]].map(([k,v,f])=>(
                        <div key={k} style={{background:"#1E293B",borderRadius:9,padding:"7px 14px",textAlign:"right",minWidth:100}}>
                          <div style={{fontSize:9,color:"#64748B",textTransform:"uppercase",letterSpacing:"0.1em"}}>{k}</div>
                          <div style={{fontSize:14,fontWeight:700,color:"#F8FAFC",fontFamily:"'Space Mono',monospace"}}>
                            {f?<Editable value={v} editMode={editMode} onChange={val=>updPhase(p.id,f,val)} style={{fontSize:14,fontWeight:700,color:"#F8FAFC",fontFamily:"'Space Mono',monospace"}}/>:v}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{marginTop:16,padding:"12px 14px",background:`${c}12`,borderRadius:9,borderLeft:`4px solid ${c}`}}>
                    <div style={{fontSize:9,color:c,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:4}}>🏆 Milestone</div>
                    <div style={{fontSize:12,color:"#E2E8F0",lineHeight:1.65}}>
                      <Editable value={p.milestone} editMode={editMode} multiline onChange={v=>updPhase(p.id,"milestone",v)} style={{fontSize:12,color:"#E2E8F0"}}/>
                    </div>
                  </div>
                  {editMode&&<button onClick={()=>delPhase(p.id)} style={{marginTop:12,background:"rgba(248,113,113,0.08)",border:"1px solid rgba(248,113,113,0.25)",borderRadius:7,color:"#F87171",fontSize:11,padding:"5px 13px",cursor:"pointer",fontFamily:"inherit"}}>🗑 Delete phase</button>}
                </div>

                {/* TRACKS */}
                {p.tracks.map((track,ti)=>{
                  const isOpen=expandedTrack===ti;
                  const tDone=track.items.filter((_,ii)=>checked[`${p.id}-${ti}-${ii}`]).length;
                  return(
                    <div key={ti} style={{marginBottom:9,background:"#0F172A",border:"1px solid #1E293B",borderRadius:12,overflow:"hidden"}}>
                      <div className="trk-hdr" style={{padding:"14px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,cursor:"pointer"}}
                        onClick={()=>setExpandedTrack(isOpen?null:ti)}>
                        <div style={{display:"flex",alignItems:"center",gap:9}}>
                          {editMode
                            ?<input value={track.icon} onChange={e=>updTrack(p.id,ti,"icon",e.target.value)} onClick={e=>e.stopPropagation()}
                               style={{width:32,fontSize:18,background:"transparent",border:"1px dashed #374151",borderRadius:3,textAlign:"center",outline:"none",cursor:"text"}}/>
                            :<span style={{fontSize:18}}>{track.icon}</span>}
                          <div>
                            <div style={{fontWeight:600,fontSize:13,color:"#F8FAFC"}}>
                              <Editable value={track.name} editMode={editMode} onChange={v=>updTrack(p.id,ti,"name",v)} style={{fontWeight:600,fontSize:13,color:"#F8FAFC"}}/>
                            </div>
                            <div style={{fontSize:10,color:"#64748B",marginTop:1}}>{track.items.length} tasks</div>
                          </div>
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:10}}>
                          <div style={{display:"flex",gap:3}}>{track.items.map((_,ii)=><div key={ii} style={{width:5,height:5,borderRadius:"50%",background:checked[`${p.id}-${ti}-${ii}`]?c:"#2D3748",transition:"background 0.2s"}}/>)}</div>
                          <span style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:c}}>{tDone}/{track.items.length}</span>
                          {editMode&&<button onClick={e=>{e.stopPropagation();delTrack(p.id,ti);}} style={{background:"rgba(248,113,113,0.08)",border:"1px solid rgba(248,113,113,0.2)",borderRadius:5,color:"#F87171",fontSize:10,padding:"2px 7px",cursor:"pointer",fontFamily:"inherit"}}>✕</button>}
                          <span style={{color:"#475569",fontSize:12,transform:isOpen?"rotate(180deg)":"rotate(0)",transition:"transform 0.2s",display:"block"}}>▼</span>
                        </div>
                      </div>
                      {isOpen&&(
                        <div style={{borderTop:"1px solid #1E293B"}}>
                          {track.items.map((item,ii)=>{
                            const key=`${p.id}-${ti}-${ii}`;const done=!!checked[key];
                            return(
                              <div key={ii} className="task-row"
                                style={{padding:"13px 20px",display:"flex",alignItems:"flex-start",gap:11,
                                  borderBottom:ii<track.items.length-1?"1px solid #1E293B":"none",
                                  background:done?`${c}06`:"transparent"}}>
                                <div onClick={()=>setChecked(ck=>({...ck,[key]:!ck[key]}))}
                                  style={{width:19,height:19,borderRadius:4,marginTop:2,flexShrink:0,
                                    border:`2px solid ${done?c:"#374151"}`,background:done?c:"transparent",
                                    display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",transition:"all 0.15s"}}>
                                  {done&&<span style={{color:"#000",fontSize:10,fontWeight:700,lineHeight:1}}>✓</span>}
                                </div>
                                <div style={{flex:1,minWidth:0}}>
                                  <div style={{fontSize:13,color:done?"#64748B":"#E2E8F0",textDecoration:done?"line-through":"none",lineHeight:1.55}}>
                                    <Editable value={item.task} editMode={editMode} multiline onChange={v=>updTask(p.id,ti,ii,"task",v)} style={{fontSize:13,color:done?"#64748B":"#E2E8F0"}}/>
                                  </div>
                                  <div style={{display:"flex",gap:14,marginTop:4,flexWrap:"wrap"}}>
                                    <div style={{display:"flex",alignItems:"center",gap:3}}>
                                      <span style={{fontSize:10,color:"#475569"}}>⏱</span>
                                      <Editable value={item.time} editMode={editMode} onChange={v=>updTask(p.id,ti,ii,"time",v)} style={{fontSize:10,color:"#64748B",fontFamily:"'Space Mono',monospace"}}/>
                                    </div>
                                    <div style={{display:"flex",alignItems:"center",gap:3,flex:1,minWidth:0}}>
                                      <span style={{fontSize:10,color:"#475569",flexShrink:0}}>🔗</span>
                                      <Editable value={item.resource} editMode={editMode} onChange={v=>updTask(p.id,ti,ii,"resource",v)} style={{fontSize:10,color:"#4A9EFF"}}/>
                                    </div>
                                  </div>
                                </div>
                                {editMode&&(
                                  <div style={{display:"flex",flexDirection:"column",gap:3,flexShrink:0}}>
                                    <button onClick={()=>moveTask(p.id,ti,ii,-1)} style={S.smallBtn} title="Up">↑</button>
                                    <button onClick={()=>moveTask(p.id,ti,ii,1)} style={S.smallBtn} title="Down">↓</button>
                                    <button onClick={()=>delTask(p.id,ti,ii)} style={{...S.smallBtn,color:"#F87171",borderColor:"rgba(248,113,113,0.3)"}} title="Delete">✕</button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                          {editMode&&(
                            <div style={{padding:"9px 20px",borderTop:"1px solid #1E293B"}}>
                              <button onClick={()=>addTask(p.id,ti)} style={{background:"transparent",border:"1px dashed #2D3748",borderRadius:7,color:"#4A9EFF",fontSize:12,padding:"7px 14px",cursor:"pointer",fontFamily:"inherit",width:"100%"}}>+ Add task</button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {editMode&&<button onClick={()=>addTrack(p.id)} style={{width:"100%",marginTop:9,background:"transparent",border:"1px dashed #2D3748",borderRadius:11,color:"#4A9EFF",fontSize:12,padding:"13px",cursor:"pointer",fontFamily:"inherit"}}>+ Add track to this phase</button>}

                <div style={{display:"flex",justifyContent:"space-between",marginTop:22}}>
                  {pIdx>0?<button className="btn-ghost" style={{fontSize:12}} onClick={()=>{setActivePhase(phases[pIdx-1].id);setExpandedTrack(null);}}>← {phases[pIdx-1].title}</button>:<div/>}
                  {pIdx<phases.length-1
                    ?<button className="btn-ghost" style={{fontSize:12,color:c,borderColor:`${c}40`,background:`${c}0f`}} onClick={()=>{setActivePhase(phases[pIdx+1].id);setExpandedTrack(null);}}>
                      {phases[pIdx+1].title} →
                    </button>
                    :<div style={{fontSize:12,color:"#FBBF24",padding:"7px 14px",background:"rgba(251,191,36,0.08)",borderRadius:7}}>🎓 Final phase!</div>}
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    );
  }
  return null;
}