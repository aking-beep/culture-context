# App-store plan

`apps/mobile` is the canonical store application. It is a native Expo / React Native project, not a webview wrapper.

## Before beta distribution

- Replace temporary app icon / splash assets with final brand assets.
- Confirm iOS bundle identifier and Android package name.
- Create Apple Developer and Google Play Console app records.
- Publish privacy policy, terms, support URL, and data-deletion flow.
- Add authentication only when saved trips require it.
- Add crash/analytics tooling with a documented privacy policy.
- Add offline cache for the latest verified trip brief.
- Add push notification consent and change-alert preferences.
- Run device tests for links, network failure, font scaling, dark mode, and offline state.

## Expo release path

```bash
npx eas-cli login
cd apps/mobile
npx eas-cli build --platform ios --profile production
npx eas-cli build --platform android --profile production
npx eas-cli submit --platform ios --profile production
npx eas-cli submit --platform android --profile production
```

Store submission is a release event and requires human approval under `factory/GOVERNANCE.md`.
