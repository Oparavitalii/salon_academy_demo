import { Link } from '@/i18n/navigation';

type Props = {
  href: string;
  className?: string;
  title?: string;
  'aria-label'?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
};

/**
 * One link for internal and external targets: `http…` opens in a new tab (Instagram, Maps,
 * Booksy when known); `#hash` stays a plain same-page anchor; everything else goes through
 * the locale-aware next-intl `Link`.
 */
export function SmartLink({ href, children, ...rest }: Props) {
  if (/^https?:\/\//.test(href)) {
    return (
      <a href={href} target='_blank' rel='noopener' {...rest}>
        {children}
      </a>
    );
  }
  if (href.startsWith('#')) {
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} {...rest}>
      {children}
    </Link>
  );
}
