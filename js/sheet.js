/* product sheet + carousel + lightbox */
function slideHTML(src, realIdx, p, eager){
  return '<div class="carousel-slide" data-i="'+realIdx+'">'
    +(src
      ? '<img src="'+esc(src)+'" alt="'+esc(pname(p))+'" data-full="'+esc(src)+'" loading="'+(eager?'eager':'lazy')+'">'
      : (p.em||'✨'))
    +'</div>';
}

function carouselHTML(p, start){
  let imgs=galleryList(p);
  if(!imgs.length) imgs=[''];
  const n=imgs.length;
  // circular: clone last + real slides + clone first
  let slides="";
  if(n>1){
    slides+=slideHTML(imgs[n-1], n-1, p, false); // clone of last at start
  }
  slides+=imgs.map((src,i)=>slideHTML(src, i, p, i===start)).join("");
  if(n>1){
    slides+=slideHTML(imgs[0], 0, p, false); // clone of first at end
  }
  const dots=imgs.map((_,i)=>'<button type="button" class="'+(i===start?'on':'')+'" data-dot="'+i+'"></button>').join("");
  const thumbs=imgs.map((src,i)=>
    '<button type="button" class="'+(i===start?'on':'')+'" data-dot="'+i+'">'
    +(src?'<img src="'+src+'" alt="" loading="lazy">':(p.em||'✨'))
    +'</button>'
  ).join("");
  return ''
    +'<div class="carousel" id="car" data-count="'+n+'" data-loop="'+(n>1?'1':'0')+'">'
    +'<div class="carousel-count"><span id="carIdx">'+(start+1)+'</span> / '+n+'</div>'
    +'<button class="carousel-nav prev" type="button" data-nav="-1" aria-label="prev">‹</button>'
    +'<button class="carousel-nav next" type="button" data-nav="1" aria-label="next">›</button>'
    +'<div class="carousel-track" id="carTrack">'+slides+'</div>'
    +'</div>'
    +'<div class="carousel-dots" id="carDots">'+dots+'</div>'
    +'<div class="thumbs" id="carThumbs">'+thumbs+'</div>';
}

function bindCarousel(p){
  const track=$("#carTrack"); if(!track) return;
  const car=$("#car");
  const n=+(car && car.dataset.count) || 1;
  const loop=n>1;
  // DOM order when loop: [cloneLast=0, real0=1, real1=2, ..., realN-1=n, cloneFirst=n+1]
  const realToDom=i=> loop ? (i+1) : i;
  const domToReal=dom=>{
    if(!loop) return Math.max(0, Math.min(n-1, dom));
    if(dom<=0) return n-1; // clone of last
    if(dom>=n+1) return 0; // clone of first
    return dom-1;
  };
  let jumping=false;

  const syncUI=(i)=>{
    galleryIndex=((i%n)+n)%n;
    document.querySelectorAll("#carDots button, #carThumbs button").forEach((b,idx)=>{
      b.classList.toggle("on", idx===galleryIndex);
    });
    const el=$("#carIdx"); if(el) el.textContent=String(galleryIndex+1);
  };

  const goDom=(domIdx, smooth)=>{
    const slide=track.children[domIdx];
    if(!slide) return;
    track.style.direction="ltr";
    if(smooth) track.scrollTo({left: slide.offsetLeft, behavior:"smooth"});
    else track.scrollLeft=slide.offsetLeft;
  };

  const setIdx=(i, smooth)=>{
    const real=((i%n)+n)%n;
    syncUI(real);
    goDom(realToDom(real), smooth!==false);
  };

  track.style.direction="ltr";
  // land on real start (not clone)
  requestAnimationFrame(()=>{
    goDom(realToDom(galleryIndex||0), false);
  });

  let scrollEndTimer=null;
  track.addEventListener("scroll", ()=>{
    if(jumping) return;
    clearTimeout(scrollEndTimer);
    scrollEndTimer=setTimeout(()=>{
      if(jumping) return;
      const w=track.clientWidth||1;
      let dom=Math.round(track.scrollLeft/w);
      if(!loop){
        dom=Math.max(0, Math.min(n-1, dom));
        syncUI(dom);
        return;
      }
      // hit clone of first (past last real) → jump to real first
      if(dom>=n+1){
        jumping=true;
        goDom(realToDom(0), false);
        syncUI(0);
        requestAnimationFrame(()=>{ jumping=false; });
        return;
      }
      // hit clone of last (before first real) → jump to real last
      if(dom<=0){
        jumping=true;
        goDom(realToDom(n-1), false);
        syncUI(n-1);
        requestAnimationFrame(()=>{ jumping=false; });
        return;
      }
      syncUI(dom-1);
    }, 50);
  }, {passive:true});

  // single delegated handler for sheet card
  const card=document.getElementById("sheetCard");
  card.onclick = function(e){
    const nav=e.target.closest("[data-nav]");
    if(nav){ setIdx(galleryIndex + (+nav.dataset.nav), true); return; }
    const dot=e.target.closest("[data-dot]");
    if(dot){ setIdx(+dot.dataset.dot, true); return; }
    const full=e.target.closest("[data-full]");
    if(full){ openLightbox(full.dataset.full || full.getAttribute("src")); return; }
    const qbtn=e.target.closest("[data-q]");
    if(qbtn){
      pickQty=Math.max(1, Math.min(20, pickQty+(+qbtn.dataset.q||0)));
      const lab=document.getElementById("pickQty");
      if(lab) lab.textContent=String(pickQty);
      return;
    }
    const add=e.target.closest("[data-add]");
    if(add){ addToCart(+add.dataset.add, pickQty); return; }
    const open=e.target.closest("[data-open]");
    if(open){ openSheet(+open.dataset.open, "full"); return; }
    if(e.target.id==="closeSheet" || e.target.closest("#closeSheet")){ closeSheet(); return; }
  };
  window.__naqaSetImg=setIdx;
}

