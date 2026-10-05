# AtlasCube Radio Card

A compact, modern Home Assistant Lovelace card for AtlasCube radio devices.

> **Current status: public test release**
>
> The card is currently being tested before the first stable release. It supports two display modes: the original minimalist radio card and an optional track artwork mode with a dynamic background.

---

## 🇬🇧 English

### Features

- Automatic detection of the AtlasCube device and its entities
- No hard-coded AtlasCube device name required
- Compact Previous / Play-Stop / Next controls
- Large central Play/Stop button
- Station name and current track information
- Source selector
- Volume slider and mute control
- Dynamic online/offline state
- Rainbow radio animation while playing
- Wi-Fi-off indicator when the device is offline
- Automatically opens the AtlasCube web interface from the Home Assistant device configuration_url
- Uses the native MQTT availability state propagated by Home Assistant
- Does not require a separate ping sensor
- Optional manual availability override
- Optional source and volume sections
- Optional **Track Artwork** mode
- Dynamic album artwork, artist, title and album information
- Dynamic blurred background based on the current track artwork
- Artwork lookup using the iTunes Search API
- Cached artwork results to avoid repeated lookups
- Radio icon fallback when artwork is unavailable

### Requirements

- Home Assistant
- AtlasCube radio integrated into Home Assistant
- AtlasCube entities available through the MQTT integration
- HACS is recommended for installation

The card discovers the AtlasCube device from the Home Assistant device/entity registries instead of depending on a fixed entity naming scheme.

### Installation with HACS

#### During testing

Until the card is accepted into the default HACS repository list:

1. Open HACS.
2. Open the three-dot menu in the upper-right corner.
3. Select Custom repositories.
4. Add `MarLip1981/atlascube-radio-card`.
5. Select Dashboard as the repository type.
6. Install AtlasCube Radio Card.
7. Reload the Home Assistant frontend if requested.

#### Future stable publication

The goal is to publish the card as a regular HACS Dashboard repository. HACS requires a public GitHub repository, a valid `hacs.json`, suitable repository metadata and a passing HACS validation. A GitHub Release is required for submission to the default HACS repository list.

### Automatic configuration

After adding the card to a dashboard, open the card editor and use:

**Automatically detect AtlasCube**

The editor detects the AtlasCube device and fills the main entity fields automatically:

- Station
- Track title
- Playback state
- Volume
- Source
- Previous
- Play
- Stop
- Next

The Availability field is optional and should normally remain empty.

### MQTT availability

AtlasCube exposes its availability through MQTT. Home Assistant processes this availability information and applies it to the native AtlasCube entities.

The card therefore uses the state of the native AtlasCube entities as the frontend representation of MQTT availability:

- normal entity state → AtlasCube online
- `unavailable` / `unknown` → AtlasCube offline

A separate `binary_sensor` ping helper is not required.

A manually selected availability entity can still be configured as an explicit override when needed.

### Web interface

Clicking the card header opens the AtlasCube web interface.

The address is obtained automatically from the AtlasCube device `configuration_url`.

You do not need to enter the device IP address manually.

### Track artwork mode

The card has an optional **Track Artwork** switch in the visual card editor. It is disabled by default so existing configurations keep the original minimalist appearance.

**Off — minimalist mode**

- Uses the original compact card layout.
- Keeps the existing radio/playback indicator.
- Keeps Previous / Play-Stop / Next controls.
- Keeps the source selector and volume controls when enabled.
- Does not display the album-art section.

**On — artwork mode**

- Displays the station name above the artwork.
- Searches for artwork using the current track title.
- Shows the album cover when a match is found.
- Uses the cover as a blurred, darkened dynamic background.
- Shows artist, track title and album when available.
- Uses the AtlasCube radio icon as the fallback when artwork cannot be found.
- Keeps all existing playback controls, volume and source controls.

Artwork lookup uses the public iTunes Search API. The card does not require an additional Home Assistant integration, sensor or API key. Results are cached during the current card session.

