// ====== MESH CENTRAL – FULLSCREEN + ZOOM ======
(() => {
  'use strict';

  /* -------------------------- CONFIG -------------------------- */
  const CONFIG = {
    FULLSCREEN_STYLE_ID: 'mc-true-fs-style',
    HIDE_DELAY_MS: 3000,
    INTRO_DURATION_MS: 5000,
    INTRO_HIDE_DURATION_MS: 1500,
    INDICATOR_STAY_MS: 3000,
    HOT_ZONE_WIDTH_PERCENT: 20,
    PATCH_RETRY_MS: 250,

    ZOOM_MIN: 0.5,
    ZOOM_MAX: 2.5,
    ZOOM_STEP: 0.1,
    ZOOM_DEFAULT: 1.0,
    ZOOM_IN_KEYS: ['+', '='],
    ZOOM_OUT_KEYS: ['-'],
    ZOOM_RESET_KEYS: ['0'],
  };

  /* ----------------------- FULLSCREEN ENHANCER ----------------------- */
  const FullscreenEnhancer = (() => {
    let enabled = false;
    let container = null;
    let topBar = null;
    let bottomBar = null;
    let handler = null;
    let hideTimer = null;
    let initialShowTimer = null;
    let indicatorHideTimer = null;
    let indicator = null;
    let arrow = null;

    const injectCSS = () => {
      if (document.getElementById(CONFIG.FULLSCREEN_STYLE_ID)) return;

      const css = `
        #deskarea0.mc-true-fs{position:fixed!important;inset:0!important;margin:0!important;padding:0!important;overflow:hidden!important;background:#000!important}
        #deskarea0.mc-true-fs #DeskParent{position:absolute!important;inset:0!important;overflow:hidden!important}
        #deskarea0.mc-true-fs #Desk{position:absolute!important;top:0!important;left:0!important}
        #deskarea0.mc-true-fs #deskarea1,#deskarea0.mc-true-fs #deskarea4{
          position:fixed!important;left:0!important;width:100%!important;z-index:9999!important;
          backdrop-filter:blur(4px)!important;-webkit-backdrop-filter:blur(4px)!important;
          box-shadow:0 1px 3px rgba(0,0,0,.3)!important;
          transition:transform .3s cubic-bezier(.25,.1,.25,1)!important}
        #deskarea0.mc-true-fs #deskarea1{top:0;transform:translateY(-100%)}
        #deskarea0.mc-true-fs #deskarea4{bottom:0;transform:translateY(100%)}
        #deskarea0.mc-true-fs.show-bars #deskarea1,
        #deskarea0.mc-true-fs.show-bars #deskarea4{transform:translateY(0)}
        #deskarea0.mc-true-fs.intro-hide #deskarea1,
        #deskarea0.mc-true-fs.intro-hide #deskarea4{
          transition:transform ${CONFIG.INTRO_HIDE_DURATION_MS}ms cubic-bezier(.4,0,.2,1)!important}
        #deskarea0.mc-true-fs .mc-hot-indicator{
          position:fixed!important;top:0!important;left:50%!important;transform:translateX(-50%)!important;
          width:200px!important;height:0!important;border-radius:3px!important;
          background:linear-gradient(90deg,transparent,rgba(255,255,255,.9),transparent)!important;
          z-index:10000!important;opacity:0!important;pointer-events:none!important;
          transition:opacity .8s ease,transform .3s cubic-bezier(.25,.1,.25,1)!important;
          animation:mc-glow 2s infinite ease-in-out!important}
        @keyframes mc-glow{
          0%,100%{box-shadow:0 0 12px 2px rgba(167,139,255,.7),0 0 20px 4px rgba(100,150,255,.4)}
          50%{box-shadow:0 0 20px 6px rgba(0,0,0,.7),0 0 30px 8px rgba(100,150,255,.8),0 0 48px 20px rgba(167,139,255,.7)}}
        #deskarea0.mc-true-fs.show-indicator .mc-hot-indicator{opacity:1!important;transform:translateX(-50%) translateY(0)!important}
        #deskarea0.mc-true-fs.hide-indicator .mc-hot-indicator{
          opacity:0!important;transform:translateX(-50%) translateY(-30px)!important;
          transition:opacity .8s ease,transform .8s ease cubic-bezier(.25,.1,.25,1)!important}
        #deskarea0.mc-true-fs .mc-arrow-indicator{
          position:fixed!important;top:0!important;left:50%!important;transform:translateX(-50%)!important;
          width:60px!important;height:60px!important;z-index:10001!important;
          opacity:0!important;pointer-events:none!important;
          transition:opacity .6s ease,transform .6s cubic-bezier(.25,.1,.25,1)!important}
        #deskarea0.mc-true-fs .mc-arrow-indicator .arrow-icon{
          width:100%!important;height:100%!important;color:rgba(255,255,255,.95)!important;
          filter:drop-shadow(0 0 8px rgba(255,255,255,.8));
          animation:mc-arrow-bounce 2s infinite ease-in-out,mc-arrow-glow 2s infinite ease-in-out!important}
        #deskarea0.mc-true-fs.show-indicator .mc-arrow-indicator{opacity:1!important;transform:translateX(-50%) translateY(50px)!important}
        #deskarea0.mc-true-fs.hide-indicator .mc-arrow-indicator{
          opacity:0!important;transform:translateX(-50%) translateY(-90px)!important;
          transition:opacity .8s ease,transform .8s ease!important}
        @keyframes mc-arrow-bounce{
          0%,20%,50%,80%,100%{transform:translateY(-50px)}40%{transform:translateY(0)}60%{transform:translateY(-40px)}}
        @keyframes mc-arrow-glow{
          0%,100%{filter:drop-shadow(0 0 6px rgba(255,255,255,.7)) drop-shadow(0 0 12px rgba(100,150,255,.5))}
          50%{filter:drop-shadow(0 0 10px rgba(255,255,255,.9)) drop-shadow(0 0 20px rgba(100,150,255,.8)) drop-shadow(0 0 30px rgba(167,139,255,.6))}}
        .modal{z-index:1055!important}.modal-backdrop{z-index:1050!important}
      `;

      const style = document.createElement('style');
      style.id = CONFIG.FULLSCREEN_STYLE_ID;
      style.textContent = css;
      document.head.appendChild(style);
    };

    const createIndicator = () => {
      if (indicator) return;
      indicator = document.createElement('div');
      indicator.className = 'mc-hot-indicator';
      container.appendChild(indicator);
    };

    const createArrow = () => {
      if (arrow) return;
      arrow = document.createElement('div');
      arrow.className = 'mc-arrow-indicator';
      arrow.innerHTML = `<svg viewBox="0 0 24 24" class="arrow-icon">
        <path fill="currentColor" d="M12 5l-7 7h4v7h6v-7h4l-7-7z"/>
      </svg>`;
      container.appendChild(arrow);
    };

    const createHandler = () => (e) => {
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const zoneW = rect.width * (CONFIG.HOT_ZONE_WIDTH_PERCENT / 100);
      const hotLeft = centerX - zoneW / 2;
      const hotRight = centerX + zoneW / 2;

      const inHotZone = e.clientY >= 4 && e.clientY <= 20 && e.clientX >= hotLeft && e.clientX <= hotRight;
      const overTop = topBar && e.clientY <= topBar.getBoundingClientRect().bottom;
      const overBottom = bottomBar && e.clientY >= bottomBar.getBoundingClientRect().top;
      const showing = container.classList.contains('show-bars');
      const trigger = showing ? (overTop || overBottom) : inHotZone;

      if (trigger) {
        [hideTimer, initialShowTimer, indicatorHideTimer].forEach(t => t && clearTimeout(t));
        hideTimer = initialShowTimer = indicatorHideTimer = null;
        container.classList.remove('hide-indicator');
        container.classList.add('show-bars', 'show-indicator');
        container.classList.remove('intro-hide', 'hide-indicator');
        ZoomController.showUI();
      } else if (!hideTimer && !initialShowTimer && container.classList.contains('show-bars')) {
        hideTimer = setTimeout(() => {
          container.classList.remove('show-bars');
          indicatorHideTimer = setTimeout(() => {
            container.classList.add('hide-indicator');
            container.classList.remove('show-indicator');
            setTimeout(() => container.classList.remove('hide-indicator'), 300);
            indicatorHideTimer = null;
          }, CONFIG.INDICATOR_STAY_MS);
          hideTimer = null;
        }, CONFIG.HIDE_DELAY_MS);
      }
    };

    const enable = () => {
      if (enabled) return;
      enabled = true;

      container = document.getElementById('deskarea0');
      if (!container) return;
      topBar = document.getElementById('deskarea1');
      bottomBar = document.getElementById('deskarea4');

      injectCSS();
      createIndicator();
      createArrow();

      container.classList.add('mc-true-fs', 'show-bars', 'show-indicator');

      handler = createHandler();
      document.addEventListener('mousemove', handler, { capture: true, passive: true });

      initialShowTimer = setTimeout(() => {
        container.classList.add('intro-hide');
        container.classList.remove('show-bars');
        setTimeout(() => {
          container.classList.remove('intro-hide');
          indicatorHideTimer = setTimeout(() => {
            container.classList.add('hide-indicator');
            container.classList.remove('show-indicator');
            setTimeout(() => container.classList.remove('hide-indicator'), 300);
          }, CONFIG.INDICATOR_STAY_MS);
        }, CONFIG.INTRO_HIDE_DURATION_MS);
        initialShowTimer = null;
      }, CONFIG.INTRO_DURATION_MS);

      ZoomController.init(bottomBar, container);
    };

    const disable = () => {
      if (!enabled) return;
      enabled = false;

      [hideTimer, initialShowTimer, indicatorHideTimer].forEach(t => t && clearTimeout(t));
      if (handler) document.removeEventListener('mousemove', handler, { capture: true, passive: true });

      ZoomController.destroy();

      if (container) {
        container.classList.remove('mc-true-fs', 'show-bars', 'show-indicator', 'intro-hide', 'hide-indicator');
        if (indicator) { indicator.remove(); indicator = null; }
        if (arrow) { arrow.remove(); arrow = null; }
      }
      const style = document.getElementById(CONFIG.FULLSCREEN_STYLE_ID);
      if (style) style.remove();
    };

    const patch = () => {
      const tryPatch = () => {
        if (typeof window.deskToggleFull !== 'function') { setTimeout(tryPatch, CONFIG.PATCH_RETRY_MS); return; }
        const orig = window.deskToggleFull;
        window.deskToggleFull = function (ev) {
          const was = !!window.fullscreen;
          const fake = ev ? Object.assign({}, ev, { shiftKey: true }) : { shiftKey: true };
          const res = orig.call(this, fake);
          const now = !!window.fullscreen;
          if (!was && now) requestAnimationFrame(enable);
          else if (was && !now) disable();
          return res;
        };
      };
      tryPatch();
    };

    const setupExit = () => {
      const events = 'fullscreenchange webkitfullscreenchange mozfullscreenchange MSFullscreenChange';
      events.split(' ').forEach(ev => document.addEventListener(ev, () => {
        const inFs = !!(document.fullscreenElement || document.webkitFullscreenElement ||
          document.mozFullScreenElement || document.msFullscreenElement);
        if (!inFs && enabled) try { window.deskToggleFull?.(); } catch (_) { }
      }, true));
    };

    return { init: () => { patch(); setupExit(); } };
  })();

  /* -------------------------- ZOOM CONTROLLER -------------------------- */
  const ZoomController = (() => {
    let bottomBar = null;
    let container = null;
    let deskEl = null;
    let zoomUI = null;
    let helpBtn = null;
    let helpBanner = null;
    let zoomValue = CONFIG.ZOOM_DEFAULT;
    let panX = 0, panY = 0;
    let keyHandler = null;
    let wheelHandler = null;
    let drag = { active: false, startX: 0, startY: 0 };

    const getDesk = () => {
      if (deskEl) return deskEl;
      deskEl = document.getElementById('Desk') || container.querySelector('canvas');
      return deskEl;
    };

    const apply = () => {
      const el = getDesk();
      if (el) el.style.transform = `translate(${panX}px, ${panY}px) scale(${zoomValue})`;
    };

    const setZoom = (newVal, originX = null, originY = null) => {
      const old = zoomValue;
      zoomValue = Math.max(CONFIG.ZOOM_MIN, Math.min(CONFIG.ZOOM_MAX, newVal));
      const el = getDesk();
      if (el && originX !== null && originY !== null) {
        const rect = el.getBoundingClientRect();
        const scaleChange = zoomValue / old;
        panX = originX - (originX - panX) * scaleChange;
        panY = originY - (originY - panY) * scaleChange;
      }
      apply();
      const label = zoomUI?.querySelector('#mc-zoom-label');
      if (label) label.textContent = `Zoom: ${Math.round(zoomValue * 100)}%`;
      const slider = zoomUI?.querySelector('#mc-zoom-slider');
      if (slider) slider.value = zoomValue * 100;
    };

    const reset = () => {
      zoomValue = CONFIG.ZOOM_DEFAULT; panX = panY = 0;
      apply();
      const label = zoomUI?.querySelector('#mc-zoom-label');
      if (label) label.textContent = 'Zoom: 100%';
      const slider = zoomUI?.querySelector('#mc-zoom-slider');
      if (slider) slider.value = 100;
    };

    const createUI = () => {
      if (zoomUI) return;
      zoomUI = document.createElement('div');
      zoomUI.id = 'mc-zoom-container';
      zoomUI.innerHTML = `
        <style>
          #mc-zoom-container{position:absolute;left:50%;bottom:6px;transform:translateX(-50%);
            display:flex;align-items:center;gap:6px;background:rgba(0,0,0,.55);padding:2px 8px;border-radius:4px;
            font-size:12px;color:#fff;z-index:10002;height:24px;transition:opacity .3s ease,transform .15s ease}
          #mc-zoom-container.hidden{opacity:0;pointer-events:none}
          #mc-zoom-label{cursor:pointer;white-space:nowrap}
          #mc-zoom-slider{width:90px;height:4px;border-radius:2px;background:#555;-webkit-appearance:none;outline:none}
          #mc-zoom-slider::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;border-radius:50%;background:#fff;cursor:pointer;box-shadow:0 1px 3px rgba(0,0,0,.4)}
          #mc-zoom-slider::-moz-range-thumb{width:14px;height:14px;border-radius:50%;background:#fff;border:none;cursor:pointer;box-shadow:0 1px 3px rgba(0,0,0,.4)}
          #mc-zoom-help{cursor:pointer;font-weight:bold;font-size:16px;line-height:1;margin-left:4px}
          #mc-zoom-help-banner{position:absolute;bottom:32px;left:50%;transform:translateX(-50%);
            background:rgba(0,0,0,.9);color:#fff;padding:8px 12px;border-radius:6px;font-size:14px;white-space:nowrap;
            pointer-events:none;opacity:0;transition:opacity .2s ease;box-shadow:0 2px 8px rgba(0,0,0,.4)}
          #mc-zoom-help-banner.visible{opacity:1}
        </style>
        <span id="mc-zoom-label">Zoom: 100%</span>
        <input type="range" id="mc-zoom-slider" min="${CONFIG.ZOOM_MIN*100}" max="${CONFIG.ZOOM_MAX*100}"
               value="${CONFIG.ZOOM_DEFAULT*100}" step="${CONFIG.ZOOM_STEP*100}">
        <span id="mc-zoom-help">?</span>
        <div id="mc-zoom-help-banner">
          • Ctrl + / − : zoom<br>
          • Ctrl + wheel : zoom at cursor<br>
          • Ctrl + drag : pan<br>
          • Ctrl + 0 / Click label : reset
        </div>
      `;
      bottomBar.appendChild(zoomUI);

      // Slider
      zoomUI.querySelector('#mc-zoom-slider').addEventListener('input', e => {
        setZoom(parseFloat(e.target.value) / 100);
      });

      // Reset on label click
      zoomUI.querySelector('#mc-zoom-label').addEventListener('click', reset);

      // Help banner
      helpBtn = zoomUI.querySelector('#mc-zoom-help');
      helpBanner = zoomUI.querySelector('#mc-zoom-help-banner');
      helpBtn.addEventListener('mouseenter', () => helpBanner.classList.add('visible'));
      helpBtn.addEventListener('mouseleave', () => helpBanner.classList.remove('visible'));

      // Wheel at zoom bar ===
      const wheelOnBarHandler = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const delta = e.deltaY < 0 ? CONFIG.ZOOM_STEP : -CONFIG.ZOOM_STEP;
        setZoom(zoomValue + delta);

        // Feedback
        zoomUI.style.transition = 'transform 0.15s ease';
        zoomUI.style.transform = `translateX(-50%) scale(${e.deltaY < 0 ? 1.08 : 0.94})`;
        clearTimeout(zoomUI._scaleReset);
        zoomUI._scaleReset = setTimeout(() => {
          zoomUI.style.transform = 'translateX(-50%) scale(1)';
        }, 160);
      };

      zoomUI.addEventListener('wheel', wheelOnBarHandler, { passive: false });
      zoomUI.querySelector('#mc-zoom-slider').addEventListener('wheel', wheelOnBarHandler, { passive: false });
    };

    const attachEvents = () => {
      // Keyboard
      keyHandler = e => {
        if (!e.ctrlKey || e.altKey || e.shiftKey || e.metaKey) return;
        if (CONFIG.ZOOM_IN_KEYS.includes(e.key)) { e.preventDefault(); setZoom(zoomValue + CONFIG.ZOOM_STEP); }
        else if (CONFIG.ZOOM_OUT_KEYS.includes(e.key)) { e.preventDefault(); setZoom(zoomValue - CONFIG.ZOOM_STEP); }
        else if (CONFIG.ZOOM_RESET_KEYS.includes(e.key)) { e.preventDefault(); reset(); }
      };
      document.addEventListener('keydown', keyHandler, { capture: true, passive: false });

      // Ctrl Wheel
      wheelHandler = e => {
        if (!e.ctrlKey) return;
        e.preventDefault();
        e.stopImmediatePropagation();

        const desk = getDesk();
        if (!desk) return;
        const rect = desk.getBoundingClientRect();
        const ox = e.clientX - rect.left;
        const oy = e.clientY - rect.top;
        const delta = e.deltaY < 0 ? CONFIG.ZOOM_STEP : -CONFIG.ZOOM_STEP;
        setZoom(zoomValue + delta, ox, oy);
      };
      document.addEventListener('wheel', wheelHandler, { capture: true, passive: false });

      // Pan drag
      const start = e => {
        if (!e.ctrlKey || e.button !== 0) return;
        drag.active = true;
        drag.startX = e.clientX - panX;
        drag.startY = e.clientY - panY;
        container.style.cursor = 'grabbing';
        e.preventDefault();
      };
      const move = e => {
        if (!drag.active) return;
        panX = e.clientX - drag.startX;
        panY = e.clientY - drag.startY;
        apply();
      };
      const end = () => {
        drag.active = false;
        container.style.cursor = '';
      };
      container.addEventListener('mousedown', start, true);
      document.addEventListener('mousemove', move, true);
      document.addEventListener('mouseup', end, true);
    };

    const init = (bar, cont) => {
	// Reset
      deskEl = zoomUI = helpBtn = helpBanner = keyHandler = wheelHandler = null;
      panX = panY = 0;
      zoomValue = CONFIG.ZOOM_DEFAULT;
      bottomBar = bar;
      container = cont;
      createUI();
      attachEvents();
    };

    const showUI = () => zoomUI && zoomUI.classList.remove('hidden');
    const hideUI = () => zoomUI && zoomUI.classList.add('hidden');

    const destroy = () => {
      if (keyHandler) document.removeEventListener('keydown', keyHandler, { capture: true });
      if (wheelHandler) document.removeEventListener('wheel', wheelHandler, { capture: true });
      if (zoomUI && zoomUI.remove) zoomUI.remove();
      deskEl = zoomUI = helpBtn = helpBanner = keyHandler = wheelHandler = null;
    };

    return { init, showUI, hideUI, destroy };
  })();

  FullscreenEnhancer.init();
})();


