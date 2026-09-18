# Culture Context mobile

Expo / React Native store client. The workspace keeps this package free of Expo runtime dependencies so it can live beside Next 19.

To run on a device or simulator:

```bash
cd apps/mobile
npx expo install expo react react-native expo-status-bar
npx expo start
```

`src/api.ts` uses `@culture-context/sdk` against `POST /v1/brief`. Do not scrape sources from the client.
