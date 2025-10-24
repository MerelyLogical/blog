'use client';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import KoFiDialog from './KoFiDialog';

type KoFiSidebarButtonProps = {
  iframe: string;
};

type SlotEntry = {
  element: HTMLElement;
  compact: boolean;
};

const SLOT_CLASS = 'kofi-sidebar-slot';
const FOOTER_SELECTOR = '.nextra-sidebar-footer';
const SIDEBAR_SELECTOR = '.nextra-sidebar';

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

const KoFiSidebarButton = ({ iframe }: KoFiSidebarButtonProps) => {
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
            <KoFiDialog
              color="#323842"
              label="Support me on Ko-fi"
              id="merelylogical"
              iframe={iframe}
              width={480}
              padding={0}
              compact={compact}
            />
          </div>,
          element,
          `kofi-sidebar-${index}`
        )
      )}
    </>
  );
};

export default KoFiSidebarButton;
