/* Pairyx — interactive visuals (dot grid, ASCII blob, network, radar,
   metaball, deal flow, founder canvases, nav, reveals). */

class PairyxSite {
  constructor(props){ this.props = props || {}; }
  componentDidMount(){
    const p = this.props || {};
    this.cfg = {
      reduceMotion: !!p.reduceMotion,
      dotSpacing: Math.max(22, p.dotSpacing || 38),
      glow: (p.glowIntensity != null ? p.glowIntensity : 1)
    };
    this._cleanup = [];
    this._resizers = [];
    this.injectDefs();
    requestAnimationFrame(() => {
      const safe = (fn) => { try { fn.call(this); } catch(e){ console.warn('px init', e); } };
      safe(this.initNav); safe(this.initDots); safe(this.initAscii); safe(this.initNetwork);
      safe(this.initRadar); safe(this.initMeta); safe(this.initDeal); safe(this.initStruct); safe(this.initMatch); safe(this.initInterview); safe(this.initSides); safe(this.initFounders); safe(this.initScroll);
      this._onResize = () => this._resizers.forEach(r => { try { r(); } catch(e){} });
      window.addEventListener('resize', this._onResize);
      this._cleanup.push(() => window.removeEventListener('resize', this._onResize));
      requestAnimationFrame(this._onResize);
    });
  }
  componentWillUnmount(){ (this._cleanup||[]).forEach(f => { try { f(); } catch(e){} }); }
  renderVals(){ return {}; }

  initNav(){
    const pill=document.getElementById('px-navpill'); const hl=document.getElementById('px-navhl'); if(!pill||!hl) return;
    const links=Array.from(pill.querySelectorAll('.px-navlink'));
    this._navGlow={x:0,y:0,on:0};
    const move=(el)=>{ const pr=pill.getBoundingClientRect(); const r=el.getBoundingClientRect(); hl.style.width=r.width+'px'; hl.style.transform='translateX('+(r.left-pr.left)+'px)'; hl.style.opacity='1'; this._navGlow.x=r.left+r.width/2; this._navGlow.y=r.top+r.height/2; this._navGlow.on=1; };
    const handlers=[];
    links.forEach(el=>{
      const onEnter=()=>move(el);
      const onDown=()=>{ el.style.transform='scale(0.93)'; };
      const onUp=()=>{ el.style.transform=''; };
      el.addEventListener('mouseenter',onEnter); el.addEventListener('mousedown',onDown);
      el.addEventListener('mouseup',onUp); el.addEventListener('mouseleave',onUp);
      handlers.push(()=>{ el.removeEventListener('mouseenter',onEnter); el.removeEventListener('mousedown',onDown); el.removeEventListener('mouseup',onUp); el.removeEventListener('mouseleave',onUp); });
    });
    const onLeave=()=>{ hl.style.opacity='0'; if(this._navGlow) this._navGlow.on=0; };
    pill.addEventListener('mouseleave',onLeave); handlers.push(()=>pill.removeEventListener('mouseleave',onLeave));
    this._cleanup.push(()=>handlers.forEach(f=>f()));
  }

  injectDefs(){
    const el = document.getElementById('px-svgdefs');
    if (el) el.innerHTML = '<svg width="0" height="0"><defs><filter id="px-goo"><feGaussianBlur in="SourceGraphic" stdDeviation="15" result="b"/><feColorMatrix in="b" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 28 -12"/></filter></defs></svg>';
  }

  initDots(){
    const canvas = document.getElementById('px-dots'); if(!canvas) return;
    const ctx = canvas.getContext('2d'); const glow = this.cfg.glow; const sp = this.cfg.dotSpacing;
    let w=0,h=0,dots=[];
    const resize=()=>{ const dpr=Math.min(window.devicePixelRatio||1,2); const r=canvas.getBoundingClientRect(); w=r.width;h=r.height; canvas.width=Math.round(w*dpr); canvas.height=Math.round(h*dpr); ctx.setTransform(dpr,0,0,dpr,0,0); dots=[]; for(let y=sp;y<h;y+=sp){ for(let x=sp;x<w;x+=sp){ dots.push({bx:x,by:y}); } } };
    this._resizers.push(resize); resize();
    let tmx=-9999,tmy=-9999,mxv=-9999,myv=-9999; let ripples=[];
    const onMove=(e)=>{ tmx=e.clientX; tmy=e.clientY; };
    const onDown=(e)=>{ ripples.push({x:e.clientX,y:e.clientY,t:performance.now()}); if(ripples.length>6) ripples.shift(); };
    window.addEventListener('mousemove',onMove); window.addEventListener('mousedown',onDown);
    this._cleanup.push(()=>{ window.removeEventListener('mousemove',onMove); window.removeEventListener('mousedown',onDown); });
    const R=155; let id;
    const loop=()=>{ id=requestAnimationFrame(loop); if(!w) return;
      if(mxv<-9000){ mxv=tmx; myv=tmy; } else { mxv+=(tmx-mxv)*0.12; myv+=(tmy-myv)*0.12; }
      ctx.clearRect(0,0,w,h); const now=performance.now();
      ripples=ripples.filter(rp=> now-rp.t < 1700);
      const ng=this._navGlow; this._ngI=(this._ngI||0)+(((ng&&ng.on)?1:0)-(this._ngI||0))*0.1; const ngI=this._ngI;
      for(let i=0;i<dots.length;i++){ const d=dots[i];
        let bright=0.05, scale=1, ox=0, oy=0;
        const dx=d.bx-mxv, dy=d.by-myv; const dist=Math.sqrt(dx*dx+dy*dy);
        if(dist<R && !this._asciiHover){ const f=1-dist/R; bright+=f*0.85*glow; scale+=f*1.7; const inv=dist>0.001?1/dist:0; ox+=dx*inv*f*9; oy+=dy*inv*f*9; }
        for(const rp of ripples){ const age=(now-rp.t)/1000; const front=age*440; const rdx=d.bx-rp.x, rdy=d.by-rp.y; const rd=Math.sqrt(rdx*rdx+rdy*rdy); const band=Math.abs(rd-front); if(band<72){ const rf=(1-band/72)*Math.max(0,1-age/1.7); bright+=rf*0.9*glow; scale+=rf*1.9; const inv=rd>0.001?1/rd:0; ox+=rdx*inv*rf*7; oy+=rdy*inv*rf*7; } }
        let mint=0;
        if(ngI>0.01){ const ndx=d.bx-ng.x, ndy=d.by-ng.y; const ndd=Math.sqrt(ndx*ndx+ndy*ndy); const NR=165; if(ndd<NR){ const nf=(1-ndd/NR); const w2=nf*nf*ngI; bright+=w2*1.0*glow; scale+=w2*1.3; mint=w2; const pull=ndd>0.001?1/ndd:0; ox-=ndx*pull*w2*6; oy-=ndy*pull*w2*6; } }
        if(bright<=0.0501 && scale<=1.001){ ctx.fillStyle='rgba(255,255,255,0.05)'; ctx.beginPath(); ctx.arc(d.bx,d.by,1.1,0,6.2832); ctx.fill(); continue; }
        const a=Math.min(1,bright); const r=1.1*scale; const ex=Math.min(1,(bright-0.05)/0.9);
        let R0=Math.round(255+(249-255)*ex), G0=Math.round(255+(211-255)*ex), B0=Math.round(255+(138-255)*ex);
        if(mint>0.01){ const mm=Math.min(1,mint*1.4); R0=Math.round(R0+(76-R0)*mm); G0=Math.round(G0+(255-G0)*mm); B0=Math.round(255+(196-255)*mm); }
        ctx.fillStyle='rgba('+R0+','+G0+','+B0+','+a+')';
        ctx.beginPath(); ctx.arc(d.bx+ox,d.by+oy,r,0,6.2832); ctx.fill();
        if(ex>0.35){ ctx.globalCompositeOperation='lighter'; const g=ctx.createRadialGradient(d.bx+ox,d.by+oy,0,d.bx+ox,d.by+oy,r*5); g.addColorStop(0,'rgba(249,211,138,'+(0.25*ex*glow)+')'); g.addColorStop(1,'rgba(249,211,138,0)'); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(d.bx+ox,d.by+oy,r*5,0,6.2832); ctx.fill(); ctx.globalCompositeOperation='source-over'; }
      }
    };
    id=requestAnimationFrame(loop); this._cleanup.push(()=>cancelAnimationFrame(id));
  }

