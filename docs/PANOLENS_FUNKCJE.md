# Funkcjonalności Panolens – co już jest i co warto dodać

## Co projekt już używa z Panolens

| Funkcja                         | Stan                                                                                                                             |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **PANOLENS.Viewer**             | Tak – kontener, `cameraFov`, własny renderer (`preserveDrawingBuffer`)                                                           |
| **PANOLENS.ImagePanorama**      | Tak – panoramy z plików equirectangular (np. .webp)                                                                              |
| **Linki między panoramami**     | Tak – `panorama.link()` z ikoną (portale), konfiguracja w `panoramas.json` → `links`                                             |
| **Tween przy zmianie panoramy** | Tak – `viewer.tweenControlCenter()` przy `enter-fade-start`                                                                      |
| **Infospoty (hotspoty „i”)**    | Konfiguracja w `panoramas.json` → `infospots` jest, ale **kod tworzący infospoty jest zakomentowany** w `panorama-standalone.js` |
| **Control bar**                 | Wyłączony – `controlBar: false`                                                                                                  |
| **Zrzut ekranu**                | Własna implementacja (przycisk + canvas), nie z Panolens                                                                         |

---

## Co Panolens jeszcze oferuje (a czego nie używamy)

### 1. **Infospoty** – warte włączenia

- **Stan:** Masz `infospots` w JSON i gotową logikę w kodzie, tylko jest **zakomentowana**.
- **Co dają:** Hotspoty z ikoną „i”, `addHoverText()` (tekst przy najechaniu), klik → `showInfoBox(clickText)`.
- **Warto dodać:** Odkomentowanie bloku infospotów. Opcjonalnie:
  - **`infospot.focus()`** – po kliku kamera płynnie jedzie do środka hotspotu (zamiast tylko okienka z tekstem).
  - **`addHoverElement(htmlElement)`** – zamiast samego tekstu: własny fragment HTML przy hover (np. miniatura, link).

**Rekomendacja:** Tak – odkomentuj infospoty; `focus()` i `addHoverElement()` tylko jeśli potrzebujesz takiego zachowania.

---

### 2. **Control bar (pasek sterowania)**

- **Opcje Viewera:** `controlBar: true`, `controlButtons: ['fullscreen', 'setting', 'video']`, `autoHideControlBar`.
- **Co daje:** Gotowy pasek na dole z przyciskami m.in. **fullscreen**, ustawienia, sterowanie wideo (gdy jest VideoPanorama).
- **Warto dodać:** Tylko jeśli chcesz **fullscreen bez pisania własnego kodu** – wtedy włącz `controlBar: true` i ewentualnie zostaw tylko `['fullscreen']`. Minus: domyślny wygląd paska może kolidować z Twoim minimalistycznym UI (przycisk zrzutu, brak tła).

**Rekomendacja:** Na razie **nie** – masz już czysty interfejs; fullscreen lepiej dodać jednym własnym przyciskiem (np. obok zrzutu) i bez paska.

---

### 3. **Fullscreen**

- Można przez **control bar** (jak wyżej) albo **własny przycisk** + `element.requestFullscreen()` na kontenerze.
- **Warto dodać:** Tak – jeden przycisk (ikona fullscreen) obok przycisku zrzutu, bez włączania całego control bara.

**Rekomendacja:** Tak – mały przycisk fullscreen w prawym górnym rogu (obok aparatu) to sensowny dodatek.

---

### 4. **VideoPanorama**

- Panorama 360° z **wideo** zamiast obrazka.
- **Wymaga:** Plików wideo 360°, obsługi play/pause (Panolens ma to w control bar przy `controlButtons: ['video']`).
- **Warto dodać:** Tylko jeśli planujesz **treści wideo 360°** w tym samym viewerze co obrazy (np. w `panoramas.json` wpis typu `video: "pano/film.webm"` i rozróżnienie Image vs Video w kodzie).

**Rekomendacja:** Na razie **nie** – dopiero gdy pojawią się konkretne pliki wideo 360°.

---

### 5. **CubePanorama**

- Panorama z **cubemapy** (6 osobnych tekstur: przód, tył, góra, dół, lewo, prawo) zamiast jednego equirectangular.
- **Wymaga:** Innego przygotowania assetów (6 plików lub atlas).
- **Warto dodać:** Tylko jeśli masz lub planujesz źródła w formacie cubemap (np. z renderów 3D).

**Rekomendacja:** Nie – dopóki trzymasz się equirectangular (obecne .webp), nie ma potrzeby.

---

### 6. **Little planet („mała planeta”)**

- **PANOLENS.LittlePlanet** / **ImageLittlePlanet** – widok „fish-eye” / mała planeta zamiast standardowej sfery.
- Efekt bardziej „gadżetowy” niż informacyjny.
- **Warto dodać:** Tylko jako opcjonalny tryb widoku (np. przełącznik „normalny / little planet”) dla jednej panoramy.

**Rekomendacja:** Niski priorytet – ładne do pokazu, ale nie konieczne do działania projektu.

---

### 7. **Widget – własne przyciski/menu**

- **PANOLENS.Widget** – `addControlBar()`, `addControlButton()`, `createFullscreenButton()` itd.
- Służy do dokładania przycisków do UI Panolens zamiast własnego HTML/JS.
- **Warto dodać:** Raczej nie – już masz własny przycisk zrzutu i możesz dodać fullscreen w tym samym stylu; Widget komplikuje bez wyraźnej korzyści.

**Rekomendacja:** Nie.

---

### 8. **Reticle (celownik)**

- Celownik na środku ekranu, przydatny przy sterowaniu bez myszy (np. gogle, tablety) lub w trybie „gaze”.
- **Warto dodać:** Tylko jeśli celujesz w urządzenia bez myszy lub VR.

**Rekomendacja:** Nie – dopóki interfejs jest „mysz + klik”.

---

## Podsumowanie – co warto dodać

| Co                            | Warto?      | Uwagi                                                                                 |
| ----------------------------- | ----------- | ------------------------------------------------------------------------------------- |
| **Odkomentowanie infospotów** | **Tak**     | Masz gotową konfigurację i kod; ewentualnie dopisać `focus()` lub `addHoverElement()` |
| **Przycisk fullscreen**       | **Tak**     | Jeden przycisk obok zrzutu, bez włączania control bara                                |
| **Control bar**               | Nie         | Zostaw `controlBar: false`, pełen kontroli masz przez własne przyciski                |
| **VideoPanorama**             | Na później  | Gdy pojawią się pliki wideo 360°                                                      |
| **CubePanorama**              | Nie         | Dopóki trzymasz equirectangular                                                       |
| **Little planet**             | Opcjonalnie | Efekt „wow”, niski priorytet                                                          |
| **Widget / Reticle**          | Nie         | Niepotrzebne przy obecnym use case                                                    |

---

## Szybkie kroki do wdrożenia

1. **Infospoty:** W `panorama-standalone.js` odkomentuj blok `INFOSPOTS_CONFIG.forEach(...)` (tworzenie infospotów i `addHoverText` / `showInfoBox`). Opcjonalnie w handlerze kliku wywołaj `infospot.focus()` przed `showInfoBox()`.
2. **Fullscreen:** W `index.html` dodaj drugi przycisk (ikona fullscreen), w JS: `viewer.container.requestFullscreen()` / `document.exitFullscreen()`, pokazywany razem z przyciskiem zrzutu (np. ta sama klasa `.nav-btn-visible` lub wspólny wrapper).

Jeśli chcesz, mogę w następnym kroku zaproponować konkretne zmiany w plikach (diff) pod odkomentowanie infospotów i dodanie przycisku fullscreen.
