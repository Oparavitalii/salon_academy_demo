'use client';

/**
 * A submit button that asks first (owner 31.10.2026: blocking a student is a one-click action and
 * sat as the loudest button in her card). Without JS the form still submits as before.
 */
export function ConfirmButton({
  message,
  className,
  children,
}: {
  message: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type='submit'
      className={className}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
