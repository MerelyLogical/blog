'use client'

import { forwardRef } from 'react'
import type { ButtonHTMLAttributes } from 'react'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>

const DEFAULT_CLASSNAME = 'app-button'
const DEFAULT_TYPE = 'button'

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, type = DEFAULT_TYPE, ...props },
  ref,
) {
  const composed = className ? `${DEFAULT_CLASSNAME} ${className}` : DEFAULT_CLASSNAME
  return <button ref={ref} className={composed} type={type} {...props} />
})
