// Fullscreen custom
(function(){
  const STYLE_ID = 'mc-custom-fullscreen-style';
  let mouseMoveHandler = null;
  let lastY = 0;
  let lastTime = 0;
  let hideTimeout = null;

  function injectStyle(){
    if (document.getElementById(STYLE_ID)) return;
    const css = `
      .mc-custom-fullscreen #deskarea1,
      .mc-custom-fullscreen #deskarea4 {
        position: absolute !important;
        left: 0 !important;
        width: 100% !important;
        transition: transform 0.25s ease, opacity 0.25s ease !important;
        z-index: 9999 !important;
      }
      .mc-custom-fullscreen #deskarea1 { top: 0 !important; transform: translateY(-100%) !important; opacity: 0 !important; }
      .mc-custom-fullscreen #deskarea4 { bottom: 0 !important; transform: translateY(100%) !important; opacity: 0 !important; }
      .mc-custom-fullscreen.show-bars #deskarea1 { transform: translateY(0) !important; opacity: 1 !important; }
      .mc-custom-fullscreen.show-bars #deskarea4 { transform: translateY(0) !important; opacity: 1 !important; }
      .mc-custom-fullscreen.fade-bars #deskarea1,
      .mc-custom-fullscreen.fade-bars #deskarea4 { opacity: 0.85 !important; }
    `;
    const s = document.createElement('style');
    s.id = STYLE_ID;
    s.appendChild(document.createTextNode(css));
    document.head.appendChild(s);
  }

  function removeStyle(){
    const s = document.getElementById(STYLE_ID);
    if (s) s.remove();
  }

  function enableCustomFullscreen(){
    injectStyle();
    document.documentElement.classList.add('mc-custom-fullscreen');
    if (mouseMoveHandler) return;

    const hotAreaPx = 5; // smaller hot area
    const hideDelay = 300; // ms before hiding

    mouseMoveHandler = function(e){
      const body = document.documentElement;
      const h = window.innerHeight;
      const topBar = document.getElementById('deskarea1');
      const bottomBar = document.getElementById('deskarea4');

      const inHotArea = e.clientY <= hotAreaPx || e.clientY >= h - hotAreaPx;
      const topBarVisible = topBar && topBar.offsetParent !== null;
      const bottomBarVisible = bottomBar && bottomBar.offsetParent !== null;
      const overTopBar = topBarVisible && e.clientY >= 0 && e.clientY <= topBar.getBoundingClientRect().bottom;
      const overBottomBar = bottomBarVisible && e.clientY >= bottomBar.getBoundingClientRect().top && e.clientY <= h;

      // Clear any previous hide timeout
      if (hideTimeout) { clearTimeout(hideTimeout); hideTimeout = null; }

      // Show bars immediately if in hot area or over visible bars
      if (inHotArea || overTopBar || overBottomBar){
        body.classList.add('show-bars');
        body.classList.remove('fade-bars');
      } else {
        // Delay hiding
        hideTimeout = setTimeout(()=>{
          body.classList.remove('show-bars');
          body.classList.add('fade-bars');
        }, hideDelay);
      }

      // Dynamic transition speed
      const now = e.timeStamp;
      const deltaY = Math.abs(e.clientY - lastY);
      const deltaTime = Math.max(1, now - lastTime);
      const speed = deltaY / deltaTime; // px/ms
      const duration = Math.min(0.3, Math.max(0.1, 0.25 - speed * 0.2)); // seconds
      if (topBar) topBar.style.transitionDuration = `${duration}s`;
      if (bottomBar) bottomBar.style.transitionDuration = `${duration}s`;
      lastY = e.clientY;
      lastTime = now;
    };

    document.addEventListener('mousemove', mouseMoveHandler, { capture: true, passive: true });
    document.addEventListener('fullscreenchange', onNativeFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onNativeFullscreenChange);
    document.addEventListener('mozfullscreenchange', onNativeFullscreenChange);
    document.addEventListener('MSFullscreenChange', onNativeFullscreenChange);
  }

  function disableCustomFullscreen(){
    if (mouseMoveHandler) {
      document.removeEventListener('mousemove', mouseMoveHandler, { capture: true });
      mouseMoveHandler = null;
    }
    document.removeEventListener('fullscreenchange', onNativeFullscreenChange);
    document.removeEventListener('webkitfullscreenchange', onNativeFullscreenChange);
    document.removeEventListener('mozfullscreenchange', onNativeFullscreenChange);
    document.removeEventListener('MSFullscreenChange', onNativeFullscreenChange);
    document.documentElement.classList.remove('mc-custom-fullscreen');
    document.documentElement.classList.remove('show-bars');
    document.documentElement.classList.remove('fade-bars');
    if (hideTimeout) { clearTimeout(hideTimeout); hideTimeout = null; }
    removeStyle();
  }

  function onNativeFullscreenChange(){
    const isNotFull = !document.fullscreenElement && !document.webkitFullscreenElement && !document.mozFullScreenElement && !document.msFullscreenElement;
    if (isNotFull && document.documentElement.classList.contains('mc-custom-fullscreen')) {
      try { window.deskToggleFull({ shiftKey: false }); } catch(e){}
    }
  }

  function patchDeskToggleFull(){
    if (typeof window.deskToggleFull !== 'function') { setTimeout(patchDeskToggleFull, 300); return; }
    const _orig = window.deskToggleFull;
    window.deskToggleFull = function(b){
      const wasFs = !!window.fullscreen;
      const res = _orig.call(this, b);
      const nowFs = !!window.fullscreen;
      if (!wasFs && nowFs) {
        try { if (typeof enterBrowserFullscreen === 'function') enterBrowserFullscreen(Q('body')); } catch(e){}
        enableCustomFullscreen();
        window.browserfullscreen = true;
      } else if (wasFs && !nowFs) {
        disableCustomFullscreen();
        window.browserfullscreen = false;
      }
      return res;
    };
  }

  patchDeskToggleFull();
})();
