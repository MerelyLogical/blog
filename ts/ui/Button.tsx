'use client'

import { forwardRef } from 'react'
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ForwardedRef } from 'react'

type ButtonProps = (ButtonHTMLAttributes<HTMLButtonElement> &
  AnchorHTMLAttributes<HTMLAnchorElement> & { href?: string })

const DEFAULT_CLASSNAME = 'app-button'
const DEFAULT_TYPE = 'button'

export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  function Button({ className, type = DEFAULT_TYPE, href, ...props }, ref) {
    const composed = className ? `${DEFAULT_CLASSNAME} ${className}` : DEFAULT_CLASSNAME

    if (href) {
      return (
        <a
          ref={ref as ForwardedRef<HTMLAnchorElement>}
          className={composed}
          href={href}
          {...props}
        />
      )
    }

    return (
      <button
        ref={ref as ForwardedRef<HTMLButtonElement>}
        className={composed}
        type={type}
        {...props}
      />
    )
  },
)
