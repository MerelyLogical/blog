"use client";

import { useState, ReactNode } from "react";
import { Table } from "nextra/components";

const obfuscate = (value: ReactNode) =>
  typeof value === "string" || typeof value === "number" ? "_____" : "Spoiler";

// TODO lol this is dumb, why not have hidden as default

// Reveal as a <span>
function RevealSpan({
  children,
  initiallyHidden = true,
}: {
  children: ReactNode;
  initiallyHidden?: boolean;
}) {
  const [hidden, setHidden] = useState(initiallyHidden);
  return hidden ? (
    <button
      type="button"
      onClick={() => setHidden(false)}
      aria-label="Reveal spoiler"
    >
      {/* obscure text to mimic spoiler blur */}
      <span aria-hidden="true">{obfuscate(children)}</span>
    </button>
  ) : (
    <span>{children}</span>
  );
}

// RevealRow renders each table cell with a spoiler placeholder until first click
function RevealRow({
  cells,
  initiallyHidden = false,
}: {
  cells: ReactNode[];
  initiallyHidden?: boolean;
}) {
  const [hidden, setHidden] = useState(initiallyHidden);

  return (
    <Table.Tr
      onClick={() => {
        if (hidden) {
          setHidden(false);
        }
      }}
    >
      {cells.map((c, i) => (
        <Table.Td key={i}>
          {hidden ? (
            <span aria-hidden="true">{obfuscate(c)}</span>
          ) : (
            c
          )}
        </Table.Td>
      ))}
    </Table.Tr>
  );
}

type QA = {
  headers: string[];
  rows: { cells: ReactNode[]; hidden?: boolean }[];
  notes: { label: string; content: ReactNode; hidden?: boolean }[];
};

export function Question({ headers, rows, notes }: QA) {
  return (
    <div className="nx-my-6 nx-space-y-6">
      <Table
        className="nx-w-full nx-border-collapse nx-text-sm nx-leading-7 nx-text-slate-800 dark:nx-text-slate-100"
        style={{ borderSpacing: 0 }}
      >
        <thead>
          <Table.Tr className="nx-border-b nx-border-slate-200 dark:nx-border-slate-800">
            {headers.map((h, i) => (
              <Table.Th key={i} className="nx-font-semibold nx-py-2 nx-pr-4">
                {h}
              </Table.Th>
            ))}
          </Table.Tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <RevealRow key={i} cells={r.cells} initiallyHidden={!!r.hidden} />
          ))}
        </tbody>
      </Table>

      <ul
        className="nx-space-y-2"
        style={{
          listStyle: "disc",
          listStylePosition: "outside",
          paddingInlineStart: "1.5rem",
          lineHeight: "1.75",
        }}
      >
        {notes.map((n, i) => (
          <li key={i}>
            {n.label}: <RevealSpan initiallyHidden={!!n.hidden}>{n.content}</RevealSpan>
          </li>
        ))}
      </ul>
    </div>
  );
}
