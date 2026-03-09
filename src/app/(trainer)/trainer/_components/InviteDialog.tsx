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
        className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
      >
        + Invite trainee
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Invite a trainee</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
                aria-label="Close"
              >
                &times;
              </button>
            </div>

            <p className="text-sm text-gray-500">
              Share this link with your trainee. They&apos;ll be connected to your roster after
              signing up or logging in.
            </p>

            {isPending && (
              <div className="text-sm text-gray-400 animate-pulse">Generating link&hellip;</div>
            )}

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            {link && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                  <span className="text-sm text-gray-700 truncate flex-1 font-mono">{link}</span>
                </div>
                <button
                  onClick={handleCopy}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-lg transition-colors"
                >
                  {copied ? 'Copied!' : 'Copy link'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
