# AtlasCube Radio Card v0.2

A compact, modern Home Assistant Lovelace card for AtlasCube radio entities.

## Features

- Compact centered Previous / Play-Stop / Next controls
- Dynamic radio status icon
- Rainbow LED-style radio animation while playing
- Station and current track information
- Source selector
- Volume slider
- Online/offline state
- Automatic AtlasCube device/entity discovery in the visual editor
- Automatic use of the AtlasCube device `configuration_url` for opening its web panel
- Native MQTT availability is used by default (no manual ping sensor required)
- Configurable entity IDs
- Optional source and volume sections

## Installation

### HACS

Add this repository as a custom repository in HACS:

- Repository: `MarLip1981/atlascube-radio-card`
- Type: **Dashboard**

Then install **AtlasCube Radio Card**.

After installation, add the resource if HACS does not do so automatically, then use the card in your dashboard.

### Manual

Download `atlascube-radio-card.js` and add it as a Lovelace JavaScript resource.

## Configuration

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
  # availability: opcjonalne — karta korzysta z natywnej dostępności MQTT, jeśli puste

show_source: true
show_volume: true
```

W wersji v0.2 kliknięcie nagłówka karty otwiera panel WWW radia na podstawie `configuration_url` zapisanej w rejestrze urządzenia Home Assistant. Nie trzeba wpisywać adresu IP ani tworzyć własnego `binary_sensor` do pingowania radia.

The `brightness`, LED ring, SD card and URL playback controls are intentionally not exposed by default.

## Status indicator

- Radio icon: online and stopped
- Music note: online and playing
- Wi-Fi-off icon: offline

## Development

This project starts from the tested AtlasCube dashboard design and is being converted into a standalone custom Lovelace card.

### v0.2

- AtlasCube is detected from the Home Assistant device registry (`manufacturer` / device identifiers).
- Entities are matched within the detected AtlasCube device instead of assuming a fixed device name such as `atlascube_9140`.
- The radio web address is read from the device registry `configuration_url`.
- The manual ping entity is no longer required.
