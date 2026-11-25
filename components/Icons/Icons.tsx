/**
 * Line icons for the booking channels and the footer (24 × 24, currentColor, decorative —
 * the link around each carries the name). Drawn for this site; no icon font, no brand files.
 */
type IconName =
  | 'booksy'
  | 'instagram'
  | 'phone'
  | 'whatsapp'
  | 'telegram'
  | 'sms'
  | 'pin'
  | 'clock'
  | 'mail'
  | 'check'
  | 'arrow';

const PATHS: Record<IconName, React.ReactNode> = {
  booksy: (
    <>
      <rect x='3.5' y='4.5' width='17' height='16' rx='3' />
      <path d='M3.5 9.5h17M8 3v3M16 3v3' />
      <path d='M9 14.5l2 2 4-4' />
    </>
  ),
  instagram: (
    <>
      <rect x='3' y='3' width='18' height='18' rx='5' />
      <circle cx='12' cy='12' r='4' />
      <circle cx='17.5' cy='6.5' r='0.9' fill='currentColor' stroke='none' />
    </>
  ),
  phone: (
    <path d='M6.6 3.5h2.6l1.4 4.1-1.9 1.3a11 11 0 0 0 6.4 6.4l1.3-1.9 4.1 1.4v2.6a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.6 5.7a2 2 0 0 1 2-2.2z' />
  ),
  whatsapp: (
    <>
      <path d='M4.2 19.8l1.1-3.9A8.5 8.5 0 1 1 8.4 19z' />
      <path d='M9.2 8.6c.3-.6.6-.6.9-.6h.6l1 2.2-.7.9a5 5 0 0 0 2.3 2.3l.9-.7 2.2 1v.6c0 .3 0 .6-.6.9-.7.4-1.8.5-3.5-.4a8.3 8.3 0 0 1-3.1-3.1c-.9-1.7-.8-2.8-.4-3.5z' />
    </>
  ),
  telegram: (
    <path d='M3.5 11.2L20 4.5l-2.8 15-5.3-4.3-2.6 2.6-.4-4.4 7.6-6.9-9.3 5.6z' />
  ),
  sms: (
    <>
      <path d='M4 5.5h16v10.5H9l-5 4z' />
      <path d='M8 10.5h.01M12 10.5h.01M16 10.5h.01' strokeWidth='2.4' />
    </>
  ),
  pin: (
    <>
      <path d='M12 21s-6.5-6.2-6.5-11.2a6.5 6.5 0 0 1 13 0C18.5 14.8 12 21 12 21z' />
      <circle cx='12' cy='9.8' r='2.3' />
    </>
  ),
  clock: (
    <>
      <circle cx='12' cy='12' r='8.5' />
      <path d='M12 7.5V12l3 2' />
    </>
  ),
  mail: (
    <>
      <rect x='3.5' y='5.5' width='17' height='13' rx='2' />
      <path d='M4 7l8 6 8-6' />
    </>
  ),
  check: <path d='M5 12.5l4.5 4.5L19 7.5' />,
  arrow: <path d='M5 12h13M13 6.5l5.5 5.5-5.5 5.5' />,
};

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg
      className='icon'
      viewBox='0 0 24 24'
      width={size}
      height={size}
      fill='none'
      stroke='currentColor'
      strokeWidth='1.6'
      strokeLinecap='round'
      strokeLinejoin='round'
      aria-hidden='true'
      focusable='false'
    >
      {PATHS[name]}
    </svg>
  );
}

export type { IconName };
