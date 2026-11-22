/* admin scroll lock (admin page does not load store.min) */
(function(w){
  if(w.naqaScrollLock) return;
  var d=0,y=0;
  function lock(){
    if(!d){
      y=w.scrollY||0;
      document.body.classList.add("naqa-scroll-lock");
      document.documentElement.classList.add("naqa-scroll-lock");
      document.body.style.position="fixed";
      document.body.style.top=(-y)+"px";
      document.body.style.width="100%";
    }
    d++;
  }
  function unlock(){
    if(!d) return;
    d--;
    if(!d){
      document.body.classList.remove("naqa-scroll-lock");
      document.documentElement.classList.remove("naqa-scroll-lock");
      document.body.style.position="";
      document.body.style.top="";
      document.body.style.width="";
      w.scrollTo(0,y);
    }
  }
  w.naqaScrollLock={lock:lock,unlock:unlock};
})(window);
/* Modules: js/admin/*.js — see docs/ADMIN.md */
console.info("Naqa admin modules load from js/admin/");
