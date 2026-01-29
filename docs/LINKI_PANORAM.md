# Jak budować linki między panoramami (Panolens)

## Metoda `link()`

```js
panorama.link(docelowaPanorama, position [, imageScale] [, imageSrc])
```

| Parametr           | Typ               | Opis                                                                                                          |
| ------------------ | ----------------- | ------------------------------------------------------------------------------------------------------------- |
| `docelowaPanorama` | PANOLENS.Panorama | Panorama, do której prowadzi kliknięcie.                                                                      |
| `position`         | THREE.Vector3     | **Pozycja na OBECNEJ panoramie**, w której ma być portal (strzałka). Współrzędne x, y, z w przestrzeni sfery. |
| `imageScale`       | number (opc.)     | Skala ikony portalu. Domyślnie **300**.                                                                       |
| `imageSrc`         | string (opc.)     | URL lub dane obrazka ikony. Domyślnie **PANOLENS.DataImage.Arrow**.                                           |

Link jest **jednokierunkowy**. Aby było przejście w obie strony (A ↔ B), trzeba wywołać `link` dwa razy:

- `panoramaA.link(panoramaB, pozycjaNaA)` → z A do B
- `panoramaB.link(panoramaA, pozycjaNaB)` → z B do A

---

## Kolejność w kodzie

1. Utwórz wszystkie panoramy (`new PANOLENS.ImagePanorama(...)`).
2. **Potem** dodaj linki – wywołaj `.link()` na każdej panoramie, z której ma być przejście.
3. Na końcu dodaj panoramy do viewera: `viewer.add(...panoramas)`.

```js
// 1. Tworzenie panoram
var p0 = new PANOLENS.ImagePanorama('img/4K_pano_00.webp');
var p1 = new PANOLENS.ImagePanorama('img/4K_pano_01.webp');
var p2 = new PANOLENS.ImagePanorama('img/4K_pano_02.webp');

// 2. Linki (pozycja = gdzie na TEJ panoramie stoi portal)
p0.link(p1, new THREE.Vector3(7000, -2000, 0)); // z p0 do p1
p0.link(p2, new THREE.Vector3(5000, -500, -2000)); // z p0 do p2
p1.link(p2, new THREE.Vector3(4500, -52, -2044)); // z p1 do p2
p1.link(p0, new THREE.Vector3(3840, -94, 3185)); // z p1 do p0
p2.link(p0, new THREE.Vector3(1310, -229, 4808)); // z p2 do p0
p2.link(p1, new THREE.Vector3(-4971, -353, 281)); // z p2 do p1

// 3. Dodanie do viewera
viewer.add(p0, p1, p2);
```

---

## Jak znaleźć współrzędne `position` (Vector3)

1. Otwórz stronę z panoramą i konsolę przeglądarki (F12).
2. Wejdź na panoramę, z której ma wychodzić link.
3. Ustaw widok tak, aby „cel” portalu był w centrum ekranu.
4. **Przytrzymaj Ctrl i kliknij** w widoku.
5. W konsoli pojawi się np.: `Kliknięcie w: x=7000.00, y=-2000.00, z=0.00`.
6. Użyj tych wartości: `new THREE.Vector3(7000, -2000, 0)` jako drugi argument `link()`.

---

## Własna ikona / rozmiar portalu

```js
// Większy portal (skala 500) i własna ikona
panoramaA.link(panoramaB, new THREE.Vector3(x, y, z), 500, 'url-do-ikony.png');
```

---

## Podsumowanie

- **Kto wywołuje:** panorama **źródłowa** (ta, na której ma być portal).
- **Pierwszy argument:** panorama **docelowa**.
- **Drugi argument:** `THREE.Vector3(x, y, z)` – miejsce na **obecnej** panoramie.
- Współrzędne można pobrać przez **Ctrl+klik** w widoku (log w konsoli w `panorama-standalone.js`).
