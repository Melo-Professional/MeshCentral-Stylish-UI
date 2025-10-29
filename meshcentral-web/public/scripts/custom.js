// ====== FULLSCREEN ======
(() => {
  'use strict';

  const CONFIG = {
    FULLSCREEN_STYLE_ID: 'mc-true-fs-style',
    HIDE_DELAY_MS: 1000,
    INTRO_DURATION_MS: 5000,
    INTRO_HIDE_DURATION_MS: 1500,
    INDICATOR_STAY_MS: 3000,
    HOT_ZONE_WIDTH_PERCENT: 20,
    PATCH_RETRY_MS: 250,
  };

  const FullscreenEnhancer = (() => {
    let enabled = false;
    let handler = null;
    let hideTimer = null;
    let initialShowTimer = null;
    let indicatorHideTimer = null;
    let container = null;
    let topBar = null;
    let bottomBar = null;
    let indicator = null;
    let arrow = null;

    const injectCSS = () => {
      if (document.getElementById(CONFIG.FULLSCREEN_STYLE_ID)) return;

      const css = `
        #deskarea0.mc-true-fs{
          position:fixed!important;inset:0!important;margin:0!important;padding:0!important;
          overflow:hidden!important;background:#000!important;
        }
        #deskarea0.mc-true-fs #DeskParent{position:absolute!important;inset:0!important;overflow:hidden!important}
        #deskarea0.mc-true-fs #Desk{position:absolute!important;top:0!important;left:0!important}

        #deskarea0.mc-true-fs #deskarea1,#deskarea0.mc-true-fs #deskarea4{
          position:fixed!important;left:0!important;width:100%!important;z-index:9999!important;
          backdrop-filter:blur(4px)!important;-webkit-backdrop-filter:blur(4px)!important;
          box-shadow:0 1px 3px rgba(0,0,0,.3)!important;
          transition:transform 0.3s cubic-bezier(0.25,0.1,0.25,1)!important;
        }
        #deskarea0.mc-true-fs #deskarea1{top:0;transform:translateY(-100%)}
        #deskarea0.mc-true-fs #deskarea4{bottom:0;transform:translateY(100%)}
        #deskarea0.mc-true-fs.show-bars #deskarea1,
        #deskarea0.mc-true-fs.show-bars #deskarea4{transform:translateY(0)}

        #deskarea0.mc-true-fs.intro-hide #deskarea1,
        #deskarea0.mc-true-fs.intro-hide #deskarea4{
          transition:transform ${CONFIG.INTRO_HIDE_DURATION_MS}ms cubic-bezier(0.4,0,0.2,1)!important;
        }

        #deskarea0.mc-true-fs .mc-hot-indicator{
          position:fixed!important;top:0!important;left:50%!important;transform:translateX(-50%)!important;
          width:200px!important;height:0px!important;border-radius:3px!important;
          background:linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent)!important;
          z-index:10000!important;
          opacity:0!important;pointer-events:none!important;
          transition:opacity 0.8s ease, transform 0.3s cubic-bezier(0.25,0.1,0.25,1)!important;
          animation:mc-glow 2s infinite ease-in-out!important;
        }
        @keyframes mc-glow{
          0%,100%{
            box-shadow:
              0 0 12px 2px rgba(167,139,255,0.7),
              0 0 20px 4px rgba(100,150,255,0.4);
          }
          50%{
            box-shadow:
              0 0 20px 6px rgba(0,0,0,0.7),
              0 0 30px 8px rgba(100,150,255,0.8),
              0 0 48px 20px rgba(167,139,255,0.7);
          }
        }
        #deskarea0.mc-true-fs.show-indicator .mc-hot-indicator{
          opacity:1!important;transform:translateX(-50%) translateY(0)!important;
        }
        #deskarea0.mc-true-fs.hide-indicator .mc-hot-indicator{
          opacity:0!important;transform:translateX(-50%) translateY(-30px)!important;
          transition:opacity 0.8s ease, transform 0.8s ease cubic-bezier(0.25,0.1,0.25,1)!important;
        }

        #deskarea0.mc-true-fs .mc-arrow-indicator{
          position:fixed!important;top:0!important;left:50%!important;transform:translateX(-50%)!important;
          width:60px!important;height:60px!important;
          z-index:10001!important;
          opacity:0!important;pointer-events:none!important;
          transition:opacity 0.6s ease, transform 0.6s cubic-bezier(0.25,0.1,0.25,1)!important;
        }
        #deskarea0.mc-true-fs .mc-arrow-indicator .arrow-icon{
          width:100%!important;height:100%!important;
          color:rgba(255,255,255,0.95)!important;
          filter:drop-shadow(0 0 8px rgba(255,255,255,0.8));
          animation:mc-arrow-bounce 2s infinite ease-in-out,
                    mc-arrow-glow 2s infinite ease-in-out!important;
        }
        #deskarea0.mc-true-fs.show-indicator .mc-arrow-indicator{
          opacity:1!important;transform:translateX(-50%) translateY(50px)!important;
        }
        #deskarea0.mc-true-fs.hide-indicator .mc-arrow-indicator{
          opacity:0!important;transform:translateX(-50%) translateY(-90px)!important;
          transition:opacity 0.8s ease, transform 0.8s ease!important;
        }

        @keyframes mc-arrow-bounce{
          0%,20%,50%,80%,100%{transform:translateY(-50px);}
          40%{transform:translateY(0px);}
          60%{transform:translateY(-40px);}
        }
        @keyframes mc-arrow-glow{
          0%,100%{
            filter:
              drop-shadow(0 0 6px rgba(255,255,255,0.7))
              drop-shadow(0 0 12px rgba(100,150,255,0.5));
          }
          50%{
            filter:
              drop-shadow(0 0 10px rgba(255,255,255,0.9))
              drop-shadow(0 0 20px rgba(100,150,255,0.8))
              drop-shadow(0 0 30px rgba(167,139,255,0.6));
          }
        }

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
      arrow.innerHTML = `
        <svg viewBox="0 0 24 24" class="arrow-icon">
          <path fill="currentColor"
                d="M12 5l-7 7h4v7h6v-7h4l-7-7z"/>
        </svg>
      `;
      container.appendChild(arrow);
    };

    const createHandler = () => (e) => {
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const zoneWidth = rect.width * (CONFIG.HOT_ZONE_WIDTH_PERCENT / 100);
      const hotLeft = centerX - zoneWidth / 2;
      const hotRight = centerX + zoneWidth / 2;

      const inHotZone = e.clientY <= 2 && e.clientX >= hotLeft && e.clientX <= hotRight;
      const overTop = topBar && e.clientY <= topBar.getBoundingClientRect().bottom;
      const overBottom = bottomBar && e.clientY >= bottomBar.getBoundingClientRect().top;

      const isOverBars = container.classList.contains('show-bars');
      const trigger = isOverBars ? (overTop || overBottom) : inHotZone;

      if (trigger) {
        [hideTimer, initialShowTimer, indicatorHideTimer].forEach(t => t && clearTimeout(t));
        hideTimer = initialShowTimer = indicatorHideTimer = null;

        container.classList.add('show-bars', 'show-indicator');
        container.classList.remove('intro-hide', 'hide-indicator');
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
    };

    const disable = () => {
      if (!enabled) return;
      enabled = false;

      [hideTimer, initialShowTimer, indicatorHideTimer].forEach(t => t && clearTimeout(t));
      if (handler) document.removeEventListener('mousemove', handler, { capture: true, passive: true });
      if (container) {
        container.classList.remove('mc-true-fs', 'show-bars', 'show-indicator',
                                  'intro-hide', 'hide-indicator');
        if (indicator) indicator.remove();
        if (arrow) arrow.remove();
        container = topBar = bottomBar = indicator = arrow = null;
      }
      const style = document.getElementById(CONFIG.FULLSCREEN_STYLE_ID);
      if (style) style.remove();
    };

    const patch = () => {
      const tryPatch = () => {
        if (typeof window.deskToggleFull !== 'function') {
          setTimeout(tryPatch, CONFIG.PATCH_RETRY_MS);
          return;
        }
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
        if (!inFs && enabled) try { window.deskToggleFull?.(); } catch (_) {}
      }, true));
    };

    return { init: () => { patch(); setupExit(); } };
  })();

  FullscreenEnhancer.init();
})();