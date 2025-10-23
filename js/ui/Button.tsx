'use client'

import { Button as NextraButton } from 'nextra/components'
import { forwardRef } from 'react'
import type { ComponentPropsWithRef, ComponentPropsWithoutRef } from 'react'

type ButtonProps = ComponentPropsWithoutRef<typeof NextraButton>
type ButtonRef = ComponentPropsWithRef<typeof NextraButton>['ref']

const DEFAULT_CLASSNAME = 'app-button'

export const Button = forwardRef(function Button(
  { className, ...props }: ButtonProps,
  ref: ButtonRef,
) {
  const composed = className ? `${DEFAULT_CLASSNAME} ${className}` : DEFAULT_CLASSNAME
  return <NextraButton ref={ref} className={composed} {...props} />
})
