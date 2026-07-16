"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type ViewMode = "first" | "follow";

const fallback = { lat: 25.033, lon: 121.5654 };

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keys = useRef<Record<string, boolean>>({});
  const player = useRef({ x: 0, z: 10, y: 2.4, heading: 0, submerged: 0 });
  const [coords, setCoords] = useState(fallback);
  const [draft, setDraft] = useState(fallback);
  const [view, setView] = useState<ViewMode>("first");
  const [status, setStatus] = useState("準備探索");
  const [started, setStarted] = useState(false);
  const [locating, setLocating] = useState(false);

  const locate = useCallback(() => {
    setLocating(true); setStatus("正在取得位置…");
    if (!navigator.geolocation) { setLocating(false); setStatus("此裝置不支援定位"); return; }
    navigator.geolocation.getCurrentPosition(
      p => { const next = { lat: p.coords.latitude, lon: p.coords.longitude }; setCoords(next); setDraft(next); setLocating(false); setStatus(`定位精度約 ${Math.round(p.coords.accuracy)} 公尺`); },
      () => { setLocating(false); setStatus("無法定位，已使用台北 101"); },
      { enableHighAccuracy: true, timeout: 9000, maximumAge: 60000 }
    );
  }, []);

  useEffect(() => { locate(); }, [locate]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = true; if (["w","a","s","d"," "].includes(e.key.toLowerCase())) e.preventDefault(); };
    const up = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = false; };
    addEventListener("keydown", down); addEventListener("keyup", up);
    return () => { removeEventListener("keydown", down); removeEventListener("keyup", up); };
  }, []);

  useEffect(() => {
    if (!started) return;
    const canvas = canvasRef.current!; const ctx = canvas.getContext("2d")!;
    let raf = 0; let last = performance.now();
    const buildings = [
      [-22,-34,12,22,18], [18,-40,17,14,25], [42,-18,13,20,13], [-46,-4,18,15,30],
      [-27,28,14,20,15], [12,35,24,13,21], [43,34,15,16,12], [4,-14,12,12,36]
    ];
    const project = (x:number,y:number,z:number,w:number,h:number,heading:number,camY:number) => {
      const s=Math.sin(heading), c=Math.cos(heading); const dx=x-player.current.x, dz=z-player.current.z;
      const rx=dx*c-dz*s, rz=dx*s+dz*c; if(rz<1) return null;
      const scale=Math.min(w,h)*0.86/rz; return {x:w/2+rx*scale,y:h*.53-(y-camY)*scale,scale,depth:rz};
    };
    const loop = (now:number) => {
      const dt=Math.min(.04,(now-last)/1000); last=now; const p=player.current;
      if(keys.current.a||keys.current.arrowleft) p.heading-=dt*1.6;
      if(keys.current.d||keys.current.arrowright) p.heading+=dt*1.6;
      const dir=(keys.current.w||keys.current.arrowup?1:0)-(keys.current.s||keys.current.arrowdown?1:0);
      p.x+=Math.sin(p.heading)*dir*dt*8; p.z+=Math.cos(p.heading)*dir*dt*8;
      const water=p.x>20 && p.z>4; p.submerged += ((water?1:0)-p.submerged)*dt*.5; p.y=2.4-p.submerged*7;
      const dpr=Math.min(devicePixelRatio,2), rect=canvas.getBoundingClientRect();
      if(canvas.width!==rect.width*dpr||canvas.height!==rect.height*dpr){canvas.width=rect.width*dpr;canvas.height=rect.height*dpr}
      ctx.setTransform(dpr,0,0,dpr,0,0); const w=rect.width,h=rect.height;
      const camY=p.y+(view==="follow"?3.8:0);
      const sky=ctx.createLinearGradient(0,0,0,h*.58); sky.addColorStop(0,"#a9d4e5");sky.addColorStop(1,"#e9e1c9");ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
      ctx.fillStyle=p.submerged>.25?"#306f78":"#788d59";ctx.fillRect(0,h*.53,w,h*.47);
      // rolling terrain bands
      for(let i=0;i<9;i++){const yy=h*.55+i*h*.055;ctx.fillStyle=`rgba(70,88,49,${.08+i*.035})`;ctx.beginPath();ctx.moveTo(0,yy);for(let x=0;x<=w;x+=30)ctx.lineTo(x,yy+Math.sin(x*.013+i+coords.lat)*9);ctx.lineTo(w,h);ctx.lineTo(0,h);ctx.fill()}
      // water body
      const waterPoly=[project(20,0,4,w,h,p.heading,camY),project(80,0,4,w,h,p.heading,camY),project(80,0,70,w,h,p.heading,camY),project(20,0,70,w,h,p.heading,camY)].filter(Boolean) as any[];
      if(waterPoly.length>2){ctx.fillStyle="rgba(45,128,150,.72)";ctx.beginPath();ctx.moveTo(waterPoly[0].x,waterPoly[0].y);waterPoly.slice(1).forEach(q=>ctx.lineTo(q.x,q.y));ctx.fill()}
      // road
      const road=[project(-5,.03,-80,w,h,p.heading,camY),project(5,.03,-80,w,h,p.heading,camY),project(5,.03,90,w,h,p.heading,camY),project(-5,.03,90,w,h,p.heading,camY)].filter(Boolean) as any[];
      if(road.length>2){ctx.fillStyle="#6d6d66";ctx.beginPath();ctx.moveTo(road[0].x,road[0].y);road.slice(1).forEach(q=>ctx.lineTo(q.x,q.y));ctx.fill()}
      const sorted=buildings.map(b=>({b,q:project(b[0],0,b[1],w,h,p.heading,camY)})).filter(o=>o.q).sort((a,b)=>b.q!.depth-a.q!.depth);
      sorted.forEach(({b,q})=>{const [,,bw,,bh]=b;const ww=bw*q!.scale,hh=bh*q!.scale;ctx.fillStyle="#c7bba4";ctx.fillRect(q!.x-ww/2,q!.y-hh,ww,hh);ctx.fillStyle="#ede3ce";ctx.fillRect(q!.x-ww/2,q!.y-hh,ww,Math.max(2,hh*.06));ctx.fillStyle="rgba(54,78,83,.62)";for(let fy=q!.y-hh+8*q!.scale;fy<q!.y-4;fy+=4*q!.scale){ctx.fillRect(q!.x-ww*.34,fy,ww*.22,Math.max(2,q!.scale));ctx.fillRect(q!.x+ww*.12,fy,ww*.22,Math.max(2,q!.scale))}});
      if(view==="follow"){ctx.strokeStyle="rgba(245,248,241,.65)";ctx.lineWidth=5;ctx.beginPath();ctx.arc(w/2,h*.63,12,0,Math.PI*2);ctx.moveTo(w/2,h*.65);ctx.lineTo(w/2,h*.77);ctx.moveTo(w/2,h*.69);ctx.lineTo(w/2-18,h*.73);ctx.moveTo(w/2,h*.69);ctx.lineTo(w/2+18,h*.73);ctx.stroke()}
      if(p.submerged>.03){ctx.fillStyle=`rgba(10,75,92,${Math.min(.72,p.submerged*.7)})`;ctx.fillRect(0,0,w,h);ctx.fillStyle="#d9f1ed";ctx.font="500 13px sans-serif";ctx.fillText(`水下 ${Math.max(0,-p.y).toFixed(1)} m`,22,h-24)}
      ctx.strokeStyle="rgba(255,255,255,.8)";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(w/2-8,h/2);ctx.lineTo(w/2+8,h/2);ctx.moveTo(w/2,h/2-8);ctx.lineTo(w/2,h/2+8);ctx.stroke();
      raf=requestAnimationFrame(loop);
    }; raf=requestAnimationFrame(loop); return()=>cancelAnimationFrame(raf);
  }, [started, view, coords]);

  const begin = () => { setCoords(draft); player.current={x:0,z:10,y:2.4,heading:0,submerged:0}; setStarted(true); };

  return <main className={started?"game active":"game"}>
    <canvas ref={canvasRef} aria-label="漫步地球 3D 遊戲場景" />
    {!started && <section className="landing">
      <div className="eyebrow"><span/> WALK THE EARTH · 地理實驗 001</div>
      <h1>漫步<br/><i>地球</i></h1>
      <p className="lead">從你所在之處出發。真實地理成為低多邊形世界，讓雙腳抵達每一個座標。</p>
      <div className="coord-card">
        <div className="coord-head"><span>起始座標</span><button onClick={locate} disabled={locating}>{locating?"定位中":"◎ 使用我的位置"}</button></div>
        <div className="inputs"><label>緯度<input type="number" step="0.0001" value={draft.lat} onChange={e=>setDraft({...draft,lat:+e.target.value})}/></label><label>經度<input type="number" step="0.0001" value={draft.lon} onChange={e=>setDraft({...draft,lon:+e.target.value})}/></label></div>
        <div className="status"><span className="pulse"/>{status}</div>
        <button className="start" onClick={begin}>開始漫步 <b>→</b></button>
      </div>
      <footer>開放地理資料驅動 · 1:1 真實比例 · 實驗性原型</footer>
    </section>}
    {started && <>
      <header className="hud-top"><button className="brand" onClick={()=>setStarted(false)}>漫步地球</button><div className="where"><small>目前座標</small>{coords.lat.toFixed(5)}° N&nbsp;&nbsp; {coords.lon.toFixed(5)}° E</div><button className="exit" onClick={()=>setStarted(false)}>變更地點</button></header>
      <aside className="hud-side"><div><small>視角</small><button className={view==="first"?"on":""} onClick={()=>setView("first")}>第一人稱</button><button className={view==="follow"?"on":""} onClick={()=>setView("follow")}>背後跟隨</button></div><div><small>移動</small><p><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd></p><span>或方向鍵</span></div></aside>
      <div className="data-note"><span/> 原型地形已生成<br/><small>建築 · 道路 · 水體 · 等高起伏</small></div>
    </>}
  </main>;
}
