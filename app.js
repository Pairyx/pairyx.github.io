/* Pairyx: the floating nav (its menu, and the logo turning from gold to white
   as the page scrolls), the living light inside the logo, the spinning ASCII
   "P" on the homepage, the founder photo reveal on touch screens, and redirects
   for links to the old one-page site's sections. */

class PairyxSite {
  constructor(props){ this.props = props || {}; }
  componentDidMount(){
    const p = this.props || {};
    this.cfg = { reduceMotion: !!p.reduceMotion };
    this._cleanup = [];
    const safe = (fn) => { try { fn.call(this); } catch(e){ console.warn('px init', e); } };
    safe(this.initOldAnchors);
    safe(this.initNav);
    requestAnimationFrame(() => { safe(this.initMark); safe(this.initAscii); safe(this.initFounders); });
  }
  componentWillUnmount(){ (this._cleanup||[]).forEach(f => { try { f(); } catch(e){} }); }

  // The site used to be one page; send links to its old sections to the page
  // that holds that content now.
  initOldAnchors(){
    if(location.pathname!=='/' && location.pathname!=='/index.html') return;
    const to={ '#why':'/how-it-works/', '#how':'/how-it-works/', '#sides':'/brands-and-creators/', '#founders':'/about/' }[location.hash];
    if(to) location.replace(to);
  }

  initNav(){
    const nav=document.getElementById('nav'); if(!nav) return;
    const links=nav.querySelector('.links'), toggle=nav.querySelector('.nav-toggle'), lockup=nav.querySelector('.lockup');
    const handlers=[]; const on=(el,ev,fn,o)=>{ el.addEventListener(ev,fn,o); handlers.push(()=>el.removeEventListener(ev,fn,o)); };
    // The pill firms up once the page scrolls under it, and the logo turns from
    // gold to white over the first stretch of the page.
    let queued=false;
    const onScroll=()=>{ if(queued) return; queued=true; requestAnimationFrame(()=>{ queued=false;
      const y=window.scrollY||0; nav.classList.toggle('is-scrolled',y>8);
      if(lockup) lockup.style.setProperty('--w',Math.min(1,y/(window.innerHeight*0.9)).toFixed(3));
    }); };
    on(window,'scroll',onScroll,{passive:true}); onScroll();
    // The menu opens out of the pill; links, Escape, or a click outside close it.
    if(toggle){
      const set=(open)=>{ nav.classList.toggle('is-open',open); document.documentElement.classList.toggle('menu-open',open); toggle.setAttribute('aria-expanded',String(open)); toggle.setAttribute('aria-label',open?'Close menu':'Menu'); };
      on(toggle,'click',()=>set(toggle.getAttribute('aria-expanded')!=='true'));
      if(links) on(links,'click',(e)=>{ if(e.target.closest('a')) set(false); });
      on(document,'keydown',(e)=>{ if(e.key==='Escape'&&nav.classList.contains('is-open')){ set(false); toggle.focus(); } });
      on(document,'pointerdown',(e)=>{ if(nav.classList.contains('is-open')&&!e.target.closest('.nav-pill')) set(false); });
    }
    this._cleanup.push(()=>handlers.forEach(f=>f()));
  }

  // The logo (P and wordmark) is filled by one gold light. It drifts on its own
  // and leans toward the pointer when it comes near the logo.
  initMark(){
    const svg=document.querySelector('.nav .lockup'), light=svg&&svg.querySelector('#px-light'); if(!light||this.cfg.reduceMotion) return;
    const VW=98, VH=30; let px=-1e4, py=-1e4, lx=30, ly=8, id;
    const onMove=(e)=>{ px=e.clientX; py=e.clientY; };
    window.addEventListener('pointermove',onMove,{passive:true}); this._cleanup.push(()=>window.removeEventListener('pointermove',onMove));
    const loop=(t)=>{ id=requestAnimationFrame(loop);
      const r=svg.getBoundingClientRect(); if(!r.width) return;
      let tx=VW/2+(VW*0.48)*Math.sin(t*0.00045), ty=VH/2+(VH*0.6)*Math.sin(t*0.0007+1.3);
      const d=Math.hypot(px-(r.left+r.width/2),py-(r.top+r.height/2)), R=300;
      if(d<R){ const w=1-d/R; const fx=(px-r.left)/r.width*VW, fy=(py-r.top)/r.height*VH;
        tx+=(Math.max(-20,Math.min(VW+20,fx))-tx)*w; ty+=(Math.max(-20,Math.min(VH+20,fy))-ty)*w; }
      lx+=(tx-lx)*0.08; ly+=(ty-ly)*0.08;
      light.setAttribute('cx',lx.toFixed(1)); light.setAttribute('cy',ly.toFixed(1));
    };
    id=requestAnimationFrame(loop); this._cleanup.push(()=>cancelAnimationFrame(id));
  }

  initAscii(){
    const pre=document.getElementById('px-ascii'); if(!pre) return;
    // Solid gold comes from styles.css (#px-ascii); the old gradient-text fill is gone.
    const W=110,H=54; const chars=' .,-~:;=!*#$@'; const sm=this.cfg.reduceMotion?0:1;
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

  // Hover shows a founder in colour. Touch screens have no hover, so there the
  // photo turns to colour once the card is mostly on screen.
  initFounders(){
    const cards=Array.from(document.querySelectorAll('.founder')); if(!cards.length) return;
    if(!window.matchMedia('(hover: none)').matches) return;
    const io=new IntersectionObserver(es=>es.forEach(e=>e.target.classList.toggle('is-on', e.intersectionRatio>=0.6)),{threshold:[0,0.6]});
    cards.forEach(c=>io.observe(c)); this._cleanup.push(()=>io.disconnect());
  }
}


/* ---- bootstrap -------------------------------------------------------------
   initAscii is the logo engine from the original design handoff, kept as is
   apart from its fill (solid gold, from styles.css) and stopping the idle spin
   when the visitor asks for reduced motion. */
document.addEventListener('DOMContentLoaded', function () {
  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  var app = new PairyxSite({ reduceMotion: reduce });
  app.componentDidMount();
});
