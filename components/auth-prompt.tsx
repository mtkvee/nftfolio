interface AuthPromptProps {
  onSignIn: () => void;
  isSigningIn?: boolean;
  title?: string;
  message?: string;
}

export function AuthPrompt({
  onSignIn,
  isSigningIn = false,
  title = "Sign in to manage your NFT portfolio.",
  message = "Your NFT trades are stored per account. Sign in with Google to view, add, and manage your personal records."
}: AuthPromptProps) {
  return (
    <section className="surface-card flex min-h-[280px] flex-col items-center justify-center rounded-lg px-6 py-12 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-xl font-semibold text-gray-900">
        G
      </div>
      <h2 className="text-2xl font-semibold text-gray-900">{title}</h2>
      <p className="mt-3 max-w-md text-sm leading-6 text-gray-500">{message}</p>
      <button
        type="button"
        onClick={onSignIn}
        disabled={isSigningIn}
        className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSigningIn ? (
          <span
            aria-hidden="true"
            className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white"
          />
        ) : null}
        <span>{isSigningIn ? "Signing in..." : "Sign in with Google"}</span>
      </button>
    </section>
  );
}