### Manual YAML configuration

    type: custom:atlascube-radio-card

    radio:
      station: sensor.atlascube_radio_stacja_radiowa
      title: sensor.atlascube_radio_tytul_utworu
      playback: sensor.atlascube_9140_playback
      volume: number.salon_atlascube_radio_glosnosc
      source: select.atlascube_9140_source
      previous: button.atlascube_9140_previous
      play: button.atlascube_9140_play
      stop: button.atlascube_9140_stop
      next: button.atlascube_9140_next
      # availability: optional manual override

    show_source: true
    show_volume: true
    show_artwork: false

    # show_artwork: true włącza tryb z dynamicznym tłem i okładką
    show_artwork: false

    # show_artwork: true enables the dynamic artwork/background mode

### Status indicators

| Indicator | Meaning |
|---|---|
| Radio icon | Online and stopped |
| Rainbow radio icon | Online and playing |
| Wi-Fi-off icon | AtlasCube unavailable/offline |

### Manual installation

Download `atlascube-radio-card.js` from this repository and add it as a Lovelace JavaScript resource.

---

## 🇵🇱 Polski

### Funkcje

- Automatyczne wykrywanie urządzenia AtlasCube i jego encji
- Brak zależności od konkretnej nazwy urządzenia
- Kompaktowe przyciski Poprzednia / Play-Stop / Następna
- Duży centralny przycisk Play/Stop
- Nazwa stacji i tytuł aktualnego utworu
- Wybór źródła
- Suwak głośności i wyciszenie
- Dynamiczny stan online/offline
- Tęczowa animacja radia podczas odtwarzania
- Ikona Wi-Fi-off, gdy AtlasCube jest niedostępny
- Opcjonalny tryb **Okładka utworu**
- Dynamiczne wyszukiwanie okładki aktualnego utworu
- Rozmyte, przyciemnione tło oparte na znalezionej okładce
- Wyświetlanie stacji, wykonawcy, tytułu i albumu
- Ikona radia jako zastępstwo, gdy okładka nie zostanie znaleziona
- Wyszukiwanie okładek przez publiczne iTunes Search API, bez klucza API
- Buforowanie znalezionych okładek podczas działania karty
- Automatyczne otwieranie panelu WWW AtlasCube na podstawie `configuration_url` urządzenia Home Assistant
- Wykorzystanie natywnej dostępności MQTT obsługiwanej przez Home Assistant
- Brak potrzeby tworzenia osobnego sensora ping
- Opcjonalny ręczny override dostępności
- Opcjonalne sekcje źródła i głośności

### Wymagania

- Home Assistant
- Radio AtlasCube dodane do Home Assistant
- Encje AtlasCube dostępne przez integrację MQTT
- Zalecane HACS

Karta wykrywa urządzenie na podstawie rejestru urządzeń i encji Home Assistant. Nie zakłada jednej, sztywnej nazwy urządzenia ani adresu IP.

### Instalacja przez HACS

#### W okresie testów

Dopóki karta nie zostanie dodana do domyślnej listy repozytoriów HACS:

1. Otwórz HACS.
2. Otwórz menu trzech kropek w prawym górnym rogu.
3. Wybierz Custom repositories / Niestandardowe repozytoria.
4. Dodaj `MarLip1981/atlascube-radio-card`.
5. Jako typ wybierz Dashboard.
6. Zainstaluj AtlasCube Radio Card.
7. Jeśli Home Assistant o to poprosi, przeładuj frontend.

### Automatyczna konfiguracja

Po dodaniu karty do dashboardu otwórz jej edytor i użyj:

**Automatycznie wykryj AtlasCube**

Edytor automatycznie wyszukuje urządzenie AtlasCube i przypisuje główne encje:

- stacja
- tytuł utworu
- stan odtwarzania
- głośność
- źródło
- poprzednia
- play
- stop
- następna

Pole Dostępność powinno normalnie pozostać puste.

### Dostępność MQTT

AtlasCube przekazuje dostępność przez MQTT. Home Assistant przetwarza tę informację i uwzględnia ją w stanach natywnych encji AtlasCube.

Karta wykorzystuje więc stan encji jako reprezentację dostępności MQTT:

- normalny stan encji → AtlasCube online
- `unavailable` / `unknown` → AtlasCube offline

Nie trzeba tworzyć `binary_sensor.192_168_1_6` ani żadnego innego sensora ping.

Pole dostępności pozostaje dostępne jako ręczny override, jeśli w konkretnej instalacji będzie potrzebny.

