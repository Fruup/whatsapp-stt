export const config = {
  openAIApiKey: getEnv("OPENAI_API_KEY"),
  dataPath: getEnv("DATA_PATH", ".auth"),
  clientId: getEnv("CLIENT_ID", "client-1"),
  targetChatId: getEnv("TARGET_CHAT_ID"),
  targetEmail: getEnv("TARGET_MAIL"),
  sourceMail: getEnv("SOURCE_MAIL"),
  sourceMailPassword: getEnv("SOURCE_MAIL_PASSWORD"),
  smtpHost: getEnv("SOURCE_MAIL_HOST"),
  smtpPort: getEnv("SOURCE_MAIL_PORT", "465"),
  mailRetries: parseInt(getEnv("MAIL_RETRIES", "3")),
  qrRetries: parseInt(getEnv("QR_RETRIES", "10")),
  dev: getEnv("NODE_ENV") !== "production",
  port: parseInt(getEnv("PORT", "8080")),
}

let errors: string[] = []

if (errors.length) {
  console.error(errors.join("\n"))
  process.exit(1)
}

export function getEnv(name: string): string
export function getEnv(name: string, defaultValue: string): string
export function getEnv<Required extends boolean>(
  name: string,
  required: Required
): Required extends true ? string : string | undefined

export function getEnv(
  name: string,
  defaultOrRequired?: string | boolean
): string {
  const required =
    typeof defaultOrRequired === "boolean" ? defaultOrRequired : true

  const defaultValue =
    typeof defaultOrRequired === "string" ? defaultOrRequired : undefined

  const value = import.meta.env[name] || defaultValue
  if (required && !value) {
    errors.push(`${name} is required`)
  }

  // @ts-ignore
  return value
}
