import { PageProps } from '@fathym/eac-applications/preact';

export default function DashboardLayout({
  Data: _Data,
  Component,
  Revision,
}: PageProps) {
  return (
    <html class='h-full'>
      <head>
        <meta charset='utf-8' />
        <meta name='viewport' content='width=device-width, initial-scale=1.0' />

        <title>Fathym EaC Runtime</title>

        <link
          rel='shortcut icon'
          type='image/png'
          href='/assets/favicon.ico'
          data-eac-bypass-base
        />

        <link
          rel='stylesheet'
          href={`/tailwind/styles.css?Revision=${Revision}`}
          data-eac-bypass-base
        />

        <link
          rel='stylesheet'
          href='https://unpkg.com/reactflow@11.11.4/dist/style.css'
          data-eac-bypass-base
        />
      </head>

      <body class='h-full bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-50'>
        <div class='relative w-screen h-screen max-w-full flex flex-col overflow-hidden'>
          <Component />
        </div>
      </body>
    </html>
  );
}
