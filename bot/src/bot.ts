import OpenAI from "openai"
import WhatsAppWeb from "whatsapp-web.js"

const { LocalAuth, MessageTypes, Client: WhatsAppWebClient } = WhatsAppWeb

export class WhatsAppSTTBot {
  #client: InstanceType<typeof WhatsAppWebClient>
  #openai: OpenAI
  #status: "disconnected" | "connecting" | "connected" = "disconnected"

  constructor(
    public readonly options: {
      clientId: string
      onQrCode: (qr: string) => any
      /**
       * Called before processing each message.
       * THe config is to be fetched from the database.
       */
      getConfig: () => Promise<{
        model: "Systran/faster-whisper-medium"
        targetChatId: string
        allowAudioMessages: boolean
      }>
    }
  ) {
    this.#openai = new OpenAI({
      // baseURL: "http://speaches:8000/v1",
      baseURL: "http://localhost:8000/v1",
      apiKey: "-",
    })

    this.#client = new WhatsAppWebClient({
      // TODO: RemoteAuth
      authStrategy: new LocalAuth({
        dataPath: ".auth",
        clientId: this.options.clientId,
      }),
      puppeteer: {
        // args: ["--no-sandbox"],
        // headless: true,
        // executablePath: "chromium",
      },
      qrMaxRetries: 5,
      // TODO: pairWithPhoneNumber
    })
  }

  get status() {
    return this.#status
  }

  async getChats() {
    return await this.#client.getChats()
  }

  async createTranscriptionChat() {
    const name = "Transcription Chat 📝"

    const chats = await this.getChats()
    const foundChat = chats.find((chat) => chat.name === name)
    if (foundChat) return foundChat.id._serialized

    const result = await this.#client.createGroup(name)

    if (typeof result === "string") return result
    return result.gid._serialized
  }

  async initializeAndAuthenticate() {
    const client = this.#client

    const { promise, resolve } = Promise.withResolvers()

    // When the client is ready, run this code (only once)
    client.once("ready", async () => {
      // this.#targetChat = await client.getChatById(config.targetChatId)
      // console.log("Target chat is set.")

      console.log("Ready for action 🚀")

      this.#status = "connected"

      resolve()
    })

    // When the client received QR-Code
    client.on("qr", async (qr) => {
      this.#status = "connecting"
      this.options.onQrCode(qr)
    })

    // TODO: "message" for only received messages
    // client.on("message", async (msg) => {
    client.on("message_create", async (msg) => {
      try {
        if (msg.broadcast) return

        const { targetChatId, allowAudioMessages, model } =
          await this.options.getConfig()

        if (
          !(
            msg.type === MessageTypes.VOICE ||
            (allowAudioMessages && msg.type === MessageTypes.AUDIO)
          )
        )
          return

        console.log("Message received 📩 Processing...")

        const medium = await msg.downloadMedia()
        const data = Buffer.from(medium.data, "base64")
        const filename = msg.id._serialized + ".ogg"
        const file = new File([data], filename, {
          type: medium.mimetype,
        })

        const [contact, response, targetChat] = await Promise.all([
          msg.getContact().catch((e) => {
            console.error(e)
            return null
          }),
          this.#openai.audio.transcriptions.create({
            file,
            model,
            language: "de",
          }),
          this.#client.getChatById(targetChatId),
        ])

        const from = contact
          ? `${
              contact.name || contact.shortName || contact.pushname || "???"
            } ` + `(${contact.number})`
          : "???"

        // msg.timestamp is not useful...

        const messageToBeSent =
          `_${from}_` +
          `\n` +
          `${new Date().toISOString()}` +
          `\n\n` +
          `${response.text}`

        await targetChat.sendMessage(messageToBeSent, {
          // HACK: https://github.com/pedroslopez/whatsapp-web.js/issues/5718#issuecomment-3750233653
          sendSeen: false,
        })

        console.log("Message sent 🎉")
      } catch (e) {
        console.error(e)
      }
    })

    // Start your client
    await client.initialize()

    // Wait for ready event
    return promise
  }
}
