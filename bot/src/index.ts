import {
  Client,
  MessageTypes,
  LocalAuth,
  NoAuth,
  type Chat,
} from "whatsapp-web.js"
import OpenAI from "openai"
import { imageSync } from "qr-image"
import { createTransport } from "nodemailer"
// @ts-ignore
import svgToDataUrl from "svg-to-dataurl"
import { config } from "./config"

const mailer = createTransport({
  host: config.smtpHost,
  port: parseInt(config.smtpPort),
  secure: false,
  auth: {
    user: config.sourceMail,
    pass: config.sourceMailPassword,
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
  dnsTimeout: 10000,
})

console.log("Verifying mailer...")
await mailer.verify()
console.log("Done!")

const openai = new OpenAI({
  apiKey: config.openAIApiKey,
})

const client = new Client({
  authStrategy: config.dev
    ? new LocalAuth({
        dataPath: config.dataPath,
        clientId: config.clientId,
      })
    : new NoAuth(),
  puppeteer: config.dev
    ? {}
    : {
        args: ["--no-sandbox"],
        headless: true,
        executablePath: "chromium",
      },
})

let targetChat: Chat

// When the client is ready, run this code (only once)
client.once("ready", async () => {
  targetChat = await client.getChatById(config.targetChatId)
  console.log("Target chat is set.")
  console.log("Ready for action 🚀")
})

// When the client received QR-Code
let qrRetries = 0
client.on("qr", async (qr) => {
  if (qrRetries >= config.qrRetries) {
    console.error(`QR retries exceeded (${config.qrRetries}). Exiting...`)
    process.exit(1)
  }

  qrRetries++

  console.log(
    `QR received (${qrRetries}/${config.qrRetries}) 💡 Sending via mail...`
  )

  const svgCode = imageSync(qr, { type: "svg" })
  const path = svgToDataUrl(svgCode.toString("utf-8"))
  const html = `
    <head>
      <style>
        body {
          display: grid;
          place-content: center;
        }

        img {
          background-color: #ffffff;
          width: 50rem;
          padding: 1rem;
        }
      </style>
    </head>
    <body>
      <img src="${path}" />
    </body>
  `

  for (let i = 0; i < config.mailRetries; i++) {
    try {
      await mailer.sendMail({
        from: config.sourceMail,
        to: config.targetEmail,
        subject: "WhatsApp STT - QR Code 🔑",
        html,
      })

      console.log("QR sent via mail 📧")

      break
    } catch (e) {
      console.error(e)

      if (i + 1 === config.mailRetries) {
        console.error(
          `Mail retries exceeded (${config.mailRetries}). Exiting...`
        )
        process.exit(1)
      }

      console.log(`Retrying mail (${i + 1}/${config.mailRetries})...`)
    }
  }

  try {
    const qrCode = await import("qrcode-terminal")
    qrCode.generate(qr, { small: true })
  } catch {}
})

// TODO: "message" for only received messages
client.on("message_create", async (msg) => {
  // client.on("message", async (msg) => {
  try {
    if (msg.broadcast) return
    if (msg.type !== MessageTypes.VOICE) return

    console.log("Message received 📩 Processing...")

    const medium = await msg.downloadMedia()
    const data = Buffer.from(medium.data, "base64")
    const filename = msg.id._serialized + ".ogg"
    const file = new File([data], filename, {
      type: medium.mimetype,
    })

    const contactPromise = msg.getContact().catch((e) => {
      console.error(e)
      return null
    })

    const response = await openai.audio.transcriptions.create({
      file,
      model: "whisper-1",
      language: "de",
    })

    const contact = await contactPromise
    const from = contact
      ? `${contact.name || contact.shortName || contact.pushname || "???"} ` +
        `(${contact.number})`
      : "???"

    // msg.timestamp is not useful...

    const messageToBeSent =
      `_${from}_` +
      `\n` +
      `${new Date().toISOString()}` +
      `\n\n` +
      `${response.text}`

    await targetChat.sendMessage(messageToBeSent)

    console.log("Message sent 🎉")
  } catch (e) {
    console.error(e)
  }
})

// Start your client
client.initialize()
