// Fullscreen custom
(function() {
    function patchDeskToggleFull() {
        if (typeof window.deskToggleFull === "function") {
            const _orig = window.deskToggleFull;
            window.deskToggleFull = function(b) {
                const wasFullscreen = window.fullscreen;
                const result = _orig.call(this, b);

                if (wasFullscreen && !window.fullscreen) {
                    cleanupFullscreenPatch();
                    return result;
                }

                if (!wasFullscreen && window.fullscreen) {
                    if (typeof enterBrowserFullscreen === "function") {
                        enterBrowserFullscreen(Q('body'));
                        window.browserfullscreen = true;
                    }

                    const topBar = document.getElementById('deskarea1');
                    const bottomBar = document.getElementById('deskarea4');
                    const viewerContainer = document.getElementById('deskarea3x');

                    let safetyHeight = 1;
                    let dynamicSafetyHeight = safetyHeight;
                    let detectionExpanded = false;
                    let hideTimeout;

                    window.fullscreenPatchHandlers = {
                        topBar, bottomBar, viewerContainer, hideTimeout,
                        mouseMoveHandler: null,
                        fullscreenChangeHandler: null
                    };

                    const handlers = window.fullscreenPatchHandlers;


                    function hideBars() {
                        if (handlers.topBar) {
                            handlers.topBar.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
                            handlers.topBar.style.transform = 'translateY(-100%)';
                            handlers.topBar.style.opacity = '0';
                        }
                        if (handlers.bottomBar) {
                            handlers.bottomBar.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
                            handlers.bottomBar.style.transform = 'translateY(100%)';
                            handlers.bottomBar.style.opacity = '0';
                        }
                        dynamicSafetyHeight = safetyHeight;
                        detectionExpanded = false;
                    }

                    function tempShowBars() {
                        if (handlers.topBar) {
                            handlers.topBar.style.transform = 'translateY(0)';
                            handlers.topBar.style.opacity = '1';
                            handlers.topBar.style.zIndex = '9999';
                        }
                        if (handlers.bottomBar) {
                            handlers.bottomBar.style.transform = 'translateY(0)';
                            handlers.bottomBar.style.opacity = '1';
                            handlers.bottomBar.style.zIndex = '9999';
                        }

                        if (handlers.hideTimeout) clearTimeout(handlers.hideTimeout);
                        handlers.hideTimeout = setTimeout(hideBars, 1500); 
                    }


                    if (handlers.topBar) {
                        handlers.topBar.style.transform = 'translateY(-100%)';
                        handlers.topBar.style.opacity = '0';
                        handlers.topBar.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
                        handlers.topBar.style.position = 'absolute';
                        handlers.topBar.style.top = '0';
                        handlers.topBar.style.left = '0';
                        handlers.topBar.style.width = '100%';
                    }
                    if (handlers.bottomBar) {
                        handlers.bottomBar.style.transform = 'translateY(100%)';
                        handlers.bottomBar.style.opacity = '0';
                        handlers.bottomBar.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
                        handlers.bottomBar.style.position = 'absolute';
                        handlers.bottomBar.style.bottom = '0';
                        handlers.bottomBar.style.left = '0';
                        handlers.bottomBar.style.width = '100%';
                    }


                    if (handlers.viewerContainer) {
                        handlers.viewerContainer.style.position = 'absolute';
                        handlers.viewerContainer.style.top = '0';
                        handlers.viewerContainer.style.left = '0';
                        handlers.viewerContainer.style.right = '0';
                        handlers.viewerContainer.style.bottom = '0';
                        handlers.viewerContainer.style.width = '100%';
                        handlers.viewerContainer.style.height = '100%';
                        handlers.viewerContainer.style.margin = '0';
                        handlers.viewerContainer.style.padding = '0';
                        handlers.viewerContainer.style.backgroundColor = 'black';
                    }

                    function mouseMoveHandler(e) {
                        const nearTop = e.clientY <= dynamicSafetyHeight;
                        const nearBottom = e.clientY >= window.innerHeight - dynamicSafetyHeight;

                        if (nearTop || nearBottom) {
                            tempShowBars();
                            if (!detectionExpanded) {
                                dynamicSafetyHeight = Math.floor(window.innerHeight * 0.05);
                                detectionExpanded = true;
                            }
                        }
                    }

                    handlers.mouseMoveHandler = mouseMoveHandler;
                    document.addEventListener('mousemove', mouseMoveHandler, { capture: true, passive: true });

                    function fullscreenChangeHandler() {
                        const isNotFullScreen = !document.fullscreenElement && !document.webkitFullscreenElement &&
                                                !document.mozFullScreenElement && !document.msFullscreenElement;
                        if (isNotFullScreen && window.browserfullscreen && window.fullscreen) {
                            window.deskToggleFull({ shiftKey: false });
                        }
                    }

                    handlers.fullscreenChangeHandler = fullscreenChangeHandler;
                    document.addEventListener('fullscreenchange', fullscreenChangeHandler);
                    document.addEventListener('webkitfullscreenchange', fullscreenChangeHandler);
                    document.addEventListener('mozfullscreenchange', fullscreenChangeHandler);
                    document.addEventListener('MSFullscreenChange', fullscreenChangeHandler);
                }

                return result;
            };
        } else {
            setTimeout(patchDeskToggleFull, 500);
        }
    }

    function cleanupFullscreenPatch() {
        if (window.fullscreenPatchHandlers) {
            const handlers = window.fullscreenPatchHandlers;
            if (handlers.mouseMoveHandler) {
                document.removeEventListener('mousemove', handlers.mouseMoveHandler, { capture: true });
            }
            if (handlers.fullscreenChangeHandler) {
                document.removeEventListener('fullscreenchange', handlers.fullscreenChangeHandler);
                document.removeEventListener('webkitfullscreenchange', handlers.fullscreenChangeHandler);
                document.removeEventListener('mozfullscreenchange', handlers.fullscreenChangeHandler);
                document.removeEventListener('MSFullscreenChange', handlers.fullscreenChangeHandler);
            }
            if (handlers.hideTimeout) clearTimeout(handlers.hideTimeout);

            if (handlers.topBar) handlers.topBar.removeAttribute('style');
            if (handlers.bottomBar) handlers.bottomBar.removeAttribute('style');
            if (handlers.viewerContainer) handlers.viewerContainer.removeAttribute('style');

            delete window.fullscreenPatchHandlers;
            window.browserfullscreen = false;
        }
    }

    window.cleanupFullscreenPatch = cleanupFullscreenPatch;
    patchDeskToggleFull();
})();