### Panel WWW AtlasCube

Kliknięcie nagłówka karty otwiera panel WWW AtlasCube.

Adres jest pobierany automatycznie z `configuration_url` urządzenia Home Assistant.

Nie trzeba wpisywać adresu IP ręcznie.

### Tryb „Okładka utworu”

W edytorze wizualnym karty dostępny jest przełącznik **Okładka utworu**. Jest domyślnie wyłączony, dzięki czemu dotychczasowe konfiguracje zachowują minimalistyczny wygląd.

**Wyłączony — karta minimalistyczna**

- Oryginalny, kompaktowy wygląd karty.
- Dotychczasowy wskaźnik radia / nutki.
- Przyciski Poprzednia / Play-Stop / Następna.
- Wybór źródła i regulacja głośności.
- Brak sekcji okładki i dynamicznego tła.

**Włączony — karta z okładką**

- Nazwa stacji nad okładką.
- Automatyczne wyszukiwanie okładki na podstawie aktualnego utworu.
- Okładka albumu wyświetlana centralnie.
- Dynamiczne, rozmyte i przyciemnione tło z kolorów okładki.
- Wykonawca, tytuł i album, jeśli są dostępne.
- Ikona radia jako fallback, gdy nie uda się znaleźć okładki.
- Wszystkie dotychczasowe przyciski, głośność i wybór źródła pozostają dostępne.

Wyszukiwanie wykorzystuje publiczne iTunes Search API. Nie wymaga dodatkowej integracji Home Assistant ani klucza API.

### Konfiguracja YAML

    type: custom:atlascube-radio-card

    radio:
      station: sensor.atlascube_radio_stacja_radiowa
      title: sensor.atlascube_radio_tytul_utworu
      playback: sensor.atlascube_9140_playback
      volume: number.salon_atlascube_radio_glosnosc
      source: select.atlascube_9140_source
      previous: button.atlascube_9140_previous
      play: button.atlascube_9140_play
      stop: button.atlascube_9140_stop
      next: button.atlascube_9140_next
      # availability: opcjonalny ręczny override

    show_source: true
    show_volume: true

### Wskaźniki stanu

| Wskaźnik | Znaczenie |
|---|---|
| Ikona radia | Online i zatrzymane |
| Tęczowa ikona radia | Online i odtwarzanie |
| Ikona Wi-Fi-off | AtlasCube niedostępny/offline |

### Instalacja ręczna

Pobierz `atlascube-radio-card.js` z tego repozytorium i dodaj go jako zasób JavaScript Lovelace.

---

## Screenshots

### Card in Home Assistant

![AtlasCube Radio Card in Home Assistant](./Screenshot_20261003_183147_Home%20Assistant.jpg)

### Card configuration editor

![AtlasCube Radio Card configuration editor](./Screenshot_20261003_183250_Home%20Assistant.jpg)

### Additional card views

![AtlasCube Radio Card view](./Screenshot_20261003_183309_Home%20Assistant.jpg)

![AtlasCube Radio Card configuration and preview](./Screenshot_20261003_183337_Home%20Assistant.jpg)

## Development status

**v0.3 TEST**

This version is intentionally still marked as a test release.

The current public test focuses on:

- AtlasCube auto-discovery
- native MQTT-derived availability
- automatic web interface discovery
- online/offline card behavior
- stable radio controls
- optional track artwork mode
- dynamic artwork background and metadata
- preserving the original minimalist mode when artwork is disabled

Brightness, LED ring, SD card and URL playback controls are intentionally not exposed by default.

## HACS publication checklist

- [x] Public GitHub repository
- [x] `hacs.json`
- [x] Dashboard/plugin repository structure
- [x] License
- [x] README documentation
- [x] HACS validation workflow
- [x] Real screenshots in README
- [ ] GitHub repository description
- [ ] GitHub repository topics
- [ ] Verify GitHub Issues are enabled
- [x] Create the first GitHub Release
- [x] Run and pass HACS validation
- [x] Submit repository to the HACS default `plugin` list

For publication in the default HACS repository list, the repository must pass HACS validation and have the required repository metadata. Plugin repositories also need images in the README.

## License

MIT License — see [LICENSE](LICENSE).

## Repository

`MarLip1981/atlascube-radio-card`
