'use client';
import type { CSSProperties } from 'react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type SlotEntry = {
  element: HTMLElement;
  compact: boolean;
};

const SLOT_CLASS = 'kofi-sidebar-slot';
const FOOTER_SELECTOR = '.nextra-sidebar-footer';
const SIDEBAR_SELECTOR = '.nextra-sidebar';
const KOFI_URL = 'https://ko-fi.com/merelylogical';
const KOFI_LABEL = 'Support me on Ko-fi';
const KOFI_ICON =
  'https://storage.ko-fi.com/cdn/brandasset/v2/kofi_symbol.png';
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

const getButtonStyle = (compact: boolean): CSSProperties => ({
  backgroundColor: '#323842',
  borderRadius: '8px',
  border: 'none',
  color: '#fff',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: compact ? 0 : '0.35rem',
  padding: compact ? '4px' : '0 12px',
  height: '32px',
  fontSize: '0.85rem',
  fontWeight: 600,
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.15)',
  width: compact ? '32px' : '100%',
  minWidth: compact ? '32px' : undefined,
  textDecoration: 'none'
});

const ensureFooterSlot = (footer: HTMLElement) => {
  let slot = footer.querySelector<HTMLElement>(`.${SLOT_CLASS}`);
  if (!slot) {
    slot = document.createElement('div');
    slot.className = SLOT_CLASS;
    slot.dataset.kofiSlot = 'true';
    footer.appendChild(slot);
  } else if (slot.nextElementSibling) {
    footer.appendChild(slot);
  }
  footer.style.flexWrap = 'wrap';
  slot.style.width = '100%';
  slot.style.display = 'flex';
  slot.style.flexDirection = 'column';
  slot.style.alignItems = 'stretch';
  slot.style.marginTop = '0.75rem';
  return slot;
};

const isCompact = (slot: HTMLElement) => {
  const sidebar = slot.closest(SIDEBAR_SELECTOR);
  if (!sidebar) {
    return false;
  }
  return sidebar.classList.contains('x:w-20');
};

const entriesEqual = (a: SlotEntry[], b: SlotEntry[]) =>
  a.length === b.length &&
  a.every(
    (entry, index) =>
      entry.element === b[index].element && entry.compact === b[index].compact
  );

const removeSlot = (slot: HTMLElement) => {
  const parent = slot.parentElement as HTMLElement | null;
  if (parent?.matches(FOOTER_SELECTOR)) {
    parent.style.flexWrap = '';
  }
  if (slot.isConnected) {
    slot.remove();
  }
};

const KoFiSidebarButton = () => {
  const [entries, setEntries] = useState<SlotEntry[]>([]);
  const entriesRef = useRef<SlotEntry[]>([]);

  useEffect(() => {
    const updateEntries = () => {
      const containers = Array.from(
        document.querySelectorAll<HTMLElement>(FOOTER_SELECTOR)
      ).map(ensureFooterSlot);
      const newEntries: SlotEntry[] = containers.map((element) => ({
        element,
        compact: isCompact(element)
      }));
      const previous = entriesRef.current;
      if (!entriesEqual(previous, newEntries)) {
        previous
          .filter(
            (entry) => !newEntries.some((nextEntry) => nextEntry.element === entry.element)
          )
          .forEach((entry) => removeSlot(entry.element));
        entriesRef.current = newEntries;
        setEntries(newEntries);
      }
    };

    updateEntries();

    const observer = new MutationObserver(updateEntries);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class']
    });

    return () => {
      observer.disconnect();
      entriesRef.current.forEach((entry) => removeSlot(entry.element));
    };
  }, []);

  if (!entries.length) {
    return null;
  }

  return (
    <>
      {entries.map(({ element, compact }, index) =>
        createPortal(
          <div
            key={`kofi-sidebar-wrapper-${index}`}
            className="kofi-sidebar-wrapper"
            style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
          >
            <a
              href={KOFI_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={KOFI_LABEL}
              title={KOFI_LABEL}
              style={getButtonStyle(compact)}
            >
              <img
                src={KOFI_ICON}
                className="kofiimg"
                alt=""
                style={{ display: 'block', height: compact ? '18px' : '20px' }}
              />
              <span style={compact ? visuallyHidden : undefined}>
                {KOFI_LABEL}
              </span>
            </a>
          </div>,
          element,
          `kofi-sidebar-${index}`
        )
      )}
    </>
  );
};

export default KoFiSidebarButton;
