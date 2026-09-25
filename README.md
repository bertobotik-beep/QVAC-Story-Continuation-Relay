# QVAC Story-Continuation-Relay

Write a story together with an on-device AI, taking turns adding paragraphs.

## Run

```
npm install
npm start
```

Then open http://localhost:29530

## QVAC SDK

Built on `@qvac/sdk` ^0.19.0.

## How it works

All inference runs on-device via the QVAC SDK — the model is loaded once at startup with `loadModel`, each request streams a response through `completion`, and the model is released with `unloadModel` on shutdown. No text ever leaves this machine and no API key is required.

## License

MIT