async function openSheet(id, mode, reset){
  const p=products.find(x=>x.id===id); if(!p) return;
  openProductId=id; sheetMode=mode||"full";
  if(reset!==false){ galleryIndex=0; pickQty=1; }
  const sameBrand=products.filter(x=>x.brand===p.brand && x.id!==p.id);
  const pool=sameBrand.length?sameBrand:products.filter(x=>x.cat===p.cat && x.id!==p.id);
  const sug=pool.slice(0,4);
  const alsoLabel=sameBrand.length?T("same"):T("also");
  const cards=sug.map(s=>`
    <button class="sug" data-open="${s.id}" type="button">
      <span class="sug-vis">${visual(s,0)}</span>
      <span class="sug-name">${esc(pname(s))}</span>
      <span class="sug-price">${money(s.price)}</span>
    </button>`).join("");
  const qv=sheetMode==="qv";
  $("#sheet").classList.toggle("qv", qv);
  const hint=qv?T("swipe"):T("swipeFull");
  $("#sheetCard").innerHTML=`
    <div class="sheet-handle" aria-hidden="true"></div>
    <p class="swipe-hint">${hint}</p>
    ${qv? carouselHTML(p, galleryIndex) : ""}
    <button class="text-back" id="closeSheet" type="button">‹ ${T("back")}</button>
    ${brandMark(p.brand)}
    <h3 style="margin:4px 0 2px">${esc(pname(p))}</h3>
    ${priceHTML(p)}
    <div class="qty-pick"><span>${T("qty")}</span><button type="button" data-q="-1">−</button><b id="pickQty">1</b><button type="button" data-q="1">+</button></div>
    ${qv? "" : carouselHTML(p, galleryIndex)}
    <div class="sku-line">${T("sku")}: ${esc(p.sku || T("noSku"))}</div>
    <span class="skin-pill">${T("skinT")}: ${esc(pskin(p))}</span>
    ${qv? `<p class="long" style="margin-top:12px">${brandMark(p.brand)} — ${esc(pdesc(p))}</p>` : `
      <h4 class="block-h">${T("about")}</h4>
      <p class="long">${brandMark(p.brand)} — ${esc(pdesc(p))}</p>
      <h4 class="block-h">${T("how")}</h4>
      <p class="long">${esc(puse(p))}</p>
      <h4 class="block-h">${alsoLabel}</h4>
      <div class="sug-row">${cards}</div>
    `}
    <div class="sheet-actions">
      <button class="btn-add card-add" data-add="${p.id}" type="button">${T("add")}</button>
      ${qv? `<button class="btn-open" data-open="${p.id}" type="button">${T("open")}</button>`:""}
    </div>`;
  $("#sheet").classList.add("show");
  $("#sheetCard").scrollTop=0;
  bindCarousel(p);
  document.title=pname(p)+" · Naqa";
  try{
    if(!qv && routeHash()!=="p/"+id) history.pushState({naqa:"product",id}, "", "#p/"+id);
  }catch(e){}
}

function closeSheet(fromRoute){
  $("#sheet").classList.remove("show");
  $("#sheet").classList.remove("qv");
  openProductId=null;
  document.title="نقاء · عناية ومكياج | www.naqa.om";
  const card=$("#sheetCard");
  if(card){ card.style.transform=""; card.style.transition=""; }
  if(!fromRoute && routeHash().indexOf("p/")===0){
    try{ history.back(); }catch(e){}
  }
}

function openLightbox(src){
  if(!src) return;
  $("#lbImg").src=src;
  $("#lightbox").classList.add("show");
}
function closeLightbox(){
  $("#lightbox").classList.remove("show");
  $("#lbImg").removeAttribute("src");
}
