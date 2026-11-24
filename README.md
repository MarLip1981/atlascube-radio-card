# AtlasCube Radio Card — 0.5.9

Jedno wydanie karty Lovelace i integracji Home Assistant. Wersja 0.5.9 bazuje na przetestowanej wersji testowej: lokalne logo stacji oraz dwa niezależne rozmiary okładek — 120×120 px dla Jarvisa i 1200×1200 px dla dashboardu.

## Funkcje
- Automatyczne wykrywanie urządzenia AtlasCube i jego encji.
- Sterowanie radiem: poprzedni utwór, play/stop, następny utwór, źródło i głośność.
- Natywny stan online/offline na podstawie encji AtlasCube i dostępności MQTT.
- Automatyczne otwieranie panelu WWW urządzenia.
- Lokalna biblioteka logo stacji, automatyczne wyszukiwanie, cache i ręczny wybór.
- Automatyczne pobieranie okładek przez integrację Home Assistant.
- Oddzielna lekka okładka 120×120 px dla ESPHome/Jarvisa oraz duża kopia 1200×1200 px dla karty Lovelace.
- Integracja sama rejestruje zasób karty — bez ręcznego dodawania JavaScript do zasobów Lovelace.

## Instalacja przez HACS
1. Otwórz HACS → **⋮ → Repozytoria niestandardowe**.
2. Dodaj `MarLip1981/atlascube-radio-card` jako kategorię **Integration**.
3. Pobierz repozytorium i uruchom ponownie Home Assistant.
4. W Ustawienia → Urządzenia i usługi dodaj integrację **AtlasCube Local Logos**.
5. Otwórz edytor dashboardu i wybierz kartę **AtlasCube Radio Card**.

Jeżeli to repozytorium jest już dodane w HACS jako **Dashboard**, usuń tamten wpis przed dodaniem go jako **Integration**. Nie instaluj równolegle obu wariantów. Po dodaniu integracji nie dodawaj ręcznie zasobu Lovelace — integracja rejestruje go automatycznie.

## Okładki — Jarvis i dashboard
Integracja śledzi encję `sensor.atlascube_radio_tytul_utworu`, wyszukuje okładkę i zapisuje dwie niezależne kopie:
- Stan sensora `sensor.atlascube_radio_cover_url` wskazuje na lekką okładkę **120×120 px** przeznaczoną dla ESP32-CYD/Jarvisa.
- Atrybut `artwork_large` tego samego sensora wskazuje na dużą okładkę **1200×1200 px** wykorzystywaną przez kartę dashboardu.

Karta nie wykonuje drugiego wyszukiwania w przeglądarce. Obie kopie są obsługiwane przez integrację i mają oddzielne katalogi cache.

## Logo stacji
Integracja przechowuje lokalne logo w `/config/www/atlascube-radio-station-logos/` i udostępnia je pod `/local/atlascube-radio-station-logos/`. Karta najpierw korzysta z lokalnej kopii, a w razie jej braku uruchamia sprawdzony algorytm wyszukiwania i zapisuje wynik. Dostępny jest również ręczny wybór, odświeżenie oraz przywrócenie automatycznego wyboru.

## Konfiguracja YAML
```yaml
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
show_artwork: true
show_station_logo: true
show_source: true
show_volume: true
```

Pola encji można również uzupełnić automatycznym wykrywaniem AtlasCube w edytorze karty.

## English
Version 0.5.9 combines the Lovelace card and the Home Assistant integration. It is based on the tested build and provides local station-logo management plus two separate artwork files: a lightweight **120×120 px** image exposed as the state of `sensor.atlascube_radio_cover_url` for ESPHome/Jarvis, and a **1200×1200 px** image exposed through the same sensor's `artwork_large` attribute for the dashboard.

Install the repository through HACS as an **Integration**, restart Home Assistant, then add **AtlasCube Local Logos** under Settings → Devices & services. The integration automatically registers the Lovelace card resource. Do not add a second manual JavaScript resource.

## Wydanie 0.5.9
To wydanie przenosi sprawdzoną implementację z repozytorium testowego do oficjalnej domeny integracji `atlascube_local_logos`, z produkcyjnymi nazwami encji, zasobów i katalogów. Repozytorium testowe pozostaje niezależne.
