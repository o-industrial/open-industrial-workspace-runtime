import { useEffect, useState } from 'preact/hooks';

export const IsIsland = true;

type WindowMessageStatus = 'pending' | 'sent' | 'failed';

export default function AzureConnectedPage() {
  const [status, setStatus] = useState<WindowMessageStatus>('pending');

  useEffect(() => {
    const notifyOpener = () => {
      try {
        const message = { type: 'azure-auth-success' } as const;

        if (globalThis.opener && !globalThis.opener.closed) {
          globalThis.opener.postMessage(message, location.origin);
          setStatus('sent');

          // Give the opener a moment to process, then close.
          setTimeout(() => {
            try {
              self.close();
            } catch (_) {
              // ignore if close is blocked
            }
          }, 300);
        } else {
          setStatus('failed');
        }
      } catch (err) {
        console.error('Failed to notify opener about Azure sign-in completion', err);
        setStatus('failed');
      }
    };

    notifyOpener();
  }, []);

  const headline = status === 'sent' ? 'Azure sign-in complete' : 'Azure sign-in ready';

  const details = status === 'sent'
    ? 'You can close this window. Your workspace should update momentarily.'
    : 'Please return to the workspace tab to continue. If this window did not open automatically, close it now.';

  return (
    <main class='min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6'>
      <div class='max-w-md text-center space-y-3'>
        <h1 class='text-2xl font-semibold'>{headline}</h1>
        <p class='text-sm text-slate-300'>{details}</p>
        {status !== 'sent' && (
          <button
            type='button'
            class='inline-flex items-center justify-center rounded-full border border-slate-600 bg-slate-800 px-4 py-2 text-sm font-medium hover:border-slate-500 hover:bg-slate-700'
            onClick={() => {
              try {
                self.close();
              } catch (_) {
                // ignore if close is blocked
              }
            }}
          >
            Close window
          </button>
        )}
      </div>
    </main>
  );
}
