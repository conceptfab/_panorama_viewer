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
    debug: true, // true = logi w konsoli (np. zmiana panoramy, Ctrl+klik współrzędne)
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
  fetch('panoramas.json?t=' + Date.now(), { cache: 'no-store' })
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
          image: 'img/' + item.file,
          position: new THREE.Vector3(
            item.position[0],
            item.position[1],
            item.position[2],
          ),
          file: item.file,
          index: i,
        };
      });

      var viewer = new PANOLENS.Viewer({
        container: document.getElementById(ID.PANORAMA_CONTAINER),
        controlBar: false,
        cameraFov: CONFIG.cameraFov,
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

      // Infospoty z konfiguracji (ikony „i” – wyłączone, visible: false)
      INFOSPOTS_CONFIG.forEach(function (cfg) {
        var infospot = new PANOLENS.Infospot(
          hotspotSize,
          PANOLENS.DataImage.Info,
          true,
        );
        infospot.position.set(
          cfg.position[0],
          cfg.position[1],
          cfg.position[2],
        );
        infospot.addHoverText(cfg.hoverText);
        panoramas[cfg.panoramaIndex].add(infospot);
        infospot.addEventListener('click', function () {
          showInfoBox(cfg.clickText);
          if (infospot.element) infospot.element.style.display = 'none';
        });
        infospot.visible = cfg.visible;
      });

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
      console.log('[DEBUG] Viewer gotowy, linki zastosowane.');

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
    })
    .catch(function (err) {
      console.error('Błąd ładowania panoramas.json:', err);
      var el = document.getElementById(ID.PANORAMA_CONTAINER);
      if (el)
        el.innerHTML =
          '<p style="color:#c00;padding:20px;">Błąd ładowania panoramas.json. Sprawdź konsolę.</p>';
    });
})();