  initAscii(){
    const pre=document.getElementById('px-ascii'); if(!pre) return;
    pre.style.background='linear-gradient(135deg,#8BA4FF 0%,#F9C87A 60%,#F9D38A 100%)'; pre.style.webkitBackgroundClip='text'; pre.style.backgroundClip='text'; pre.style.webkitTextFillColor='transparent'; pre.style.color='transparent';
    const W=110,H=54; const chars=' .,-~:;=!*#$@'; const sm=this.cfg.reduceMotion?0.4:1;
    let idleA=0, scrollEased=(window.scrollY||0), running=true, last=0;
    let mX=-9999, mY=-9999, hover=0;
    const K2=6, K1=126; const XOFF=8;

    // --- Pairyx "P" monogram, sampled into a binary mask, then extruded to 3D ---
    const MW=128, MH=128, MB64="AAAAB//////////gAAAAAAAAAP///////////wAAAAAAAAP////////////gAAAAAAAf////////////+AAAAAAAP/////////////4AAAAAAP//////////////gAAAAAH//////////////+AAAAAH///////////////4AAAAD////////////////AAAAB////////////////4AAAA/////////////////gAAAf////////////////8AAAP/////////////////gAAH///gAAAAAAAAAH///8AAB///AAAAAAAAAAAP///gAA///AAAAAAAAAAAAf//4AAf//AAAAAAAAAAAAB///AAH//gAAAAAAAAAAAAH//4AD//wAAAAAAAAAAAAA///AA//4AAAAAAAAAAAAAD//wAf/8AAAAAAAAAAAAAAf/+AH/+AAAAAAAAAAAAAAD//wD//AAAAAAAAAAAAAAAf/8A//wAAAAAAAAAAAAAAD//gP/4AAAAAAAAAAAAAAAf/4H/8AAAAAAAAAAAAAAAH//B//AAAAAAAAAAAAAAAA//wf/wAAAAAAAAAAAAAAAH/+H/4AAAAAAAAAAAAAAAB//h/+AAAAAAAAAAAAAAAAP/4f/gAAAAAAAAAAAAAAAD//P/4AAAAAAAAAAAAAAAAf/z/8AAAAAAAAAAAAAAAAH/8//AAAAAAAAAAAAAAAAA//v/wAAAAAAAAAAAAAAAAP/7/8AAAAAAAAAAAAAAAAD/+//AAAAAAAAAAAAAAAAAf/v/wAAAAAAAAAAAAAAAAH/7/8AAAAAAAAAAAAAAAAB////AAAAAAAAAAAAAAAAAf///wAAAAAAAAAAAAAAAAH///8AAAAAAAAAAAAAAAAB////AAAAAAAAAAAAAAAAAf///wAAAAAAAAAAAAAAAAD///8AAAAAAAAAAAAAAAAA////AAAAAAAAAAAAAAAAAP///wAAAAAAAAAAAAAAAAD///8AAAAAAAAAAAAAAAAB////AAAAAAAAAAAAAAAAAf///wAAAAAAAAAAAAAAAAH///8AAAAB///////8AAAB////AAAAD///////+AAAAf/v/wAAAD////////AAAAH/7/4AAAD////////wAAAB/+/8AAAB////////4AAAA//v/AAAA////////8AAAAP/7/gAAAf////////AAAAH/8/wAAAP////////gAAAB//P8AAAD////////wAAAAf/z+AAAB////////8AAAAP/4/AAAA////////+AAAAD/+PwAAAP///////+AAAAB//j4AAAH//8AAAAAAAAAA//w8AAAD//4AAAAAAAAAAP/8PAAAB//4AAAAAAAAAAH/+DgAAAf/8AAAAAAAAAAB//g4AAAP/+AAAAAAAAAAA//wMAAAD//AAAAAAAAAAAf/8CAAAB//wAAAAAAAAAAP/+AAAAA//4AAAAAAAAAAD//gAAAAP/8AAAAAAAAAAB//wAAAAH//AAAAAAAAAAA//8AAAAD//gAAAAAAAAAAP/+AAAAA//4AAAAAAAAAAH//AAAAAf/8AAAAAAAAAAD//wAAAAP/+AAAAAAAAAAB//4AAAAD//gAAAAAAAAAA//8AAAAB//wAAAAAAAAAAf/+AAAAA//4AAAAAAAAAAP//AAAAAP/+AAAAAAAAAAP//wAAAAH//AAAAAAAAAAH//4AAAAD//gAAAAAAAAAD//8AAAAA//4AAAAAAAAAB//+AAAAAf/8AAAAAAAAAB///gAAAAH/+AAAAAAAAAA///gAAAAD//gAAAAAAAAB///wAAAAB//wAAAAAAAAB///8AAAAAf/4AAAAAAAAH///8AAAAAP/+AAAAP///////+AAAAAH//AAAAH////////AAAAAB//gAAAB////////gAAAAA//4AAAA////////wAAAAAf/8AAAAf///////wAAAAAH/+AAAAH///////wAAAAAD//gAAAD///////4AAAAAB//wAAAB///////4AAAAAAf/8AAAAf//////4AAAAAAP/+AAAAP//////4AAAAAAH//AAAAH//////wAAAAAAB//wAAAB//////gAAAAAAA//4AAAAH////gAAAAAAAAP/8AAAAAAAAAAAAAAAAAAH//AAAAAAAAAAAAAAAAAAD//gAAAAAAAAAAAAAAAAAA//wAAAAAAAAAAAAAAAAAAf/4AAAAAAAAAAAAAAAAAAP/+AAAAAAAAAAAAAAAAAAD//AAAAAAAAAAAAAAAAAAA//wAAAAAAAAAAAAAAAAAAP/4AAAAAAAAAAAAAAAAAAD/8AAAAAAAAAAAAAAAAAAAf/AAAAAAAAAAAAAAAAAAAH/gAAAAAAAAAAAAAAAAAAB/wAAAAAAAAAAAAAAAAAAA/8AAAAAAAAAAAAAAAAAAAP+AAAAAAAAAAAAAAAAAAAD/AAAAAAAAAAAAAAAAAAAA/wAAAAAAAAAAAAAAAAAAAH4AAAAAAAAAAAAAAAAAAAD8AAAAAAAAAAAAAAAAAAAA/AAAAAAAAAAAAAAAAAAAAPgAAAAAAAAAAAAAAAAAAADwAAAAAAAAAAAAAAAAAAAA8AAAAAAAAAAAAAAAAAAAAOAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAwAAAAAAAAAAAAAAAAAAAAIAAAAAAAAAAAAAAAAAAAAA=";
    const raw=atob(MB64); const mask=new Uint8Array(MW*MH);
    for(let i=0;i<mask.length;i++){ mask[i]=(raw.charCodeAt(i>>3)>>(7-(i&7)))&1; }
    const at=(x,y)=> (x<0||y<0||x>=MW||y>=MH)?0:mask[y*MW+x];

    // build the extruded point cloud once: front face, back face, silhouette walls
    const pts=[]; const SCALE=3.5; const s=SCALE/MW; const cxm=(MW-1)/2, cym=(MH-1)/2; const D=0.55;
    const STEPF=1;                       // face sampling density
    for(let y=0;y<MH;y+=STEPF){ for(let x=0;x<MW;x+=STEPF){ if(!at(x,y)) continue;
      const mx=(x-cxm)*s, my=(cym-y)*s;
      pts.push(mx,my, D, 0,0,1);         // front face
      pts.push(mx,my,-D, 0,0,-1);        // back face
    }}
    const ZW=12;                          // z-samples per wall column
    for(let y=0;y<MH;y++){ for(let x=0;x<MW;x++){ if(!at(x,y)) continue;
      const eL=!at(x-1,y), eR=!at(x+1,y), eU=!at(x,y-1), eD=!at(x,y+1);
      if(!(eL||eR||eU||eD)) continue;     // interior cell -> no wall
      let nx=(eR?1:0)-(eL?1:0), ny=(eU?1:0)-(eD?1:0); const nl=Math.hypot(nx,ny)||1; nx/=nl; ny/=nl;
      const mx=(x-cxm)*s, my=(cym-y)*s;
      for(let k=0;k<=ZW;k++){ const z=-D+(2*D)*k/ZW; pts.push(mx,my,z, nx,ny,0); }
    }}
    const P=new Float32Array(pts); const NP=pts.length/6;

    const onMove=(e)=>{ mX=e.clientX; mY=e.clientY; };
    window.addEventListener('mousemove',onMove); this._cleanup.push(()=>window.removeEventListener('mousemove',onMove));
    const obs=new IntersectionObserver(es=>es.forEach(e=>{ running=e.isIntersecting; if(!running) this._asciiHover=false; }),{threshold:0.02}); obs.observe(pre); this._cleanup.push(()=>obs.disconnect());
    let id;
    const loop=(t)=>{ id=requestAnimationFrame(loop); if(!running) return; if(t-last<32) return; last=t;
      const sy=window.scrollY||window.pageYOffset||0; scrollEased+=(sy-scrollEased)*0.028;
      idleA+=0.0078*sm;
      const A=idleA + scrollEased*0.0017;
      const tilt=-0.16; const cT=Math.cos(tilt), sT=Math.sin(tilt);
      const rect=pre.getBoundingClientRect(); let inside=false, cuX=0, cuY=0;
      if(rect.width>0){ const cw=rect.width/W, chh=rect.height/H; const lx=(mX-rect.left)/cw, ly=(mY-rect.top)/chh; if(lx>=-5&&lx<=W+5&&ly>=-5&&ly<=H+5){ inside=true; cuX=lx; cuY=ly; } }
      hover += ((inside?1:0)-hover)*0.1; this._asciiHover=inside;
      const b=new Array(W*H).fill(' '); const zb=new Array(W*H).fill(0);
      const cA=Math.cos(A),sA=Math.sin(A);
      const Lx=0.30, Ly=0.42, Lz=-0.86;
      for(let i=0;i<NP;i++){ const o=i*6;
        const x=P[o],y=P[o+1],z=P[o+2], nx=P[o+3],ny=P[o+4],nz=P[o+5];
        const x1=x*cA+z*sA, z1=-x*sA+z*cA, y1=y;
        const y2=y1*cT-z1*sT, z2=y1*sT+z1*cT, x2=x1;
        const ooz=1/(K2+z2);
        const xp=Math.floor(W/2+XOFF+K1*ooz*x2), yp=Math.floor(H/2-K1*ooz*y2*0.52);
        if(xp<0||xp>=W||yp<0||yp>=H) continue;
        const idx=xp+W*yp; if(ooz<=zb[idx]) continue; zb[idx]=ooz;
        const nx1=nx*cA+nz*sA, nz1=-nx*sA+nz*cA, ny1=ny;
        const ny2=ny1*cT-nz1*sT, nz2=ny1*sT+nz1*cT, nx2=nx1;
        const Ldot=nx2*Lx+ny2*Ly+nz2*Lz;
        let lum=2 + (Ldot*0.5+0.5)*9.2;
        if(hover>0.01){ const ddx=xp-cuX, ddy=(yp-cuY)*1.55; const dd=Math.sqrt(ddx*ddx+ddy*ddy); const rad=13; if(dd<rad){ lum += (1-dd/rad)*7.5*hover; } }
        lum=Math.floor(lum); if(lum<0)lum=0; if(lum>=chars.length)lum=chars.length-1; b[idx]=chars[lum];
      }
      let out=''; for(let i=0;i<H;i++) out+=b.slice(i*W,i*W+W).join('')+'\n';
      pre.textContent=out;
    };
    id=requestAnimationFrame(loop); this._cleanup.push(()=>cancelAnimationFrame(id));
  }

