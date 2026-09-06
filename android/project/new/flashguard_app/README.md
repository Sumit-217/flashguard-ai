# FlashGuard (Flutter)

Real-time flash flood / landslide / cloudburst risk monitor for the
Uttarakhand corridor, backed by the `flashguard-ai`
(`feature/demo-backend-risk`) FastAPI service.

This package contains the complete `lib/` source and `test/` suite. The
Android/iOS platform scaffolding (gradle files, `MainActivity`, launcher
icons, etc.) isn't included since it's machine-generated boilerplate —
generate it once, locally, then drop these files in.

## 1. One-time setup

```bash
# Inside this flashguard_app/ folder:
flutter create --platforms=android --org com.flashguard .
```

This generates the standard `android/` (and `.gitignore`, etc.) files
without touching the `lib/`, `test/`, `pubspec.yaml`, or the
`android/app/src/main/AndroidManifest.xml` already provided here — if it
asks to overwrite `AndroidManifest.xml`, keep the one from this package
(it already has the INTERNET + location permissions the app needs).

```bash
flutter pub get
```

## 2. Point the app at your backend

Edit `lib/core/constants/app_constants.dart` → `ApiConfig.baseUrl`, or pass
it at build/run time without editing code:

```bash
# Android emulator, backend running on your dev machine:
flutter run --dart-define=FLASHGUARD_API_BASE_URL=http://10.0.2.2:8000

# Physical device on the same network:
flutter run --dart-define=FLASHGUARD_API_BASE_URL=http://192.168.1.23:8000

# Deployed backend (e.g. Render):
flutter run --dart-define=FLASHGUARD_API_BASE_URL=https://flashguard-backend.onrender.com
```

Run the backend locally with (from the `flashguard-ai` repo root):

```bash
pip install -r requirements.txt
uvicorn backend.app.main:app --reload --port 8000
```

## 3. Run

```bash
flutter run
```

On first launch, grant the location permission prompt — this is what
powers the "nearest station" panel on the dashboard and the distance
ranking on the Safe Route tab.

## Profile / SOS / live location sharing

A fifth "PROFILE" tab stores the user's name, phone, Aadhaar number, and an
emergency contact — encrypted on-device via `flutter_secure_storage`
(`lib/services/profile_storage_service.dart`), not plain SharedPreferences,
since it includes a government ID number.

Two things send that profile to an admin/rescue backend, both **off by
default**:

- **ASK FOR HELP** button — one-off SOS: sends the profile + current GPS
  fix to `AdminApiConfig.sosAlert`, with a confirmation dialog first.
- **Share live location** toggle — while switched on, pings
  `AdminApiConfig.locationPing` with the profile + GPS fix every 5 seconds
  (`AdminApiConfig.locationPingInterval`) for as long as the app stays
  open. Turning it off stops the timer immediately.

**Before this works you need to set the admin server URL** — it's blank by
default so nothing is sent anywhere until you configure it:

```bash
flutter run --dart-define=FLASHGUARD_ADMIN_BASE_URL=https://your-admin-server.example.com
```

Edit `lib/core/constants/app_constants.dart` → `AdminApiConfig` if you'd
rather hardcode it, and adjust the expected request bodies/paths there and
in `lib/services/api_service.dart` (`sendLocationPing` / `sendHelpRequest`)
to match your actual endpoint's contract.

**Scope note:** the 5-second ping only runs in the foreground (app open).
True background tracking (continuing after the user backgrounds or closes
the app) needs an Android foreground service + the
`ACCESS_BACKGROUND_LOCATION` permission, plus a Play Store policy
declaration justifying background location use — that's a separate,
bigger change and isn't included here.

**Handling Aadhaar data:** treat this like any other sensitive PII/gov-ID
field in production — get explicit user consent before collecting it,
encrypt it in transit (HTTPS) and at rest on your backend, and check
current Indian data-protection/Aadhaar-usage rules for what your specific
service is allowed to store and for how long.

## What talks to what

| Screen | Backend endpoint(s) |
|---|---|
| Dashboard | `GET /api/v1/risk/uttarakhand` (falls back to `/api/v1/demo/risk/uttarakhand`, then on-device cache) |
| Alerts | Same snapshot as Dashboard — filtered client-side to HIGH/CRITICAL |
| Safe Route | GPS distance to the 4 reference towns in `docs/demo/api-contract.md`, cross-checked against live district data |
| Offline | Connectivity + cache state; manual "retry sync" |

`POST /api/v1/demo/risk-assessment` (the Joshimath scenario contract) is
wired up in `ApiService.assessScenario` and ready to use if you want to
add a manual "what-if" scenario screen later — it isn't hooked into a
screen yet since the dashboard is driven by live telemetry instead.

## Notes on data honesty

- The status chip on the dashboard always tells you whether you're
  looking at `LIVE`, backend `DEMO DATA`, or an on-device
  `LAST SYNCED (OFFLINE)` snapshot — never silently blended.
- The Safe Route screen anchors on 4 fixed reference towns because the
  backend doesn't expose a shelter/evacuation-point API yet (see
  `backend/README.md`'s "Target / Planned Architecture"). This is called
  out on-screen rather than invented.
