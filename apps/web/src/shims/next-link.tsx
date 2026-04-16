import React from 'react';
import { Link as RouterLink } from 'react-router-dom';

// Shim for next/link — maps Next.js Link props to react-router-dom Link

type HrefType = string | { pathname: string; query?: Record<string, string> };

export interface NextLinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  href: HrefType;
  replace?: boolean;
  scroll?: boolean;
  shallow?: boolean;
  passHref?: boolean;
  prefetch?: boolean;
  locale?: string | false;
  children?: React.ReactNode;
}

const Link = React.forwardRef<HTMLAnchorElement, NextLinkProps>(
  (
    {
      href,
      replace,
      scroll: _scroll,
      shallow: _shallow,
      passHref: _passHref,
      prefetch: _prefetch,
      locale: _locale,
      ...rest
    },
    ref,
  ) => {
    let to = '';
    if (typeof href === 'string') {
      to = href;
    } else if (href) {
      to = href.pathname || '';
      if (href.query) {
        to += '?' + new URLSearchParams(href.query).toString();
      }
    }
    return <RouterLink to={to} replace={replace} ref={ref} {...rest} />;
  },
);

Link.displayName = 'Link';

export default Link;
