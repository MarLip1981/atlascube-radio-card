# AtlasCube Radio Card

![AtlasCube Radio Card — lokalna biblioteka logo](./images/banner.svg)

A compact, modern Home Assistant Lovelace card for AtlasCube radio devices.

> **Version 0.5.9 — local station logos and ESPHome cover bridge**
>
> This release combines the tested local station-logo workflow with the local track-artwork bridge for ESPHome displays. The standalone card and the bundled integration copy are kept in sync.

---

## 🇬🇧 English

### Features

- Automatic detection of the AtlasCube device and its entities
- No hard-coded AtlasCube device name required
- Compact Previous / Play-Stop / Next controls
- Large central Play/Stop button
- Optional album artwork with artist, title and album information
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
- Optional album artwork, source and volume sections
- Ordered station-logo search, local disk cache and manual selection
- Local cache for the selected track cover, exposed to ESPHome through a Home Assistant sensor

### Requirements

- Home Assistant
- AtlasCube radio integrated into Home Assistant
- AtlasCube entities available through the MQTT integration
- HACS is recommended for installation

The card discovers the AtlasCube device from the Home Assistant device/entity registries instead of depending on a fixed entity naming scheme.

### Installation with HACS

The Lovelace card is published in the default HACS catalog as a **Dashboard** repository:

1. Open HACS → **Dashboard**.
2. Search for **AtlasCube Radio Card**.
3. Open the repository and select **Download**.
4. Refresh the Home Assistant frontend.

Do not add this repository as a custom HACS **Integration**. HACS already lists this repository in the Dashboard category, and the same repository cannot be registered a second time under Integration.

### Companion integration — AtlasCube Local Logos

The `custom_components/atlascube_local_logos` folder contains the companion Home Assistant integration. It provides local station-logo search and the `sensor.atlascube_radio_cover_url` sensor used by ESPHome displays. It is separate from the HACS Dashboard card package:

1. Copy `custom_components/atlascube_local_logos` into your Home Assistant `config/custom_components/` directory.
2. Restart Home Assistant.
3. Open Settings → Devices & services → **Add integration** and add **AtlasCube Local Logos**.
4. Refresh the frontend.

The integration serves its bundled card JavaScript and registers the Lovelace resource automatically. Keep the integration and the standalone `atlascube-radio-card.js` file from the same release. If you already have the companion integration installed from a test build, update that folder to the matching release instead of installing a second copy.

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

### Local track artwork for ESPHome

When album artwork is enabled, the card forwards the already-selected cover to the integration. The integration stores the JPEG locally in `www/atlascube-radio-covers` and exposes its relative URL through `sensor.atlascube_radio_cover_url`. The cache keeps up to 100 covers. This does not perform a second iTunes search.

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

    show_artwork: true
    show_source: true
    show_volume: true

### Album artwork

Album artwork is optional and can be enabled or disabled in the card editor.

When enabled and the radio is playing, the card uses the current `Artist - Title` metadata to search the iTunes Search API, caches the result and displays a 200×200 cover with a subtle 18 px blurred background. When the radio is stopped, the artwork and track information are hidden while the blurred background is retained.

When artwork is disabled, the card returns to the compact radio presentation with the animated rainbow radio icon while playing.

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
- Opcjonalne okładki utworów z wykonawcą, tytułem i albumem
- Nazwa stacji i tytuł aktualnego utworu
- Wybór źródła
- Suwak głośności i wyciszenie
- Dynamiczny stan online/offline
- Tęczowa animacja radia podczas odtwarzania
- Ikona Wi-Fi-off, gdy AtlasCube jest niedostępny
- Automatyczne otwieranie panelu WWW AtlasCube na podstawie `configuration_url` urządzenia Home Assistant
- Wykorzystanie natywnej dostępności MQTT obsługiwanej przez Home Assistant
- Brak potrzeby tworzenia osobnego sensora ping
- Opcjonalny ręczny override dostępności
- Opcjonalne okładki, sekcje źródła i głośności
- Uporządkowane wyszukiwanie logo stacji, lokalny cache na dysku i ręczny wybór

### Wymagania

- Home Assistant
- Radio AtlasCube dodane do Home Assistant
- Encje AtlasCube dostępne przez integrację MQTT
- Zalecane HACS

Karta wykrywa urządzenie na podstawie rejestru urządzeń i encji Home Assistant. Nie zakłada jednej, sztywnej nazwy urządzenia ani adresu IP.

### Instalacja przez HACS

Karta Lovelace jest opublikowana w domyślnym katalogu HACS jako repozytorium typu **Dashboard**:

1. Otwórz HACS → **Dashboard**.
2. Wyszukaj **AtlasCube Radio Card**.
3. Otwórz repozytorium i wybierz **Pobierz**.
4. Odśwież frontend Home Assistant.

