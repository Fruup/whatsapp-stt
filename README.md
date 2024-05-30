# WhatsApp STT (Speech-To-Text)

This WhatsApp bot listens for incoming voice messages on your account.
It creates a transcript of the memo using OpenAI Whisper and sends it to the specified chat (using ENV vars).

## Building

```sh
docker build -f .docker/bot/Dockerfile --platform linux/amd64 -t fruup/whatsapp-stt .
docker push fruup/whatsapp-stt
```

## TODOs

- [ ] Documentation
