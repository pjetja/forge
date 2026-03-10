'use client';
import { useState, useTransition } from 'react';
import { generateInviteLink } from '../actions';

export function InviteDialog() {
  const [open, setOpen] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleOpen() {
    setOpen(true);
    setLink(null);
    setError(null);
    setCopied(false);

    startTransition(async () => {
      const result = await generateInviteLink();
      if ('error' in result) {
        setError(result.error);
      } else {
        // Build full URL from relative path
        const fullUrl = `${window.location.origin}${result.url}`;
        setLink(fullUrl);
      }
    });
  }

  async function handleCopy() {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="bg-accent hover:bg-accent-hover text-white rounded-sm px-4 py-2 text-sm font-medium transition-colors cursor-pointer"
      >
        + Invite trainee
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-bg-surface border border-border rounded-sm w-full max-w-md p-6 flex flex-col min-h-[240px]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-text-primary">Invite a trainee</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-text-primary hover:text-accent transition-colors text-xl leading-none cursor-pointer"
                aria-label="Close"
              >
                &times;
              </button>
            </div>

            <p className="text-sm text-text-primary mb-4">
              Share this link with your trainee. They&apos;ll be connected to your roster after
              signing up or logging in.
            </p>

            <div className="flex-1 flex flex-col justify-center space-y-3">
              {isPending && (
                <div className="text-sm text-text-primary animate-pulse">Generating link&hellip;</div>
              )}

              {error && (
                <p className="text-sm text-white bg-error/10 border border-error/30 rounded-sm px-3 py-2">{error}</p>
              )}

              {link && (
                <>
                  <div className="bg-bg-page border border-border rounded-sm px-3 py-2 text-sm text-text-primary font-mono break-all">
                    {link}
                  </div>
                  <button
                    onClick={handleCopy}
                    className="w-full bg-accent hover:bg-accent-hover text-white text-sm font-medium py-2 rounded-sm transition-colors cursor-pointer"
                  >
                    {copied ? 'Copied!' : 'Copy link'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
