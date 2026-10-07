interface ImportMetaEnv {
  readonly DEV: boolean
  readonly VITE_AWS_EVENT_ID?: string
  readonly VITE_AUTH_REDIRECT_URI?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
