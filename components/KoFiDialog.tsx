'use client';

import { useState } from 'react';
import type { CSSProperties } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Cross2Icon } from '@radix-ui/react-icons';
import { Button } from '../js/ui/Button';

type KoFiDialogProps = {
  color?: string;
  textColor?: string;
  id?: string;
  label?: string;
  padding?: number;
  width?: number | string;
  backgroundColor?: string;
  iframe?: string;
  buttonRadius?: string;
  compact?: boolean;
};

const visuallyHidden: CSSProperties = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0
};

const KoFiDialog = ({
  color = '#323842',
  textColor = '#fff',
  id = 'prototypr',
  label = 'Support me on Ko-fi',
  padding = 0,
  width = 400,
  backgroundColor = '#fff',
  iframe,
  buttonRadius = '8px',
  compact = false
}: KoFiDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const contentWidth = typeof width === 'number' ? `${width}px` : width;
  const embedHeight = 'min(712px, calc(100vh - 120px))';
  const buttonStyle: CSSProperties = {
    backgroundColor: color,
    borderRadius: buttonRadius,
    border: 'none',
    color: textColor,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: compact ? 0 : '0.35rem',
    padding: compact ? '4px' : '0 12px',
    height: compact ? '32px' : '32px',
    fontSize: '0.85rem',
    fontWeight: 600,
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.15)',
    width: compact ? '32px' : '100%',
    minWidth: compact ? '32px' : undefined,
    margin: 0
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger asChild>
        <Button
          aria-label={label}
          title={label}
          className="kofi-button"
          style={buttonStyle}
          onClick={() => setIsOpen(true)}
        >
          <img
            src="https://ko-fi.com/img/cup-border.png"
            className="kofiimg"
            alt="Ko-Fi button"
            style={{ display: 'block', height: compact ? '18px' : '20px' }}
          />
          <span style={compact ? visuallyHidden : undefined}>{label}</span>
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 9998
          }}
        />
        <Dialog.Content
          style={{
            padding,
            width: contentWidth,
            backgroundColor,
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            maxWidth: 'calc(100vw - 32px)',
            maxHeight: 'calc(100vh - 48px)',
            borderRadius: '12px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            zIndex: 9999,
            overflow: 'hidden'
          }}
        >
          <Dialog.Title style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap', border: 0 }}>
            {label}
          </Dialog.Title>
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: embedHeight,
              minHeight: '360px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: '0.5rem',
                zIndex: 1,
                color: '#4b5563',
                fontSize: '0.9rem'
              }}
            >
              <img
                src="https://ko-fi.com/img/cup-border.png"
                className="kofiimg"
                alt="Ko-Fi button"
                style={{ width: '32px', height: 'auto' }}
              />
              <span>Loading...</span>
            </div>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                zIndex: 2
              }}
            >
              {iframe ? (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    background: 'transparent'
                  }}
                  dangerouslySetInnerHTML={{ __html: iframe }}
                />
              ) : (
                <iframe
                  id="kofiframe"
                  src={`https://ko-fi.com/${id}/?hidefeed=true&widget=true&embed=true&preview=true`}
                  style={{
                    border: 'none',
                    width: '100%',
                    height: '100%',
                    background: 'transparent'
                  }}
                  title={id}
                />
              )}
            </div>
          </div>
          <Dialog.Close asChild>
            <button
              type="button"
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                backgroundColor: '#e5e7eb',
                borderRadius: '9999px',
                padding: '4px',
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex'
              }}
            >
              <Cross2Icon width={16} height={16} color="#6b7280" />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default KoFiDialog;