  initNetwork(){
    const canvas=document.getElementById('px-net'); if(!canvas) return;
    const ctx=canvas.getContext('2d'); const sm=this.cfg.reduceMotion?0.3:1; const glow=this.cfg.glow;
    let w=0,h=0,running=false,prog=0,t=0;
    const resize=()=>{ const dpr=Math.min(window.devicePixelRatio||1,2); const r=canvas.getBoundingClientRect(); w=r.width;h=r.height; canvas.width=Math.round(w*dpr); canvas.height=Math.round(h*dpr); ctx.setTransform(dpr,0,0,dpr,0,0); };
    this._resizers.push(resize); resize();
    const obs=new IntersectionObserver(es=>es.forEach(e=>{ running=e.isIntersecting; }),{threshold:0.06}); obs.observe(canvas); this._cleanup.push(()=>obs.disconnect());
    const bY=[0.2,0.38,0.56,0.74,0.9], cY=[0.12,0.28,0.44,0.6,0.76,0.92];
    const edges=[[1,2,1.0],[0,0,0.4],[1,4,0.42],[2,1,0.5],[2,3,0.4],[3,5,0.5],[4,2,0.34],[0,3,0.3],[3,2,0.58],[4,4,0.38],[0,1,0.3]];
    let id;
    const loop=()=>{ id=requestAnimationFrame(loop); if(!running||!w) return; t+=0.02*sm; prog+=(1-prog)*0.04;
      ctx.clearRect(0,0,w,h); const lx=w*0.15, rx=w*0.85; const pad=h*0.1;
      const bp=bY.map((fy,i)=>({x:lx, y:pad+(h-2*pad)*fy+Math.sin(t+i)*4}));
      const cp=cY.map((fy,i)=>({x:rx, y:pad+(h-2*pad)*fy+Math.sin(t*0.9+i*1.3)*4}));
      for(let k=0;k<edges.length;k++){ const e=edges[k]; const a=bp[e[0]], b=cp[e[1]]; const best=e[2]>=0.99;
        const op=(best?0.95:(0.1+0.16*e[2])*(0.6+0.4*Math.sin(t*1.3+k)))*prog;
        const lg=ctx.createLinearGradient(a.x,a.y,b.x,b.y); lg.addColorStop(0,'rgba(110,139,255,'+op+')'); lg.addColorStop(1,'rgba(249,211,138,'+op+')');
        ctx.strokeStyle=lg; ctx.lineWidth=best?2.2:1; const m=(a.x+b.x)/2; ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.bezierCurveTo(m,a.y,m,b.y,b.x,b.y); ctx.stroke();
      }
      { const a=bp[1], b=cp[2]; const m=(a.x+b.x)/2; const u=(t*0.3)%1; const iv=1-u; const px=iv*iv*iv*a.x+3*iv*iv*u*m+3*iv*u*u*m+u*u*u*b.x; const py=iv*iv*iv*a.y+3*iv*iv*u*a.y+3*iv*u*u*b.y+u*u*u*b.y; ctx.globalCompositeOperation='lighter'; const g=ctx.createRadialGradient(px,py,0,px,py,11); g.addColorStop(0,'rgba(255,255,255,0.95)'); g.addColorStop(1,'rgba(255,255,255,0)'); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(px,py,11,0,6.2832); ctx.fill(); ctx.globalCompositeOperation='source-over'; }
      const node=(p,col,big)=>{ ctx.globalCompositeOperation='lighter'; const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,big?24:14); g.addColorStop(0,'rgba('+col+','+(0.5*glow)+')'); g.addColorStop(1,'rgba('+col+',0)'); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(p.x,p.y,big?24:14,0,6.2832); ctx.fill(); ctx.globalCompositeOperation='source-over'; ctx.fillStyle='rgb('+col+')'; ctx.beginPath(); ctx.arc(p.x,p.y,big?6:4,0,6.2832); ctx.fill(); if(big){ ctx.strokeStyle='rgba('+col+',0.6)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.arc(p.x,p.y,12,0,6.2832); ctx.stroke(); } };
      bp.forEach((p,i)=>node(p,'110,139,255',i===1)); cp.forEach((p,i)=>node(p,'249,211,138',i===2));
      ctx.fillStyle='rgba(180,180,190,0.55)'; ctx.font="11px 'Space Mono', monospace"; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('BRANDS', lx, 16); ctx.fillText('CREATORS', rx, 16);
    };
    id=requestAnimationFrame(loop); this._cleanup.push(()=>cancelAnimationFrame(id));
  }

  initRadar(){
    const canvas=document.getElementById('px-radar'); if(!canvas) return;
    const ctx=canvas.getContext('2d'); let w=0,h=0,running=false,prog=0;
    const resize=()=>{ const dpr=Math.min(window.devicePixelRatio||1,2); const r=canvas.getBoundingClientRect(); w=r.width;h=r.height; canvas.width=Math.round(w*dpr); canvas.height=Math.round(h*dpr); ctx.setTransform(dpr,0,0,dpr,0,0); };
    this._resizers.push(resize); resize();
    const obs=new IntersectionObserver(es=>es.forEach(e=>{ running=e.isIntersecting; }),{threshold:0.12}); obs.observe(canvas); this._cleanup.push(()=>obs.disconnect());
    const labels=['AUDIENCE','CATEGORY','ECONOMICS','VOICE']; const vals=[0.9,0.74,0.66,0.94]; const n=4; let id;
    const loop=()=>{ id=requestAnimationFrame(loop); if(!running||!w) return; prog+=(1-prog)*0.05; ctx.clearRect(0,0,w,h);
      const cx=w/2, cy=h/2; const rad=Math.min(w,h)*0.32; const ang=(i)=>(-Math.PI/2+i*2*Math.PI/n);
      for(let g=1;g<=3;g++){ ctx.strokeStyle='rgba(255,255,255,0.07)'; ctx.lineWidth=1; ctx.beginPath(); for(let i=0;i<=n;i++){ const a=ang(i%n); const rr=rad*g/3; const x=cx+Math.cos(a)*rr, y=cy+Math.sin(a)*rr; if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y); } ctx.stroke(); }
      for(let i=0;i<n;i++){ const a=ang(i); ctx.strokeStyle='rgba(255,255,255,0.09)'; ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx+Math.cos(a)*rad,cy+Math.sin(a)*rad); ctx.stroke(); }
      ctx.beginPath(); for(let i=0;i<n;i++){ const a=ang(i); const rr=rad*vals[i]*prog; const x=cx+Math.cos(a)*rr, y=cy+Math.sin(a)*rr; if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y); } ctx.closePath();
      const lg=ctx.createLinearGradient(cx-rad,cy-rad,cx+rad,cy+rad); lg.addColorStop(0,'rgba(110,139,255,0.3)'); lg.addColorStop(1,'rgba(249,211,138,0.3)'); ctx.fillStyle=lg; ctx.fill(); ctx.strokeStyle='rgba(210,235,228,0.9)'; ctx.lineWidth=1.6; ctx.stroke();
      ctx.font="11px 'Space Mono', monospace"; ctx.textBaseline='middle';
      for(let i=0;i<n;i++){ const a=ang(i); const rr=rad*vals[i]*prog; const x=cx+Math.cos(a)*rr, y=cy+Math.sin(a)*rr; ctx.fillStyle=(i%2)?'#F9D38A':'#6E8BFF'; ctx.beginPath(); ctx.arc(x,y,3.5,0,6.2832); ctx.fill(); const lxp=cx+Math.cos(a)*(rad+24), lyp=cy+Math.sin(a)*(rad+20); ctx.textAlign=Math.abs(Math.cos(a))<0.3?'center':(Math.cos(a)>0?'left':'right'); ctx.fillStyle='rgba(190,190,200,0.85)'; ctx.fillText(labels[i],lxp,lyp); ctx.fillStyle='rgba(120,120,135,0.85)'; ctx.fillText(Math.round(vals[i]*100)+'',lxp,lyp+14); }
    };
    id=requestAnimationFrame(loop); this._cleanup.push(()=>cancelAnimationFrame(id));
  }

  initMeta(){
    const canvas=document.getElementById('px-meta'); if(!canvas) return;
    const ctx=canvas.getContext('2d'); let w=0,h=0,running=false,t=0; const sm=this.cfg.reduceMotion?0.35:1;
    const resize=()=>{ const dpr=Math.min(window.devicePixelRatio||1,2); const r=canvas.getBoundingClientRect(); w=r.width;h=r.height; canvas.width=Math.round(w*dpr); canvas.height=Math.round(h*dpr); ctx.setTransform(dpr,0,0,dpr,0,0); };
    this._resizers.push(resize); resize();
    const obs=new IntersectionObserver(es=>es.forEach(e=>{ running=e.isIntersecting; }),{threshold:0.05}); obs.observe(canvas); this._cleanup.push(()=>obs.disconnect());
    canvas.style.filter='url(#px-goo)';
    let hasP=false, px=0, py=0, fx=0, fy=0, eC=0;
    const onMove=(e)=>{ const r=canvas.getBoundingClientRect(); const rx=(e.clientX-r.left)/r.width, ry=(e.clientY-r.top)/r.height; if(rx>0.04&&rx<0.96&&ry>0.06&&ry<0.94){ hasP=true; px=rx*w; py=ry*h; } else { hasP=false; } };
    window.addEventListener('mousemove',onMove); this._cleanup.push(()=>window.removeEventListener('mousemove',onMove));
    let id;
    const loop=()=>{ id=requestAnimationFrame(loop); if(!running||!w) return; t+=0.012*sm; ctx.clearRect(0,0,w,h);
      const cx=w/2, cy=h/2; const s=Math.min(w,h);
      eC+=((hasP?1:0)-eC)*0.08;
      const tx = hasP ? px : (cx+Math.cos(t*0.5)*s*0.34); const ty = hasP ? py : (cy+Math.sin(t*0.5)*s*0.24);
      fx+=(tx-fx)*0.12; fy+=(ty-fy)*0.12;
      const balls=[
        {x:cx+Math.cos(t)*s*0.06, y:cy+Math.sin(t*1.3)*s*0.05, r:s*0.17, c:'#6E8BFF'},
        {x:cx+Math.cos(t*0.8+2)*s*0.09, y:cy+Math.sin(t*0.9+1)*s*0.07, r:s*0.13, c:'#6E8BFF'},
        {x:cx+Math.cos(-t*0.7)*s*0.12, y:cy+Math.sin(t*0.6)*s*0.05, r:s*0.11, c:'#F9D38A'},
        {x:cx+Math.cos(t*0.5)*s*0.34, y:cy+Math.sin(t*0.5)*s*0.24, r:s*0.075, c:'#F9D38A'},
        {x:cx+Math.cos(t*1.1+4)*s*0.05, y:cy+Math.sin(t*1.4+2)*s*0.06, r:s*0.12, c:'#8F9CFF'},
        {x:fx, y:fy, r:s*(0.075+0.05*eC), c:'#F9D38A'}
      ];
      for(const b of balls){ ctx.fillStyle=b.c; ctx.beginPath(); ctx.arc(b.x,b.y,b.r,0,6.2832); ctx.fill(); }
    };
    id=requestAnimationFrame(loop); this._cleanup.push(()=>cancelAnimationFrame(id));
  }

  initFounders(){
    const accents=['110,139,255','143,156,255','249,211,138'];
    for(let i=0;i<3;i++){ try{ this.setupFounder(i, accents[i]); }catch(e){ console.warn('founder',i,e); } }
  }
  setupFounder(i, accent){
    const parent=document.getElementById('px-fcard-'+i); if(!parent) return;
    const inner=document.getElementById('px-finner-'+i);
    const canvas=document.getElementById('px-fc-'+i);
    const spot=document.getElementById('px-fs-'+i);
    const fimg=document.getElementById('px-fimg-'+i);
    if(!canvas||!inner) return;
    const ctx=canvas.getContext('2d'); const sm=this.cfg.reduceMotion?0.3:1;
    let w=0,h=0,nodes=[]; let seed=(i+1)*9301;
    const rnd=()=>{ seed=(seed*9301+49297)%233280; return seed/233280; };
    const build=()=>{ seed=(i+1)*9301; nodes=[]; const N=13; for(let k=0;k<N;k++){ nodes.push({x:rnd()*w, y:rnd()*h, vx:(rnd()-0.5)*0.3, vy:(rnd()-0.5)*0.3}); } };
    const resize=()=>{ const dpr=Math.min(window.devicePixelRatio||1,2); const r=canvas.getBoundingClientRect(); w=r.width;h=r.height; canvas.width=Math.round(w*dpr); canvas.height=Math.round(h*dpr); ctx.setTransform(dpr,0,0,dpr,0,0); build(); };
    this._resizers.push(resize); resize();
    let tRX=0,tRY=0,cRX=0,cRY=0,eT=0,eC=0,eImg=0;
    const onMove=(e)=>{ const r=parent.getBoundingClientRect(); const nx=(e.clientX-r.left)/r.width-0.5, ny=(e.clientY-r.top)/r.height-0.5; tRY=nx*16; tRX=-ny*16; eT=1; if(spot){ spot.style.background='radial-gradient(circle at '+(e.clientX-r.left)+'px '+(e.clientY-r.top)+'px, rgba('+accent+',0.16), transparent 55%)'; } };
    const onLeave=()=>{ tRX=0; tRY=0; eT=0; };
    parent.addEventListener('mousemove',onMove); parent.addEventListener('mouseleave',onLeave);
    this._cleanup.push(()=>{ parent.removeEventListener('mousemove',onMove); parent.removeEventListener('mouseleave',onLeave); });
    let id;
    const loop=()=>{ id=requestAnimationFrame(loop); if(!w) return;
      cRX+=(tRX-cRX)*0.1; cRY+=(tRY-cRY)*0.1; eC+=(eT-eC)*0.08; eImg+=(eT-eImg)*0.28;
      inner.style.transform='rotateX('+cRX.toFixed(2)+'deg) rotateY('+cRY.toFixed(2)+'deg) scale('+(1+0.025*eC).toFixed(3)+')';
      if(spot) spot.style.opacity=eC.toFixed(3);
      if(fimg){ fimg.style.transform='scale('+(1+0.06*eImg).toFixed(3)+')'; fimg.style.filter='grayscale('+(1-eImg).toFixed(3)+') brightness('+(0.92+0.21*eImg).toFixed(3)+') saturate('+(0.2+0.95*eImg).toFixed(2)+') contrast('+(1+0.05*eImg).toFixed(3)+')'; }
      ctx.clearRect(0,0,w,h);
      const speed=(0.3+eC*1.5)*sm; const maxd=Math.min(w,h)*0.52; const sx=cRY*0.7, sy=-cRX*0.7;
      for(const nd of nodes){ nd.x+=nd.vx*speed; nd.y+=nd.vy*speed; if(nd.x<0||nd.x>w) nd.vx*=-1; if(nd.y<0||nd.y>h) nd.vy*=-1; nd.x=Math.max(0,Math.min(w,nd.x)); nd.y=Math.max(0,Math.min(h,nd.y)); }
      for(let a=0;a<nodes.length;a++){ for(let b=a+1;b<nodes.length;b++){ const dx=nodes[a].x-nodes[b].x, dy=nodes[a].y-nodes[b].y; const d=Math.sqrt(dx*dx+dy*dy); if(d<maxd){ const op=(1-d/maxd)*(0.1+0.5*eC); ctx.strokeStyle='rgba('+accent+','+op+')'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(nodes[a].x+sx,nodes[a].y+sy); ctx.lineTo(nodes[b].x+sx,nodes[b].y+sy); ctx.stroke(); } } }
      for(const nd of nodes){ ctx.globalCompositeOperation='lighter'; const rr=5+9*eC; const g=ctx.createRadialGradient(nd.x+sx,nd.y+sy,0,nd.x+sx,nd.y+sy,rr); g.addColorStop(0,'rgba('+accent+','+(0.45+0.4*eC)+')'); g.addColorStop(1,'rgba('+accent+',0)'); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(nd.x+sx,nd.y+sy,rr,0,6.2832); ctx.fill(); ctx.globalCompositeOperation='source-over'; ctx.fillStyle='rgba('+accent+',0.9)'; ctx.beginPath(); ctx.arc(nd.x+sx,nd.y+sy,1.8,0,6.2832); ctx.fill(); }
    };
    id=requestAnimationFrame(loop); this._cleanup.push(()=>cancelAnimationFrame(id));
  }

  initDeal(){
    const canvas=document.getElementById('px-deal'); if(!canvas) return;
    const ctx=canvas.getContext('2d'); const sm=this.cfg.reduceMotion?0.3:1;
    let w=0,h=0,running=false;
    const resize=()=>{ const dpr=Math.min(window.devicePixelRatio||1,2); const r=canvas.getBoundingClientRect(); w=r.width;h=r.height; canvas.width=Math.round(w*dpr); canvas.height=Math.round(h*dpr); ctx.setTransform(dpr,0,0,dpr,0,0); };
    this._resizers.push(resize); resize();
    const obs=new IntersectionObserver(es=>es.forEach(e=>{ running=e.isIntersecting; }),{threshold:0.05}); obs.observe(canvas); this._cleanup.push(()=>obs.disconnect());
    const labels=['Outreach','Pitch','Negotiate','Signed']; const N=labels.length;
    let raw=0, hold=0, last=0; let nodeX=[]; let cy=0;
    const layout=()=>{ nodeX=[]; const lpad=w*0.16, rpad=w*0.84; for(let i=0;i<N;i++){ nodeX.push(lpad+(rpad-lpad)*(i/(N-1))); } cy=h*0.5; };
    const smooth=(x)=>x*x*(3-2*x);
    const drawCheck=(x,y,s,col)=>{ ctx.strokeStyle=col; ctx.lineWidth=2; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(x-s*0.42,y); ctx.lineTo(x-s*0.08,y+s*0.36); ctx.lineTo(x+s*0.46,y-s*0.4); ctx.stroke(); };
    const lerpC=(a,b,t)=>[Math.round(a[0]+(b[0]-a[0])*t),Math.round(a[1]+(b[1]-a[1])*t),Math.round(a[2]+(b[2]-a[2])*t)];
    const blue=[110,139,255], mint=[249,211,138];
    let id;
    const loop=(t)=>{ id=requestAnimationFrame(loop); if(!running||!w){ last=t; return; } let dt=(t-last)/1000; if(!isFinite(dt)||dt<0) dt=0; if(dt>0.05) dt=0.05; last=t;
      if(!nodeX.length||Math.abs(nodeX[0]-w*0.16)>1) layout();
      if(hold>0){ hold-=dt; } else { raw+=dt*0.62*sm; if(raw>=N-1+0.0001){ raw=0; } }
      const seg=Math.min(N-2,Math.floor(raw)); const frac=raw-seg; const tr=frac<0.62?smooth(frac/0.62):1; const arrived=frac>=0.62||raw>=N-1-0.001;
      const tokenX=nodeX[seg]+(nodeX[seg+1]-nodeX[seg])*tr; const reachedIdx=seg+(arrived?1:0);
      ctx.clearRect(0,0,w,h);
      // base line
      ctx.strokeStyle='rgba(255,255,255,0.1)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(nodeX[0],cy); ctx.lineTo(nodeX[N-1],cy); ctx.stroke();
      // filled line up to token
      const lg=ctx.createLinearGradient(nodeX[0],0,nodeX[N-1],0); lg.addColorStop(0,'rgba(110,139,255,0.9)'); lg.addColorStop(1,'rgba(249,211,138,0.9)'); ctx.strokeStyle=lg; ctx.lineWidth=2.6; ctx.beginPath(); ctx.moveTo(nodeX[0],cy); ctx.lineTo(tokenX,cy); ctx.stroke();
      // moving pulse
      ctx.globalCompositeOperation='lighter'; const pg=ctx.createRadialGradient(tokenX,cy,0,tokenX,cy,46); pg.addColorStop(0,'rgba(200,235,255,0.5)'); pg.addColorStop(1,'rgba(200,235,255,0)'); ctx.fillStyle=pg; ctx.beginPath(); ctx.arc(tokenX,cy,46,0,6.2832); ctx.fill(); ctx.globalCompositeOperation='source-over';
      // nodes
      for(let i=0;i<N;i++){ const x=nodeX[i]; const done=i<=reachedIdx; const col=lerpC(blue,mint,i/(N-1)); const cs='rgb('+col[0]+','+col[1]+','+col[2]+')';
        if(done){ ctx.globalCompositeOperation='lighter'; const g=ctx.createRadialGradient(x,cy,0,x,cy,30); g.addColorStop(0,'rgba('+col[0]+','+col[1]+','+col[2]+',0.5)'); g.addColorStop(1,'rgba('+col[0]+','+col[1]+','+col[2]+',0)'); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,cy,30,0,6.2832); ctx.fill(); ctx.globalCompositeOperation='source-over'; }
        ctx.beginPath(); ctx.arc(x,cy,15,0,6.2832); ctx.fillStyle=done?cs:'rgba(8,18,38,1)'; ctx.fill(); ctx.lineWidth=1.5; ctx.strokeStyle=done?cs:'rgba(255,255,255,0.2)'; ctx.stroke();
        if(done){ drawCheck(x,cy,15,'#071023'); } else { ctx.fillStyle='rgba(255,255,255,0.5)'; ctx.font="600 12px 'Space Mono', monospace"; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(String(i+1),x,cy); }
        ctx.fillStyle=done?'rgba(235,235,242,0.95)':'rgba(150,150,160,0.8)'; ctx.font="13px 'Schibsted Grotesk', sans-serif"; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(labels[i],x,cy+38);
      }
      // token
      ctx.globalCompositeOperation='lighter'; const tg=ctx.createRadialGradient(tokenX,cy,0,tokenX,cy,12); tg.addColorStop(0,'rgba(255,255,255,1)'); tg.addColorStop(1,'rgba(255,255,255,0)'); ctx.fillStyle=tg; ctx.beginPath(); ctx.arc(tokenX,cy,12,0,6.2832); ctx.fill(); ctx.globalCompositeOperation='source-over'; ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(tokenX,cy,3.4,0,6.2832); ctx.fill();
      // top caption
      ctx.fillStyle='rgba(150,150,162,0.85)'; ctx.font="600 17px 'Space Mono', monospace"; ctx.textAlign='left'; ctx.textBaseline='alphabetic'; ctx.save(); ctx.letterSpacing='3px'; ctx.fillText('DEAL FLOW', nodeX[0]-15, cy-h*0.14); ctx.restore();
    };
    id=requestAnimationFrame(loop); this._cleanup.push(()=>cancelAnimationFrame(id));
  }

  initStruct(){
    const chips=Array.from(document.querySelectorAll('.px-chip')); if(!chips.length) return;
    const segA=document.getElementById('px-segA'), segApct=document.getElementById('px-segApct');
    const segB=document.getElementById('px-segB'), segBlabel=document.getElementById('px-segBlabel'), segBpct=document.getElementById('px-segBpct');
    const desc=document.getElementById('px-dealdesc');
    const data={
      cash:{a:100,b:0,bl:'',bc:null,d:'A flat fee paid on delivery — clean and predictable for both sides.'},
      equity:{a:45,b:55,bl:'EQUITY',bc:'rgba(249,211,138,',d:'Part fee, part ownership — aligning the creator with the brand\u2019s long-term growth.'},
      revshare:{a:35,b:65,bl:'REV-SHARE',bc:'rgba(143,156,255,',d:'A smaller base plus a cut of attributable sales — pay that scales with performance.'}
    };
    const apply=(key)=>{ const d=data[key]; if(!d) return;
      if(segA){ segA.style.width=d.a+'%'; } if(segApct){ segApct.textContent=d.a+'%'; }
      if(segB){ segB.style.width=d.b+'%'; if(d.bc) segB.style.background='linear-gradient(135deg,'+d.bc+'0.85),'+d.bc+'0.5)'; }
      if(segBlabel) segBlabel.textContent=d.bl; if(segBpct) segBpct.textContent=d.b?d.b+'%':'';
      if(desc) desc.textContent=d.d;
      chips.forEach(c=>{ const on=c.getAttribute('data-struct')===key; c.style.color=on?'#071023':'#C8C8D2'; c.style.background=on?'#F2F2F4':'rgba(255,255,255,0.03)'; c.style.borderColor=on?'#F2F2F4':'rgba(255,255,255,0.12)'; c.style.fontWeight=on?'600':'400'; });
    };
    const handlers=[];
    chips.forEach(c=>{ const fn=()=>apply(c.getAttribute('data-struct')); c.addEventListener('click',fn); handlers.push(()=>c.removeEventListener('click',fn));
      const oe=()=>{ if(c.style.background.indexOf('242')<0){ c.style.borderColor='rgba(255,255,255,0.3)'; } };
      const ol=()=>{ if(c.style.background.indexOf('242')<0){ c.style.borderColor='rgba(255,255,255,0.12)'; } };
      c.addEventListener('mouseenter',oe); c.addEventListener('mouseleave',ol); handlers.push(()=>{ c.removeEventListener('mouseenter',oe); c.removeEventListener('mouseleave',ol); });
    });
    this._cleanup.push(()=>handlers.forEach(f=>f()));
    apply('cash');
  }

  initSides(){
    const cards=Array.from(document.querySelectorAll('.px-sidecard')); if(!cards.length) return;
    const handlers=[];
    cards.forEach(card=>{
      const accent=card.getAttribute('data-accent')||'110,139,255';
      const spot=card.querySelector('.px-sidespot');
      const onMove=(e)=>{ const r=card.getBoundingClientRect(); const px=e.clientX-r.left, py=e.clientY-r.top; if(spot){ spot.style.left=px+'px'; spot.style.top=py+'px'; } const rx=((py/r.height)-0.5)*-5, ry=((px/r.width)-0.5)*5; card.style.transform='perspective(900px) translateY(-6px) scale(1.02) rotateX('+rx.toFixed(2)+'deg) rotateY('+ry.toFixed(2)+'deg)'; };
      const onEnter=()=>{ card.classList.add('is-on'); if(spot) spot.style.opacity='1'; card.style.borderColor='rgba('+accent+',0.65)'; card.style.boxShadow='0 26px 70px rgba('+accent+',0.22)'; card.style.background='linear-gradient(160deg,rgba('+accent+',0.16),rgba(255,255,255,0.02))'; };
      const onLeave=()=>{ card.classList.remove('is-on'); if(spot) spot.style.opacity='0'; card.style.transform='none'; card.style.borderColor='rgba('+accent+',0.2)'; card.style.boxShadow='none'; card.style.background='linear-gradient(160deg,rgba('+accent+',0.08),rgba(255,255,255,0.015))'; };
      card.addEventListener('mousemove',onMove); card.addEventListener('mouseenter',onEnter); card.addEventListener('mouseleave',onLeave);
      handlers.push(()=>{ card.removeEventListener('mousemove',onMove); card.removeEventListener('mouseenter',onEnter); card.removeEventListener('mouseleave',onLeave); });
    });
    this._cleanup.push(()=>handlers.forEach(f=>f()));
  }

  initInterview(){
    const cards=Array.from(document.querySelectorAll('.px-ivcard')); if(!cards.length) return;
    const handlers=[];
    cards.forEach(card=>{
      const accent=card.getAttribute('data-accent')||'110,139,255';
      const glow=card.querySelector('.px-ivglow'); const arrow=card.querySelector('.px-ivarrow');
      const onMove=(e)=>{ const r=card.getBoundingClientRect(); if(glow){ glow.style.left=(e.clientX-r.left)+'px'; glow.style.top=(e.clientY-r.top)+'px'; } };
      const onEnter=()=>{ card.style.transform='translateY(-4px)'; card.style.borderColor='rgba('+accent+',0.6)'; card.style.background='rgba('+accent+',0.05)'; if(glow) glow.style.opacity='1'; if(arrow){ arrow.style.transform='translateX(4px)'; arrow.style.background='rgba('+accent+',0.16)'; arrow.style.color='#F2F2F4'; } };
      const onLeave=()=>{ card.style.transform='none'; card.style.borderColor='rgba('+accent+',0.24)'; card.style.background='rgba(255,255,255,0.022)'; if(glow) glow.style.opacity='0'; if(arrow){ arrow.style.transform='none'; arrow.style.background='transparent'; arrow.style.color='rgb('+accent+')'; } };
      const onDown=()=>{ card.style.transform='translateY(-1px) scale(0.992)'; };
      const onUp=()=>{ card.style.transform='translateY(-4px)'; };
      card.addEventListener('mousemove',onMove); card.addEventListener('mouseenter',onEnter); card.addEventListener('mouseleave',onLeave); card.addEventListener('mousedown',onDown); card.addEventListener('mouseup',onUp);
      handlers.push(()=>{ card.removeEventListener('mousemove',onMove); card.removeEventListener('mouseenter',onEnter); card.removeEventListener('mouseleave',onLeave); card.removeEventListener('mousedown',onDown); card.removeEventListener('mouseup',onUp); });
    });
    this._cleanup.push(()=>handlers.forEach(f=>f()));
  }

  initMatch(){
    const wrap=document.getElementById('px-match'); if(!wrap) return;
    const rows=Array.from(wrap.querySelectorAll('.px-mrow')); if(!rows.length) return;
    const reasonEl=document.getElementById('px-matchreason');
    let manual=false, autoIdx=0, timer=null;
    const winnerIdx=rows.findIndex(r=>r.getAttribute('data-win')==='1');
    const setActive=(idx)=>{
      rows.forEach((r,i)=>{ const on=i===idx; const win=r.getAttribute('data-win')==='1';
        r.style.transform=on?'translateX(4px) scale(1.015)':'none';
        if(on){ r.style.borderColor=win?'rgba(249,211,138,0.6)':'rgba(110,139,255,0.5)'; r.style.background=win?'rgba(249,211,138,0.1)':'rgba(110,139,255,0.08)'; const dot=r.querySelector('.px-mdot'); if(dot) dot.style.boxShadow='0 0 10px '+(win?'#F9D38A':'#6E8BFF'); }
        else { r.style.borderColor=win?'rgba(249,211,138,0.35)':'rgba(255,255,255,0.07)'; r.style.background=win?'rgba(249,211,138,0.06)':'rgba(255,255,255,0.02)'; const dot=r.querySelector('.px-mdot'); if(dot) dot.style.boxShadow='none'; }
      });
      if(reasonEl){ const txt=rows[idx].getAttribute('data-reason')||''; reasonEl.style.opacity='0'; setTimeout(()=>{ reasonEl.textContent=txt; reasonEl.style.opacity='1'; },180); }
    };
    const startAuto=()=>{ stopAuto(); timer=setInterval(()=>{ if(manual) return; autoIdx=(autoIdx+1)%rows.length; setActive(autoIdx); }, 2100); };
    const stopAuto=()=>{ if(timer){ clearInterval(timer); timer=null; } };
    const handlers=[];
    rows.forEach((r,i)=>{ const oe=()=>{ manual=true; autoIdx=i; setActive(i); }; const ol=()=>{ manual=false; }; r.addEventListener('mouseenter',oe); r.addEventListener('mouseleave',ol); handlers.push(()=>{ r.removeEventListener('mouseenter',oe); r.removeEventListener('mouseleave',ol); }); });
    this._cleanup.push(()=>{ stopAuto(); handlers.forEach(f=>f()); });
    autoIdx=winnerIdx>=0?winnerIdx:0; setActive(autoIdx); startAuto();
  }

  initScroll(){
    const els=Array.from(document.querySelectorAll('[data-reveal]'));
    els.forEach(el=>{ el.style.opacity='0'; el.style.transform='translateY(34px)'; el.style.transition='opacity 1s cubic-bezier(.16,.8,.3,1), transform 1s cubic-bezier(.16,.8,.3,1)'; });
    const ro=new IntersectionObserver(es=>{ es.forEach(e=>{ if(e.isIntersecting){ const el=e.target; const d=parseFloat(el.getAttribute('data-delay')||'0'); el.style.transitionDelay=d+'ms'; el.style.opacity='1'; el.style.transform='none'; ro.unobserve(el); } }); },{threshold:0.12, rootMargin:'0px 0px -8% 0px'});
    els.forEach(el=>ro.observe(el)); this._cleanup.push(()=>ro.disconnect());
    const nav=document.getElementById('px-nav'); const aw=document.getElementById('px-asciiwrap'); const ht=document.getElementById('px-herotext');
    let lastY=window.scrollY||0;
    const onScroll=()=>{ const y=window.scrollY||window.pageYOffset;
      if(nav){ const past=y>window.innerHeight*0.82; const goingDown=y>lastY+2; const goingUp=y<lastY-2;
        if(!past){ nav.style.transform='translateY(0)'; nav.style.opacity='1'; nav.style.pointerEvents='auto'; }
        else if(goingDown){ nav.style.transform='translateY(-150%)'; nav.style.opacity='0'; nav.style.pointerEvents='none'; }
        else if(goingUp){ nav.style.transform='translateY(0)'; nav.style.opacity='1'; nav.style.pointerEvents='auto'; }
      }
      if(aw){ aw.style.transform='translateY('+(y*0.1)+'px)'; aw.style.opacity=String(Math.max(0,1-y/820)); }
      if(ht){ ht.style.transform='translateY('+(y*0.26)+'px)'; ht.style.opacity=String(Math.max(0,1-y/640)); }
      if(Math.abs(y-lastY)>2) lastY=y;
    };
    window.addEventListener('scroll',onScroll,{passive:true}); onScroll(); this._cleanup.push(()=>window.removeEventListener('scroll',onScroll));
  }
}


/* ---- bootstrap -------------------------------------------------------------
   The animation logic above is ported verbatim from the design handoff's
   `class Component extends DCLogic`. Instead of the prototype runtime, we
   instantiate it directly on DOMContentLoaded. */
document.addEventListener('DOMContentLoaded', function () {
  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  var app = new PairyxSite({ reduceMotion: reduce, dotSpacing: 38, glowIntensity: 1 });
  app.componentDidMount();
});
