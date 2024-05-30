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
  if (required && !value) throw Error(`${name} is required`)

  // @ts-ignore
  return value
}
