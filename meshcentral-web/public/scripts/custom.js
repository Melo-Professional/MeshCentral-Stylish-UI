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

    // Zoom config
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

    /* const log = (msg) => console.log(`[MC-FS] ${msg}`); */

    const injectCSS = () => {
      if (document.getElementById(CONFIG.FULLSCREEN_STYLE_ID)) return;

      const css = `
        /* Core fullscreen layout */
        #deskarea0.mc-true-fs{position:fixed!important;inset:0!important;margin:0!important;padding:0!important;
          overflow:hidden!important;background:#000!important}
        #deskarea0.mc-true-fs #DeskParent{position:absolute!important;inset:0!important;overflow:hidden!important}
        #deskarea0.mc-true-fs #Desk{position:absolute!important;top:0!important;left:0!important}

        /* Top / bottom bars */
        #deskarea0.mc-true-fs #deskarea1,#deskarea0.mc-true-fs #deskarea4{
          position:fixed!important;left:0!important;width:100%!important;z-index:9999!important;
          backdrop-filter:blur(4px)!important;-webkit-backdrop-filter:blur(4px)!important;
          box-shadow:0 1px 3px rgba(0,0,0,.3)!important;
          transition:transform .3s cubic-bezier(.25,.1,.25,1)!important}
        #deskarea0.mc-true-fs #deskarea1{top:0;transform:translateY(-100%)}
        #deskarea0.mc-true-fs #deskarea4{bottom:0;transform:translateY(100%)}
        #deskarea0.mc-true-fs.show-bars #deskarea1,
        #deskarea0.mc-true-fs.show-bars #deskarea4{transform:translateY(0)}

        /* Intro hide animation */
        #deskarea0.mc-true-fs.intro-hide #deskarea1,
        #deskarea0.mc-true-fs.intro-hide #deskarea4{
          transition:transform ${CONFIG.INTRO_HIDE_DURATION_MS}ms cubic-bezier(.4,0,.2,1)!important}

        /* Hot-zone indicator */
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

        /* Arrow indicator */
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
      /* log('CSS injected'); */
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
        ZoomController.showUI(); // notify zoom UI
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
      /* log('Enabled'); */

      container = document.getElementById('deskarea0');
      if (!container) { /* log('ERROR: #deskarea0 missing'); */ return; }
      topBar = document.getElementById('deskarea1');
      bottomBar = document.getElementById('deskarea4');

      injectCSS();
      createIndicator();
      createArrow();

      container.classList.add('mc-true-fs', 'show-bars', 'show-indicator');

      handler = createHandler();
      document.addEventListener('mousemove', handler, { capture: true, passive: true });

      // Intro animation
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

      ZoomController.init(bottomBar, container); // start zoom
    };

    const disable = () => {
      if (!enabled) return;
      enabled = false;
      /* log('Disabled'); */

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
        /* log('Fullscreen patched'); */
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

    /* const log = (msg) => console.log(`[MC-ZOOM] ${msg}`); */

    const getDesk = () => {
      if (deskEl) return deskEl;
      deskEl = document.getElementById('Desk') || container.querySelector('canvas');
      /* if (!deskEl) log('ERROR: desktop element not found'); */
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
      /* log(`Zoom ${zoomValue.toFixed(2)}x`); */
    };

    const reset = () => {
      zoomValue = CONFIG.ZOOM_DEFAULT; panX = panY = 0;
      apply();
      const label = zoomUI?.querySelector('#mc-zoom-label');
      if (label) label.textContent = 'Zoom: 100%';
      const slider = zoomUI?.querySelector('#mc-zoom-slider');
      if (slider) slider.value = 100;
      /* log('Reset'); */
    };

    const createUI = () => {
      if (zoomUI) return;
      zoomUI = document.createElement('div');
      zoomUI.id = 'mc-zoom-container';
      zoomUI.innerHTML = `
        <style>
          #mc-zoom-container{
            position:absolute; left:50%; bottom:6px; transform:translateX(-50%);
            display:flex; align-items:center; gap:6px;
            background:rgba(0,0,0,.55); padding:2px 8px; border-radius:4px;
            font-size:12px; color:#fff; z-index:10002; height:24px;
            transition:opacity .3s ease}
          #mc-zoom-container.hidden{opacity:0;pointer-events:none}
          #mc-zoom-label{cursor:pointer; white-space:nowrap}
          #mc-zoom-slider{width:90px;height:4px;border-radius:2px;background:#555;-webkit-appearance:none;outline:none}
          #mc-zoom-slider::-webkit-slider-thumb{
            -webkit-appearance:none;width:14px;height:14px;border-radius:50%;background:#fff;
            cursor:pointer;box-shadow:0 1px 3px rgba(0,0,0,.4)}
          #mc-zoom-slider::-moz-range-thumb{
            width:14px;height:14px;border-radius:50%;background:#fff;border:none;
            cursor:pointer;box-shadow:0 1px 3px rgba(0,0,0,.4)}
          #mc-zoom-help{
            cursor:pointer; font-weight:bold; font-size:16px; line-height:1; margin-left:4px}
          #mc-zoom-help-banner{
            position:absolute; bottom:32px; left:50%; transform:translateX(-50%);
            background:rgba(0,0,0,.9); color:#fff; padding:8px 12px;
            border-radius:6px; font-size:14px; white-space:nowrap;
            pointer-events:none; opacity:0; transition:opacity .2s ease;
            box-shadow:0 2px 8px rgba(0,0,0,.4)}
          #mc-zoom-help-banner.visible{opacity:1}
        </style>
        <span id="mc-zoom-label">Zoom: 100%</span>
        <input type="range" id="mc-zoom-slider" min="${CONFIG.ZOOM_MIN * 100}" max="${CONFIG.ZOOM_MAX * 100}"
               value="${CONFIG.ZOOM_DEFAULT * 100}" step="${CONFIG.ZOOM_STEP * 100}">
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

      helpBtn.addEventListener('mouseenter', () => {
        helpBanner.classList.add('visible');
      });
      helpBtn.addEventListener('mouseleave', () => {
        helpBanner.classList.remove('visible');
      });
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

      // Wheel
      const desk = getDesk();
      if (desk) {
        wheelHandler = e => {
          if (!e.ctrlKey) return;
          e.preventDefault();
          const delta = e.deltaY < 0 ? CONFIG.ZOOM_STEP : -CONFIG.ZOOM_STEP;
          const rect = desk.getBoundingClientRect();
          const ox = e.clientX - rect.left;
          const oy = e.clientY - rect.top;
          setZoom(zoomValue + delta, ox, oy);
        };
        desk.addEventListener('wheel', wheelHandler, { passive: false });
        /* log('Wheel listener on desktop'); */
      }

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
	deskEl = null;
	zoomUI = null;
	helpBtn = null;
	helpBanner = null;
	keyHandler = null;
	wheelHandler = null;
	panX = 0;
	panY = 0;
	zoomValue = CONFIG.ZOOM_DEFAULT;
	
	bottomBar = bar;
	container = cont;
	
	createUI();
	attachEvents();
	};

    const showUI = () => zoomUI && zoomUI.classList.remove('hidden');
    const hideUI = () => zoomUI && zoomUI.classList.add('hidden');

	const destroy = () => {
	  const desk = deskEl;

	  if (keyHandler) document.removeEventListener('keydown', keyHandler, { capture: true });
	  if (desk && wheelHandler) desk.removeEventListener('wheel', wheelHandler);

	  // Clear UI
	  if (zoomUI && zoomUI.remove) zoomUI.remove();

	  // Clean Refs
	  deskEl = null;
	  zoomUI = null;
	  helpBtn = null;
	  helpBanner = null;
	  keyHandler = null;
	  wheelHandler = null;
	};

    return { init, showUI, hideUI, destroy };
  })();

  /* -------------------------- STARTUP -------------------------- */
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


