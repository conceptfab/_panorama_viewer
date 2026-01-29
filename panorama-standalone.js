(function () {
  'use strict';

  // --- STAŁE ID elementów DOM ---
  var ID = {
    PANORAMA_CONTAINER: 'panorama-container',
    SPLASH_OVERLAY: 'splash-overlay',
    SPLASH_PROGRESS: 'splash-progress',
    SPLASH_PROGRESS_BAR: 'splash-progress-bar',
  };

  // --- KONFIGURACJA ---
  var CONFIG = {
    cameraFov: 55,
    tweenDuration: 800,
    hotspotSize: 360, // 2× większe ikony (portale + infospoty)
    splashDuration: 3000,
    fadeToPanoramaDuration: 3000,
    debug: false, // true = logi w konsoli (np. zmiana panoramy, Ctrl+klik współrzędne)
    jsonVersion: 1, // zwiększ przy zmianie panoramas.json (cache)
  };

  // --- POMOCNICZE ---
  function log() {
    if (CONFIG.debug && typeof console !== 'undefined' && console.log) {
      console.log.apply(console, arguments);
    }
  }
  function logError() {
    if (CONFIG.debug && typeof console !== 'undefined' && console.error) {
      console.error.apply(console, arguments);
    }
  }

  // Ładowanie definicji z panoramas.json (panoramy, linki, infospoty)
  fetch('panoramas.json?v=' + CONFIG.jsonVersion, { cache: 'no-store' })
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function (data) {
      var PANORAMA_CONFIG = data.panoramas;
      var INFOSPOTS_CONFIG = data.infospots || [];
      if (!PANORAMA_CONFIG || !PANORAMA_CONFIG.length) {
        throw new Error('Brak panoram w panoramas.json');
      }

      var panoramasData = PANORAMA_CONFIG.map(function (item, i) {
        return {
          image: 'pano/' + item.file,
          position: new THREE.Vector3(
            item.position[0],
            item.position[1],
            item.position[2],
          ),
          file: item.file,
          index: i,
        };
      });

      // Renderer z preserveDrawingBuffer: true, żeby zrzut canvas (np. w Vivaldi) nie był pusty
      var renderer = new THREE.WebGLRenderer({
        preserveDrawingBuffer: true,
        antialias: true,
      });
      var viewer = new PANOLENS.Viewer({
        container: document.getElementById(ID.PANORAMA_CONTAINER),
        controlBar: false,
        cameraFov: CONFIG.cameraFov,
        renderer: renderer,
      });

      // Ekran startowy: preload (cache przeglądarki = Panolens użyje tych samych URL), progress, fade
      var splashOverlay = document.getElementById(ID.SPLASH_OVERLAY);
      var splashProgressBar = document.getElementById(ID.SPLASH_PROGRESS_BAR);
      var splashProgress = document.getElementById(ID.SPLASH_PROGRESS);
      var totalImages = panoramasData.length;
      var loadedCount = 0;

      function setProgress(percent) {
        if (splashProgressBar) {
          splashProgressBar.style.width =
            Math.min(100, Math.max(0, percent)) + '%';
        }
      }

      function onSplashFadeEnd() {
        if (splashOverlay) {
          splashOverlay.style.willChange = '';
          splashOverlay.remove();
        }
        if (splashProgress) splashProgress.remove();
        var screenshotBtn = document.getElementById('screenshot-btn');
        if (screenshotBtn) screenshotBtn.classList.add('nav-btn-visible');
        var fullscreenBtn = document.getElementById('fullscreen-btn');
        if (fullscreenBtn) fullscreenBtn.classList.add('nav-btn-visible');
      }

      panoramasData.forEach(function (data) {
        var img = new Image();
        img.onload = function () {
          loadedCount += 1;
          setProgress((loadedCount / totalImages) * 100);
        };
        img.onerror = function () {
          loadedCount += 1;
          setProgress((loadedCount / totalImages) * 100);
        };
        img.src = data.image;
      });

      setTimeout(function () {
        if (splashOverlay) {
          splashOverlay.style.willChange = 'opacity';
          splashOverlay.classList.add('hidden');
        }
        setTimeout(onSplashFadeEnd, CONFIG.fadeToPanoramaDuration);
      }, CONFIG.splashDuration);

      // --- PANORAMY ---
      var panoramas = panoramasData.map(function (data, i) {
        var cfg = PANORAMA_CONFIG[i];
        var p = new PANOLENS.ImagePanorama(data.image);
        p.addEventListener('enter-fade-start', function () {
          log('[Panorama] Aktualna: #' + i + ' – ' + data.file);
          viewer.tweenControlCenter(data.position, CONFIG.tweenDuration);
        });
        p.addEventListener('error', function () {
          logError('[Panorama] Błąd ładowania: ' + data.image);
          if (typeof showInfoBox === 'function') {
            showInfoBox('Nie udało się załadować panoramy: ' + data.image);
          }
        });
        return p;
      });

      function showInfoBox(text) {
        var old = document.querySelector('.info-box');
        if (old) old.remove();
        var box = document.createElement('div');
        box.className = 'info-box';
        var p = document.createElement('p');
        p.textContent = text;
        box.appendChild(p);
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = 'Zamknij';
        btn.addEventListener('click', function () {
          box.remove();
        });
        box.appendChild(btn);
        box.style.display = 'block';
        document.body.appendChild(box);
      }

      var hotspotSize = CONFIG.hotspotSize;

      // Ikona portali: angle-up w stylu Line Awesome (cienki chevron ^, nie wypełniony trójkąt)
      var LINK_ICON_ANGLE_UP =
        'data:image/svg+xml,' +
        encodeURIComponent(
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512">' +
            '<path fill="none" stroke="rgba(255,255,255,0.95)" stroke-width="28" stroke-linecap="round" stroke-linejoin="round" d="M48 224 L160 96 L272 224"/>' +
            '</svg>',
        );

      // Hotspoty informacyjne – zakomentowane
      // INFOSPOTS_CONFIG.forEach(function (cfg) {
      //   var infospot = new PANOLENS.Infospot(
      //     hotspotSize,
      //     PANOLENS.DataImage.Info,
      //     true,
      //   );
      //   infospot.position.set(
      //     cfg.position[0],
      //     cfg.position[1],
      //     cfg.position[2],
      //   );
      //   infospot.addHoverText(cfg.hoverText);
      //   panoramas[cfg.panoramaIndex].add(infospot);
      //   infospot.addEventListener('click', function () {
      //     showInfoBox(cfg.clickText);
      //     if (infospot.element) infospot.element.style.display = 'none';
      //   });
      //   infospot.visible = cfg.visible;
      // });

      // Linki między panoramami z konfiguracji (ikona portalu = angle-up)
      PANORAMA_CONFIG.forEach(function (cfg, fromIndex) {
        cfg.links.forEach(function (link) {
          var toPanorama = panoramas[link.to];
          var pos = link.position;
          panoramas[fromIndex].link(
            toPanorama,
            new THREE.Vector3(pos[0], pos[1], pos[2]),
            hotspotSize,
            LINK_ICON_ANGLE_UP,
          );
        });
      });
      log('[DEBUG] Viewer gotowy, linki zastosowane.');

      viewer.add.apply(viewer, panoramas);
      viewer.setPanorama(panoramas[0]);
      log('[Panorama] Aktualna: #0 – ' + panoramasData[0].file);

      // Tryb deweloperski: Ctrl+klik → współrzędne w konsoli (tylko gdy CONFIG.debug)
      var raycaster = new THREE.Raycaster();
      var mouse = new THREE.Vector2();
      viewer.container.addEventListener('click', function (event) {
        if (!event.ctrlKey) return;
        var rect = viewer.container.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, viewer.camera);
        var hits = raycaster.intersectObject(viewer.panorama, true);
        if (hits.length > 0) {
          var pt = hits[0].point;
          log(
            'Kliknięcie w: x=' +
              pt.x.toFixed(2) +
              ', y=' +
              pt.y.toFixed(2) +
              ', z=' +
              pt.z.toFixed(2),
          );
        }
      });

      // Pełny ekran – całe body (żeby przyciski były widoczne), ikona przełącza na „wyjście”
      var fullscreenBtn = document.getElementById('fullscreen-btn');
      if (fullscreenBtn) {
        var iconExpand = fullscreenBtn.querySelector('.icon-expand');
        var iconCompress = fullscreenBtn.querySelector('.icon-compress');
        function setFullscreenIcon(isFullscreen) {
          if (iconExpand) iconExpand.style.display = isFullscreen ? 'none' : '';
          if (iconCompress)
            iconCompress.style.display = isFullscreen ? '' : 'none';
          fullscreenBtn.setAttribute(
            'aria-label',
            isFullscreen ? 'Wyjdź z pełnego ekranu' : 'Pełny ekran',
          );
          fullscreenBtn.setAttribute(
            'title',
            isFullscreen ? 'Wyjdź z pełnego ekranu' : 'Pełny ekran',
          );
        }
        document.addEventListener('fullscreenchange', function () {
          setFullscreenIcon(!!document.fullscreenElement);
        });
        fullscreenBtn.addEventListener('click', function () {
          if (!document.fullscreenElement) {
            document.body.requestFullscreen().catch(function (err) {
              logError('Fullscreen nie powiódł się:', err);
              console.error('Fullscreen nie powiódł się:', err);
            });
          } else {
            document.exitFullscreen();
          }
        });
      }

      // Zrzut widoku panoramy do pliku WebP (hotspoty chowane na chwilę)
      var screenshotBtn = document.getElementById('screenshot-btn');
      if (screenshotBtn) {
        screenshotBtn.addEventListener('click', function () {
          var canvas = viewer.container.querySelector('canvas');
          if (!canvas) {
            logError('Brak canvas do zrzutu.');
            return;
          }
          var hidden = [];
          viewer.panorama.traverse(function (obj) {
            if (obj instanceof PANOLENS.Infospot) {
              hidden.push(obj);
              obj.visible = false;
            }
          });
          function doCapture() {
            try {
              var w = canvas.width;
              var h = canvas.height;
              var tmp = document.createElement('canvas');
              tmp.width = w;
              tmp.height = h;
              var ctx = tmp.getContext('2d');
              ctx.drawImage(canvas, 0, 0);
              var label = 'CONCEPTFAB Panorama Viewer';
              var fontSize = Math.max(14, Math.round(w / 60));
              ctx.font = '300 ' + fontSize + 'px Inter, sans-serif';
              ctx.textAlign = 'right';
              ctx.textBaseline = 'top';
              var padX = Math.round(w * 0.04);
              var padY = Math.round(h * 0.03);
              ctx.shadowColor = 'rgba(0,0,0,0.6)';
              ctx.shadowBlur = 4;
              ctx.shadowOffsetX = 1;
              ctx.shadowOffsetY = 1;
              ctx.fillStyle = 'rgba(255,255,255,0.95)';
              ctx.fillText(label, w - padX, padY);
              var ext = 'webp';
              var dataUrl;
              try {
                dataUrl = tmp.toDataURL('image/webp', 0.92);
              } catch (e) {
                ext = 'jpg';
                dataUrl = tmp.toDataURL('image/jpeg', 0.92);
              }
              var name =
                'panorama-zrzut-' +
                new Date().toISOString().slice(0, 19).replace(/:/g, '-') +
                '.' +
                ext;
              var a = document.createElement('a');
              a.download = name;
              a.href = dataUrl;
              a.click();
            } catch (e) {
              logError('Zrzut nie powiódł się:', e);
              console.error('Zrzut nie powiódł się:', e);
            } finally {
              hidden.forEach(function (obj) {
                obj.visible = true;
              });
            }
          }
          requestAnimationFrame(function () {
            requestAnimationFrame(doCapture);
          });
        });
      }
    })
    .catch(function (err) {
      console.error('Błąd ładowania panoramas.json:', err);
      var el = document.getElementById(ID.PANORAMA_CONTAINER);
      if (el)
        el.innerHTML =
          '<p style="color:#c00;padding:20px;">Błąd ładowania panoramas.json. Sprawdź konsolę.</p>';
    });
})();