Nie dodawaj tego repozytorium jako niestandardowej integracji HACS (**Integration**). Repozytorium jest już obecne w katalogu HACS w kategorii Dashboard i HACS nie pozwala zarejestrować tego samego repozytorium drugi raz jako Integration.

### Integracja uzupełniająca — AtlasCube Local Logos

Folder `custom_components/atlascube_local_logos` zawiera dodatkową integrację Home Assistant. Zapewnia lokalne wyszukiwanie logo stacji oraz sensor `sensor.atlascube_radio_cover_url` wykorzystywany przez wyświetlacze ESPHome. Jest instalowana osobno od karty HACS:

1. Skopiuj folder `custom_components/atlascube_local_logos` do katalogu `config/custom_components/` w Home Assistant.
2. Uruchom ponownie Home Assistant.
3. Otwórz Ustawienia → Urządzenia i usługi → **Dodaj integrację** i dodaj **AtlasCube Local Logos**.
4. Odśwież frontend.

Integracja udostępnia dołączony plik JavaScript karty i automatycznie rejestruje zasób Lovelace. Integracja i samodzielny plik `atlascube-radio-card.js` muszą pochodzić z tego samego wydania. Jeśli masz już zainstalowaną integrację z wersji testowej, zaktualizuj jej folder do zgodnej wersji zamiast instalować drugą kopię.

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

### Okładki utworów

Okładki utworów można włączyć lub wyłączyć w edytorze karty.

Po włączeniu, podczas odtwarzania karta wyszukuje okładkę na podstawie metadanych `Artysta - Tytuł`, zapamiętuje wynik i pokazuje okładkę 200×200 px z delikatnie rozmytym tłem 18 px. Po zatrzymaniu radia okładka i informacje o utworze są ukrywane, ale rozmyte tło pozostaje.

Po wyłączeniu okładek karta wraca do kompaktowego widoku radia z tęczową animacją podczas odtwarzania.

### Wskaźniki stanu

| Wskaźnik | Znaczenie |
|---|---|
| Ikona radia | Online i zatrzymane |
| Tęczowa ikona radia | Online i odtwarzanie |
| Ikona Wi-Fi-off | AtlasCube niedostępny/offline |

### Instalacja ręczna

Ta metoda dotyczy wyłącznie starszej instalacji karty jako repozytorium Dashboard. W instalacji przez integrację **AtlasCube Local Logos** nie dodawaj pliku JavaScript ręcznie — integracja rejestruje zasób automatycznie. Przed migracją usuń stary zasób Lovelace wskazujący na `atlascube-radio-card.js`, aby nie ładować dwóch kopii karty.

---

## Screenshots

### Current card appearance — 26 October 2026

![AtlasCube Radio Card — current appearance, 26 October 2026](./Screenshot_20261026_065604_Home%20Assistant.jpg)

### Earlier card and configuration views

![AtlasCube Radio Card in Home Assistant](./Screenshot_20261003_183147_Home%20Assistant.jpg)

![AtlasCube Radio Card configuration editor](./Screenshot_20261003_183250_Home%20Assistant.jpg)

![AtlasCube Radio Card view](./Screenshot_20261003_183309_Home%20Assistant.jpg)

![AtlasCube Radio Card configuration and preview](./Screenshot_20261003_183337_Home%20Assistant.jpg)

## Release 0.5.9

Version 0.5.9 is prepared on the `main` branch and awaits publication as a GitHub Release after the automated checks pass. It retains the established radio controls and includes the tested local station-logo workflow and the local track-artwork bridge for ESPHome displays.

- Automatic AtlasCube device and entity discovery
- Album artwork with local cache
- Local station-logo search, selection and fallback handling
- Native MQTT-derived online/offline state
- Automatic AtlasCube web-interface discovery
- `sensor.atlascube_radio_cover_url` for ESPHome cover display
- Standalone card JavaScript and integration-bundled JavaScript kept in sync

Brightness, LED ring, SD card and URL playback controls remain intentionally outside the default card.

## HACS publication

- The Lovelace card is listed in the HACS default catalog as a **Dashboard** repository (accepted in PR #11557).
- The companion `AtlasCube Local Logos` integration is included in this repository under `custom_components/atlascube_local_logos` and is installed separately.
- The repository must not be added to HACS a second time as an Integration repository.
- The `main` branch contains the prepared v0.5.9 release. Publish GitHub Release with tag `V0.5.9` from the validated `main` commit to make the update available through HACS.
- The `test-radio-cover` branch remains separate for ongoing test work and is not part of v0.5.9.

The banner is embedded in this README. The SVG icon is a repository asset and is not claimed to be a native HACS icon field.

## License

MIT License — see [LICENSE](LICENSE).

## Repository

`MarLip1981/atlascube-radio-card`
