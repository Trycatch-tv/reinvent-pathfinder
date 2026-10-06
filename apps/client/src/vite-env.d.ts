interface ImportMetaEnv {
  readonly DEV: boolean
  readonly VITE_AWS_EVENT_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
