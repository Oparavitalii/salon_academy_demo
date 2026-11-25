import Image from 'next/image';

import { logos } from '@/lib/content/site';

/**
 * The header logo (7.0 §3). Site header → salon logo; cabinet header → academy logo (white circle) —
 * Oksana, Telegram 20.10.2026: one logo on the site, the academy one only inside the cabinet.
 * Salon: the owner asked for the logo without the circle (31.10.2026) → a transparent mark: dark ink on
 * a light header, light ink on the dark salon header (06.11); the black disc only in skin_classic. Which one shows is
 * pure CSS (`app/styles/logo_mark.css`), so there is no layout shift.
 * Decorative: the link around it carries the name, so the image alt is empty.
 */
export function LogoMark({
  variant = 'salon',
}: {
  variant?: 'salon' | 'academy';
}) {
  const academy = variant === 'academy';
  const disc = (
    <span
      className={`logo-circle logo-circle_sm ${academy ? 'logo-circle_white' : 'logo-circle_black logo_disc'}`}
      aria-hidden='true'
    >
      <Image
        src={academy ? logos.white : logos.black}
        width={480}
        height={480}
        alt=''
        sizes='40px'
      />
    </span>
  );
  if (academy) return disc;
  return (
    <>
      {disc}
      <Image
        className='logo_mark'
        src={logos.mark}
        width={logos.markWidth}
        height={logos.markHeight}
        alt=''
        aria-hidden='true'
        sizes='70px'
        priority
      />
      <Image
        className='logo_mark logo_mark_light'
        src={logos.markLight}
        width={logos.markWidth}
        height={logos.markHeight}
        alt=''
        aria-hidden='true'
        sizes='70px'
      />
    </>
  );
}
