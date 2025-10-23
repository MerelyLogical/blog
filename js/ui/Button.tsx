'use client'

import { Button as NextraButton } from 'nextra/components'
import type { ComponentPropsWithoutRef } from 'react'

type ButtonProps = ComponentPropsWithoutRef<typeof NextraButton>

const DEFAULT_CLASSNAME = 'app-button'

export function Button({ className, ...props }: ButtonProps) {
  const composed = className ? `${DEFAULT_CLASSNAME} ${className}` : DEFAULT_CLASSNAME
  return <NextraButton className={composed} {...props} />
}
