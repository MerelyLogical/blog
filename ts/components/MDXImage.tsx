'use client'

import { ImageZoom } from 'nextra/components'
import type { ComponentType, CSSProperties, ImgHTMLAttributes } from 'react'

type StyleWithCustomProperty = CSSProperties & {
  ['--mdx-image-width']?: string
}

type MDXImageProps = ImgHTMLAttributes<HTMLImageElement>

const ZoomableImage = ImageZoom as ComponentType<
  ImgHTMLAttributes<HTMLImageElement> & { style?: CSSProperties }
>

export function MDXImage({ title, className, style, ...props }: MDXImageProps) {
  const widthPercentage = title ? parseFloat(title) : 85
  const composedClassName = className ? `mdx-image ${className}` : 'mdx-image'

  const mergedStyle: StyleWithCustomProperty = {
    ...((style as StyleWithCustomProperty) ?? {}),
    '--mdx-image-width': `${widthPercentage}%`
  }

  return (
    <ZoomableImage
      {...props}
      className={composedClassName}
      title={undefined}
      style={mergedStyle}
    />
  )
}
