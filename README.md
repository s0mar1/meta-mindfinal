# MetaMind TFT Analyzer

A web-based platform to analyze Teamfight Tactics (TFT) meta and match data.

## Setup

See backend and frontend instructions below.

### Environment Variables

`backend` uses the following optional variables to control TFT asset loading:

- `TFT_PATCH_VERSION` – set to override the patch used when requesting
  Data&nbsp;Dragon data.
- `TFT_ASSET_SOURCE` – set to `cdragon` to load all icons from Community&nbsp;Dragon
  instead of Data&nbsp;Dragon.
