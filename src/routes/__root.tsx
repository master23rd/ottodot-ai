import type { ReactNode } from 'react'
import { MantineProvider } from '@mantine/core'
import { createRootRoute, HeadContent, Outlet, Scripts } from '@tanstack/react-router'
import '@mantine/core/styles.css'
import '../styles.css'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'OttoDot — Kelas sains dan matematika' },
    ],
  }),
  component: Root,
})

function Root() {
  return (
    <Document>
      <MantineProvider defaultColorScheme="light">
        <Outlet />
      </MantineProvider>
    </Document>
  )
}

function Document({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