// Default Display 1 once per session
(() => {
    let forced = false;

    const hook = setInterval(() => {
        if (typeof window.deskDisplayInfo !== "function") return;
        clearInterval(hook);

        const original = window.deskDisplayInfo;

        window.deskDisplayInfo = function (sender, displays, selDisplay) {
            const r = original.apply(this, arguments);

            if (displays === null) {
                forced = false;
                return r;
            }

            if (!forced && selDisplay === 65535 && displays) {
                forced = true;
                setTimeout(() => deskSetDisplay(1), 80);
            }

            return r;
        };
    }, 150);
})();



// === THEME TOGGLE (AUTO / LIGHT / DARK) ===
document.addEventListener('DOMContentLoaded', () => {

  // ==================== SETTINGS ====================

  const TOGGLE_WIDTH   = '3.0rem';
  const TOGGLE_HEIGHT  = '1.7rem';
  const PADDING        = '0.00rem';
  const PADDING_ICONS  = '0.15rem';
  const INACTIVE_ICON_ALPHA  = '0.7';
  const TOGGLE_BORDER  = '0.188rem';
  const SWITCH_SIZE = (parseFloat(TOGGLE_HEIGHT) - (parseFloat(TOGGLE_BORDER) * 2)) + 'rem';
  const SWITCH_BORDER = (parseFloat(SWITCH_SIZE) / 2) + 'rem';
  const SWITCH_AUTO_W = (parseFloat(TOGGLE_WIDTH) - (parseFloat(TOGGLE_BORDER) * 2)) + 'rem';

  // LIGHT THEME COLORS
  const LIGHT_SWITCH  = "#d7d2cd";
  const LIGHT_BG      = "#fcf2ea";
  const LIGHT_BORDER  = "#fcf2ea";
  const LIGHT_SUN     = "#282523";
  const LIGHT_MOON    = "#595652";
  const LIGHT_SHADOW  = "#191919b8";
  const LIGHT_LIGHT   = "#fff";

  // DARK THEME COLORS
  const DARK_SWITCH   = "#7e8e91";
  const DARK_BG       = "#5c6b6b";
  const DARK_BORDER   = "#5c6b6b";
  const DARK_SUN      = "#9ba6a5";
  const DARK_MOON     = "#cfd7d7";
  const DARK_SHADOW   = "#1a1a1abf";
  const DARK_LIGHT    = "#cfcfcf87";
  // =================================================================

  const mastheadRight = document.querySelector('.masthead-right');
  if (!mastheadRight) return;

  // keep hiding menu items (preserve original behaviour)
  function hideDropdownItems() {
    const nightItem = document.getElementById('toggleNightMenuItem');
    if (nightItem) nightItem.style.display = 'none';
    const modernUIItem = document.getElementById('toggleModernUIMenuItem');
    if (modernUIItem) modernUIItem.style.display = 'none';
  }
  hideDropdownItems();

  const menuContainer = document.getElementById('userDropdownMenuContainer');
  if (menuContainer) {
    new MutationObserver(hideDropdownItems).observe(menuContainer, { childList: true, subtree: true });
  }

  // APPLYING VARS
  const LIGHT = { bg: LIGHT_BG, border: LIGHT_BORDER, sun: LIGHT_SUN, moon: LIGHT_MOON, shadow: LIGHT_SHADOW, light: LIGHT_LIGHT, switch: LIGHT_SWITCH };
  const DARK  = { bg: DARK_BG, border: DARK_BORDER,  sun: DARK_SUN,  moon: DARK_MOON,  shadow: DARK_SHADOW,  light: DARK_LIGHT, switch: DARK_SWITCH };

  // ===================== CSS BASE + TRANSITIONS =====================
  if (!document.getElementById('theme-toggle-styles')) {
    const s = document.createElement('style');
    s.id = 'theme-toggle-styles';
    s.textContent = `

/* General Transition */
.theme-transition,
.theme-transition * {
  transition: background-color 2.6s ease,
              background 2.6s ease,
              color 2.6s ease,
              border-color 2.6s ease,
              fill 2.6s ease,
              stroke 2.6s ease !important;
}

/* Specific Transition */
.theme-transition #theme-toggle .switch,
.theme-transition #theme-toggle .switch * {
transition: transform 0.28s ease,
            width 0.28s ease,
            left 0.28s ease,
            background-color 0.28s ease 0.45s,
            background 0.28s ease 0.45s,
            fill 0.28s ease 0.45s,
            border-color 0.28s ease,
            border-radius 0.28s ease,
            box-shadow 0.28s ease,
			opacity .28s ease 0.45s !important;
}

#theme-toggle .sun,
#theme-toggle .sun path,
#theme-toggle .moon,
#theme-toggle .moon path {
transition: transform 0.28s ease 0.1s,
            width 0.28s ease 0.45s,
            left 0.28s ease 0.45s,
            /* background-color 0.28s ease 4.5s, */
            /* background 0.28s ease 4.5s, */
            fill 1.45s ease 0.0s,
            border-color 0.28s ease 0.45s,
            border-radius 0.28s ease 0.45s,
            box-shadow 0.28s ease 0.45s,
			opacity 1.45s ease 0.0s !important;
}


#theme-toggle {
	all: initial; 
	display:flex; 
	align-items:center; 
	justify-content:center; 
	cursor:pointer; 
	height: 40px;
    padding: 0px 8px !important;
    border-radius: 4px;
}


#theme-toggle:hover {
    background-color: rgba(255, 255, 255, 0.1) !important;
}


#theme-toggle .track { 
  position:relative; 
  width:${TOGGLE_WIDTH}; 
  height:${TOGGLE_HEIGHT}; 
  border-radius:calc(${parseFloat(TOGGLE_HEIGHT)/2 + 'rem'}); 
  padding:${PADDING}; 
  box-sizing:border-box; 
  display:flex; 
  align-items:center; 
  justify-content:space-around; 
  overflow:hidden; 
  box-shadow: inset 1px 1px 3px 1px var(--shadow), var(--light) -3px -3px 3px -1px inset;
}
#theme-toggle .switch { 
  position:absolute; 
  height:${SWITCH_SIZE}; 
  width:${SWITCH_SIZE}; 
  border-radius:${SWITCH_BORDER}; 
  background: color-mix(in lab, var(--switch) 80%, transparent) !important;
  z-index:5;
  box-shadow: inset 3px 2px 4px -3px var(--shadow), 3px 2px 10px -1px var(--shadow);
}
#theme-toggle .sun, #theme-toggle .moon { 
  position:relative; 
  height:${SWITCH_SIZE}; 
  width:${SWITCH_SIZE}; 
  padding:${PADDING_ICONS}; 
  z-index:9; 
  pointer-events:none; 
}


#theme-toggle .track:hover {
  /* transform: scale(1.1); */
  /*background: transparent;*/
/*  background: color-mix(in lab, #fff 7%, transparent) !important; */
/*  transition: background-color 0.6s ease 0s; */
}


#theme-toggle .sun path { fill: var(--sun);	opacity: var(--sun-op);}
#theme-toggle .moon path { fill: var(--moon); opacity: var(--moon-op);}
#theme-toggle.mode-auto .switch { left: calc(50% - ${parseFloat(SWITCH_AUTO_W)/2 + 'px'}); width: ${SWITCH_AUTO_W}; }
#theme-toggle.mode-light .switch { left: 4px; width: ${SWITCH_SIZE}; }
#theme-toggle.mode-dark .switch { left: calc(100% - ${parseFloat(SWITCH_SIZE) + 8 + 'px'}); width: ${SWITCH_SIZE}; }

#theme-toggle .track { 
  border:${TOGGLE_BORDER} solid var(--track-border); 
  background: var(--track-bg); 
}
    `;
    document.head.appendChild(s);
  }

  // create button
  if (!document.getElementById('theme-toggle')) {
    const btn = document.createElement('button');
    btn.id = 'theme-toggle';
    btn.type = 'button';
    btn.style.display = 'flex';
    btn.style.alignItems = 'center';
    btn.style.justifyContent = 'center';
    btn.style.background = 'transparent';
    btn.style.border = 'none';
    btn.style.padding = '0px 8px';
    btn.style.margin = '0';
    btn.style.cursor = 'pointer';

    btn.innerHTML = `
      <div class="track" role="switch" aria-label="Theme toggle">
        <div class="switch"></div>
        <svg class="sun" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16ZM12 18C15.3137 18 18 15.3137 18 12C18 8.68629 15.3137 6 12 6C8.68629 6 6 8.68629 6 12C6 15.3137 8.68629 18 12 18Z" fill="currentColor"/>
          <path fill-rule="evenodd" clip-rule="evenodd" d="M11 0H13V4.06189C12.6724 4.02104 12.3387 4 12 4C11.6613 4 11.3276 4.02104 11 4.06189V0ZM7.0943 5.68018L4.22173 2.80761L2.80752 4.22183L5.6801 7.09441C6.09071 6.56618 6.56608 6.0908 7.0943 5.68018ZM4.06189 11H0V13H4.06189C4.02104 12.6724 4 12.3387 4 12C4 11.6613 4.02104 11.3276 4.06189 11ZM5.6801 16.9056L2.80751 19.7782L4.22173 21.1924L7.0943 18.3198C6.56608 17.9092 6.09071 17.4338 5.6801 16.9056ZM11 19.9381V24H13V19.9381C12.6724 19.979 12.3387 20 12 20C11.6613 20 11.3276 19.979 11 19.9381ZM16.9056 18.3199L19.7781 21.1924L21.1923 19.7782L18.3198 16.9057C17.9092 17.4339 17.4338 17.9093 16.9056 18.3199ZM19.9381 13H24V11H19.9381C19.979 11.3276 20 11.6613 20 12C20 12.3387 19.979 12.6724 19.9381 13ZM18.3198 7.0943L21.1923 4.22183L19.7781 2.80762L16.9056 5.6801C17.4338 6.09071 17.9092 6.56608 18.3198 7.0943Z" fill="currentColor"/>
        </svg>
        <svg class="moon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M15.2398038,3.86764935 C13.8204659,5.18476989 13,7.02542894 13,9 C13,12.8659932 16.1340068,16 20,16 C20.1451744,16 20.2897556,15.9955942 20.4336241,15.986821 L22.4431545,15.8642776 L21.3266144,17.5395589 C19.4842735,20.3038478 16.3853769,22 13,22 C7.4771525,22 3,17.5228475 3,12 C3,6.4771525 7.4771525,2 13,2 C13.5846805,2 14.1634362,2.05028518 14.7316831,2.14956084 L16.7173912,2.49647429 L15.2398038,3.86764935 Z M5,12 C5,16.418278 8.581722,20 13,20 C15.0609678,20 16.9878304,19.215338 18.4414082,17.8655328 C14.2137018,17.1274203 11,13.4390103 11,9 C11,7.19183498 11.5366814,5.46848045 12.5051382,4.01505578 C8.31734829,4.27062453 5,7.74790816 5,12 Z" fill="currentColor"/>
        </svg>
      </div>
    `;

    mastheadRight.insertBefore(btn, mastheadRight.firstChild);

    function triggerSmoothTransition() {
      const html = document.documentElement;
      html.classList.add("theme-transition");
      setTimeout(() => html.classList.remove("theme-transition"), 300);
    }

    // click → switch modes
    btn.addEventListener('click', () => {
		triggerSmoothTransition();
      let mode = (typeof getstore === 'function') ? getstore('nightMode', '0') : (localStorage.getItem('nightMode') || '0');
      mode = (mode === '0') ? '2' : (mode === '2') ? '1' : '0';
      if (typeof putstore === 'function') putstore('nightMode', mode); else localStorage.setItem('nightMode', mode);
      if (typeof setNightMode === 'function') setNightMode();
      if (typeof updateThemeIcons === 'function') updateThemeIcons();
      updateToggleUI();
    });
  }

  // update ui toggle as current mode
  function updateToggleUI() {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;

    const track = btn.querySelector('.track');
    const sw    = btn.querySelector('.switch');
    const mode  = (typeof getstore === 'function') ? getstore('nightMode', '0') : (localStorage.getItem('nightMode') || '0');
	btn.title = (mode === '0') ? 'Auto Mode' : (mode === '2') ? 'Light Mode' : 'Dark Mode';

    let colors;
    if (mode === '2') colors = LIGHT;
    else if (mode === '1') colors = DARK;
    else colors = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? DARK : LIGHT;

    track.style.setProperty('--track-bg', colors.bg);
    track.style.setProperty('--track-border', colors.border);
    track.style.setProperty('--sun', colors.sun);
    track.style.setProperty('--moon', colors.moon);
    track.style.setProperty('--shadow', colors.shadow);
    track.style.setProperty('--light', colors.light);
    track.style.setProperty('--switch', colors.switch);

    const isLight = (mode === '2') || (mode === '0' && colors === LIGHT);
    // const isAuto = (mode === '0');

    btn.classList.remove('mode-auto','mode-light','mode-dark');
    if (mode === '0') btn.classList.add('mode-auto');
    else if (mode === '2') btn.classList.add('mode-light');
    else btn.classList.add('mode-dark');

    // switch position and size
    if (mode === '2') { // light mode
      sw.style.left = '0px';
      sw.style.width = SWITCH_SIZE;
	  sw.style.boxShadow= 'inset 3px 2px 4px -3px var(--shadow), 3px 2px 9px -3px var(--shadow)';
    } else if (mode === '1') { // dark mode
      sw.style.left = `calc(100% - ${parseFloat(SWITCH_SIZE) - 0.02}rem)`;
      sw.style.width = SWITCH_SIZE;
	  sw.style.boxShadow= 'inset 1px 1px 1px 0px var(--shadow), var(--light) -3px -3px 3px -2px inset';
    } else { // auto mode
      sw.style.left = '0px';
//      sw.style.left = 'calc(50% - ' + (parseFloat(SWITCH_AUTO_W)/2) + 'px)';
      sw.style.width = SWITCH_AUTO_W;
	  sw.style.boxShadow= 'var(--shadow) 3px 3px 3px -3px inset, var(--light) -3px -3px 2px -3px inset';
    }

    // icons opacity and scale
    btn.querySelectorAll('.sun path').forEach(p => p.style.opacity = isLight ? '1' : INACTIVE_ICON_ALPHA);
    btn.querySelectorAll('.sun').forEach(svg => svg.style.transform = isLight ? 'scale(1.0)' : 'scale(0.7)');
    btn.querySelectorAll('.moon path').forEach(p => p.style.opacity = isLight ? INACTIVE_ICON_ALPHA : '1');
    btn.querySelectorAll('.moon').forEach(svg => svg.style.transform = isLight ? 'scale(0.7)' : 'scale(1.0)');

	if (mode === '0') {
		btn.querySelectorAll('.sun path').forEach(p => p.style.opacity = '1');
		btn.querySelectorAll('.moon path').forEach(p => p.style.opacity = '1');
	}
  }

  // detect theme changes
  const mm = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  if (mm && typeof mm.addEventListener === 'function') {
    mm.addEventListener('change', () => {
      if ((typeof getstore === 'function' ? getstore('nightMode','0') : (localStorage.getItem('nightMode')||'0')) === '0') {
        if (typeof setNightMode === 'function') setNightMode();
        if (typeof updateThemeIcons === 'function') updateThemeIcons();
        updateToggleUI();
      }
    });
  }

  new MutationObserver(() => updateToggleUI()).observe(document.documentElement, { attributes: true, attributeFilter: ['data-bs-theme'] });

  // starting
  if (typeof setNightMode === 'function') setNightMode();
  if (typeof updateThemeIcons === 'function') updateThemeIcons();
  updateToggleUI();
});

// === HIDE ITEMS FROM THE DROPDOWN ===
document.addEventListener('DOMContentLoaded', () => {
    function hideDropdownItems() {
        const nightItem = document.getElementById('toggleNightMenuItem');
        if (nightItem) nightItem.style.display = 'none';

        const modernUIItem = document.getElementById('toggleModernUIMenuItem');
        if (modernUIItem) modernUIItem.style.display = 'none';
    }

    hideDropdownItems();

    const menuContainer = document.getElementById('userDropdownMenuContainer');
    if (menuContainer) {
        const observerMenu = new MutationObserver(hideDropdownItems);
        observerMenu.observe(menuContainer, { childList: true, subtree: true });
    }
});