// === THEME TOGGLE (A / LIGHT / DARK) ===
document.addEventListener('DOMContentLoaded', () => {
    const mastheadRight = document.querySelector('.masthead-right');
    if (!mastheadRight) return;

    // Function to hide items from the dropdown menu
    function hideDropdownItems() {
        const nightItem = document.getElementById('toggleNightMenuItem');
        if (nightItem) nightItem.style.display = 'none';

        const modernUIItem = document.getElementById('toggleModernUIMenuItem');
        if (modernUIItem) modernUIItem.style.display = 'none';
    }

    // Run immediately if the items already exist.
    hideDropdownItems();

    // Observe menu changes to dynamically hide items.
    const menuContainer = document.getElementById('userDropdownMenuContainer');
    if (menuContainer) {
        const observerMenu = new MutationObserver(hideDropdownItems);
        observerMenu.observe(menuContainer, { childList: true, subtree: true });
    }

    if (!document.getElementById('theme-toggle')) {
        const btn = document.createElement('button');
        btn.id = 'theme-toggle';
        btn.className = 'icon-btn';
        btn.style.display = 'flex';
        btn.style.alignItems = 'center';
        btn.style.justifyContent = 'center';
        btn.style.backgroundColor = 'unset';
        btn.style.border = 'none';
        btn.style.cursor = 'pointer';
        btn.style.padding = '6px 8px';
        btn.style.borderRadius = '4px';
        btn.style.transition = 'background-color 0.2s';
        btn.style.gap = '4px';
        btn.style.height = '40px';

        btn.addEventListener('mouseenter', () => btn.style.backgroundColor = 'rgba(255,255,255,0.1)');
        btn.addEventListener('mouseleave', () => btn.style.backgroundColor = 'unset');

        // "A" as SVG
        btn.innerHTML = `
			<svg class="auto-icon" viewBox="0 0 18 18" width="18" height="18" fill="#dee2e6" style="">
				<path fill-rule="evenodd"
					d="M68,121 C72.9705627,121 77,116.970563 77,112 C77,107.029437 72.9705627,103 68,103 
					C63.0294373,103 59,107.029437 59,112 C59,116.970563 63.0294373,121 68,121 Z 
					M68,119.8 C72.2313475,119.8 75.8,116.307821 75.8,112 
					C75.8,108.076069 72.6281738,104.2 68,104.2 L68,119.8 Z"
					transform="matrix(-1 0 0 1 77 -103)" />
			</svg>
            <svg class="sun-icon" viewBox="0 0 512 512" width="18" height="18" fill="#dee2e6" style="display:none;">
                <path d="M361.5 1.2c5 2.1 8.6 6.6 9.6 11.9L391 121l107.9 19.8c5.3 1 9.8 4.6 11.9 9.6s1.5 10.7-1.6 15.2L446.9 256l62.3 90.3c3.1 4.5 3.7 10.2 1.6 15.2s-6.6 8.6-11.9 9.6L391 391 371.1 498.9c-1 5.3-4.6 9.8-9.6 11.9s-10.7 1.5-15.2-1.6L256 446.9l-90.3 62.3c-4.5 3.1-10.2 3.7-15.2 1.6s-8.6-6.6-9.6-11.9L121 391 13.1 371.1c-5.3-1-9.8-4.6-11.9-9.6s-1.5-10.7 1.6-15.2L65.1 256 2.8 165.7c-3.1-4.5-3.7-10.2-1.6-15.2s6.6-8.6 11.9-9.6L121 121 140.9 13.1c1-5.3 4.6-9.8 9.6-11.9s10.7-1.5 15.2 1.6L256 65.1 346.3 2.8c4.5-3.1 10.2-3.7 15.2-1.6zM160 256a96 96 0 1 1 192 0 96 96 0 1 1 -192 0zm224 0a128 128 0 1 0 -256 0 128 128 0 1 0 256 0z"></path>
            </svg>
            <svg class="moon-icon" viewBox="0 0 384 512" width="18" height="18" fill="#dee2e6" style="display:none;">
                <path d="M223.5 32C100 32 0 132.3 0 256S100 480 223.5 480c60.6 0 115.5-24.2 155.8-63.4c5-4.9 6.3-12.5 3.1-18.7s-10.1-9.7-17-8.5c-9.8 1.7-19.8 2.6-30.1 2.6c-96.9 0-175.5-78.8-175.5-176c0-65.8 36-123.1 89.3-153.3c6.1-3.5 9.2-10.5 7.7-17.3s-7.3-11.9-14.3-12.5c-6.3-.5-12.6-.8-19-.8z"></path>
            </svg>
        `;

        btn.addEventListener('click', () => {
            let mode = getstore('nightMode', '0');
            mode = (mode === '0') ? '2' : (mode === '2') ? '1' : '0';
            putstore('nightMode', mode);
            setNightMode();
            updateThemeIcons();
        });

        mastheadRight.insertBefore(btn, mastheadRight.firstChild);
    }

    updateThemeIcons();

    const observer = new MutationObserver(() => updateThemeIcons());
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-bs-theme'] });
});

function updateThemeIcons() {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;

    const mode = getstore('nightMode', '0');
    btn.querySelector('.auto-icon').style.display = (mode === '0') ? 'inline-block' : 'none';
    btn.querySelector('.sun-icon').style.display = (mode === '2') ? 'block' : 'none';
    btn.querySelector('.moon-icon').style.display = (mode === '1') ? 'block' : 'none';
    btn.title = (mode === '0') ? 'Theme: Auto' : (mode === '2') ? 'Theme: Light' : 'Theme: Dark';
}

if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        setNightMode();
        updateThemeIcons();
    });
}

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
