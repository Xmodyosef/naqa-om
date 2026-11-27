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
    /* prev/next buttons removed — swipe + thumbs + dots only */
    +'<div class="carousel-track" id="carTrack">'+slides+'</div>'
    +'</div>'
    +'<div class="carousel-dots" id="carDots">'+dots+'</div>'
    +'<div class="thumbs" id="carThumbs">'+thumbs+'</div>';
}


function naqaBindSheetCardClicks(p){
  const card=document.getElementById("sheetCard");
  if(!card) return;
  card.onclick = function(e){
    const nav=e.target.closest("[data-nav]");
    if(nav){
      if(typeof window.__naqaNavImg==="function"){ window.__naqaNavImg(+nav.dataset.nav); return; }
    }
    const dot=e.target.closest("[data-dot]");
    if(dot){
      if(typeof window.__naqaGoImg==="function"){ window.__naqaGoImg(+dot.dataset.dot); return; }
    }
    const full=e.target.closest("[data-full]");
    if(full){ openLightbox(full.dataset.full || full.getAttribute("src")); return; }
    const qbtn=e.target.closest("[data-q]");
    if(qbtn){
      let maxQ=20;
      if(openProductId!=null){
        const pp=products.find(x=>Number(x.id)===Number(openProductId));
        if(pp && pp.stock!=null) maxQ=Math.max(1, Math.min(20, Number(pp.stock)));
      }
      if(typeof pickQty==="undefined" || pickQty==null) pickQty=1;
      pickQty=Math.max(1, Math.min(maxQ, pickQty+(+qbtn.dataset.q||0)));
      const lab=document.getElementById("pickQty");
      if(lab) lab.textContent=String(pickQty);
      return;
    }
    const wish=e.target.closest("[data-wish]");
    if(wish){ e.preventDefault(); e.stopPropagation(); if(typeof toggleWish==="function") toggleWish(+wish.dataset.wish); wish.classList.toggle("on", isWish(+wish.dataset.wish)); return; }
    const pair=e.target.closest("[data-add-pair]");
    if(pair){
      var ids=String(pair.dataset.addPair||"").split(",").map(function(x){ return +x; }).filter(Boolean);
      ids.forEach(function(pid){ addToCart(pid, 1, true); });
      if(typeof toast==="function"){
        toast(lang==="en" ? ("Added "+ids.length+" products") : ("انضاف "+ids.length+" منتجات"));
      }
      try{ if(typeof refreshProductCartUI==="function") refreshProductCartUI(); }catch(err){}
      return;
    }
    const inc=e.target.closest("[data-inc]");
    if(inc){
      e.preventDefault(); e.stopPropagation();
      var it=cart.find(function(i){ return Number(i.id)===Number(inc.dataset.inc); });
      if(it){
        var pp=products.find(function(x){ return Number(x.id)===Number(it.id); });
        if(pp && pp.stock!=null && it.qty>=Number(pp.stock)){
          if(typeof toast==="function") toast(T("stockLimit"));
        } else { it.qty++; saveCart(); renderCart(); try{ if(typeof refreshProductCartUI==="function") refreshProductCartUI(); }catch(err){} }
      } else {
        addToCart(+inc.dataset.inc, 1);
      }
      return;
    }
    const dec=e.target.closest("[data-dec]");
    if(dec){
      e.preventDefault(); e.stopPropagation();
      var it2=cart.find(function(i){ return Number(i.id)===Number(dec.dataset.dec); });
      if(it2){ it2.qty--; if(it2.qty<=0) cart=cart.filter(function(x){ return Number(x.id)!==Number(it2.id); }); }
      saveCart(); renderCart(); try{ if(typeof refreshProductCartUI==="function") refreshProductCartUI(); }catch(err){}
      return;
    }
    const add=e.target.closest("[data-add]");
    if(add){
      e.preventDefault(); e.stopPropagation();
      var q = (typeof pickQty==="number" && pickQty>0) ? pickQty : 1;
      addToCart(+add.dataset.add, q);
      return;
    }
    const open=e.target.closest("[data-open]");
    if(open){ openSheet(+open.dataset.open, "full"); return; }
    const brand=e.target.closest("[data-brand]");
    if(brand && brand.dataset.brand){
      /* let document brand filter handle it — but ensure add was already checked */
      return;
    }
    if(e.target.id==="closeSheet" || e.target.closest("#closeSheet")){ closeSheet(); return; }
  };
}

function bindCarousel(p){
  const track=$("#carTrack");
  const car=$("#car");
  /* Always bind sheet card clicks first — add-to-cart must not depend on carousel track */
  naqaBindSheetCardClicks(p);
  if(!track) return;
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

  // sheet clicks bound via naqaBindSheetCardClicks at start
  window.__naqaSetImg=setIdx;
  window.__naqaGoImg=function(i){ setIdx(i, true); };
  window.__naqaNavImg=function(d){ setIdx(galleryIndex + (+d||0), true); };

}

