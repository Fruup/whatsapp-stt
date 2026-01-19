import OpenAI from "openai"
import WhatsAppWeb, { type Chat, type GroupChat } from "whatsapp-web.js"

const {
  RemoteAuth,
  LocalAuth,
  MessageTypes,
  Client: WhatsAppWebClient,
} = WhatsAppWeb

export class WhatsAppSTTBot {
  #client: InstanceType<typeof WhatsAppWebClient>
  #openai: OpenAI
  #status: "disconnected" | "connecting" | "connected" = "disconnected"

  // TODO: Target chat caching

  constructor(
    public readonly options: {
      clientId: string
      transcriptionApiBaseUrl: string
      onParingCode: (
        param:
          | { qrCode: string; paringCode?: never }
          | { paringCode: string; qrCode?: never },
      ) => any
      /**
       * Called before processing each message.
       * The config is to be fetched from the database.
       */
      getConfig: () => Promise<{
        active: boolean
        model: "Systran/faster-whisper-medium"
        targetChatId: string
        allowAudioMessages: boolean
      }>
      onDisconnected: () => any
      // TODO: auth: ConstructorParameters<typeof RemoteAuth>[0]
    },
  ) {
    this.#openai = new OpenAI({
      baseURL: this.options.transcriptionApiBaseUrl,
      apiKey: "-",
    })

    this.#client = new WhatsAppWebClient({
      // TODO: new RemoteAuth(this.options.auth)
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

    this.#client.on("disconnected", () => {
      this.#status = "disconnected"
      this.options.onDisconnected()
    })
  }

  get status() {
    return this.#status
  }

  async getChats() {
    return await this.#client.getChats()
  }

  async createTranscriptionChat() {
    const name = "📝 Memo Transcriptions"

    const chats = await this.getChats()
    const foundChat = chats.find(
      (chat) =>
        isGroupChat(chat) && chat.participants.length > 0 && chat.name === name,
    )
    if (foundChat) return foundChat.id._serialized

    const result = await this.#client.createGroup(name)

    const groupChatId =
      typeof result === "string" ? result : result.gid._serialized

    // Send welcome message
    await this.#client.sendMessage(
      groupChatId,
      `Hi! 🦆 Hier wirst du die Transkriptionen deiner Voice Memos sehen.\n` +
        `⚙️ Verlier den Link für deine Einstellungen nicht:\n\n` +
        `https://example.com/s/${this.options.clientId}`,
      // TODO: real link
      {
        // HACK: see below
        sendSeen: false,
      },
    )

    return groupChatId
  }

  async initializeAndAuthenticate() {
    const client = this.#client

    const { promise, resolve } = Promise.withResolvers()

    // await client.requestPairingCode(phoneNumber)

    // When the client is ready, run this code (only once)
    client.once("ready", async () => {
      // this.#targetChat = await client.getChatById(config.targetChatId)
      // console.log("Target chat is set.")

      console.log("Bot ready 🚀")

      this.#status = "connected"

      // TODO: Send hello message

      resolve()
    })

    // When the client received QR-Code
    client.on("qr", async (qrCode) => {
      this.#status = "connecting"
      this.options.onParingCode({ qrCode })
    })

    // TODO: "message" for only received messages
    // client.on("message", async (msg) => {
    client.on("message_create", async (msg) => {
      try {
        if (msg.broadcast) return

        const { active, targetChatId, allowAudioMessages, model } =
          await this.options.getConfig()

        if (!active) return

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

        const messageToBeSent =
          `*${from}* am _${new Intl.DateTimeFormat("de-DE", {
            dateStyle: "medium",
            timeStyle: "medium",
          }).format(1000 * msg.timestamp || new Date())}_:` +
          `\n\n` +
          `${response.text || "_(Stille)_"}`

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

const isGroupChat = (chat: Chat): chat is GroupChat => chat.isGroup === true
