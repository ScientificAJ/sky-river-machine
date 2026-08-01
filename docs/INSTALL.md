# Installable browser packages

Build both local packages with:

```bash
npm install
npm run package:all
```

## Chromium family

Artifact: `dist/sky-river-machine-chromium.zip`.

Chrome, Edge, Brave, Vivaldi, and other Chromium browsers use the same package. For local testing, extract it and choose **Load unpacked** in the browser's extension developer page. The ZIP is also the upload artifact for a browser web store or private enterprise deployment.

## Firefox

Artifact: `dist/sky-river-machine-firefox.xpi`.

Open `about:debugging#/runtime/this-firefox`, choose **Load Temporary Add-on**, and select the XPI. A permanent Firefox install requires Mozilla signing; an unsigned local XPI is temporary by design.

## Browser coverage

The repository currently packages Chromium-family and Firefox WebExtensions. Safari is not packaged or supported by the current adapter/build gate.

The generated artifacts are under `dist/`, which is intentionally git-ignored. Rebuild them with `npm run package:all` from the checked-out commit.
