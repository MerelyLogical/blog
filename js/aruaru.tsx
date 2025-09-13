"use client";

import { useState, ReactNode } from "react";
import { Table } from 'nextra/components';

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
  return (
    <span
      onClick={() => setHidden((v) => !v)}
      style={{ opacity: hidden ? 0 : 1, cursor: "pointer" }}
    >
      {children}
    </span>
  );
}

// Reveal as a <Table.Tr>
function RevealRow({
  children,
  initiallyHidden = false,
}: {
  children: ReactNode;
  initiallyHidden?: boolean;
}) {
  const [hidden, setHidden] = useState(initiallyHidden);
  return (
    <Table.Tr
      onClick={() => setHidden((v) => !v)}
      style={{ opacity: hidden ? 0 : 1, cursor: "pointer" }}
    >
      {children}
    </Table.Tr>
  );
}

// ToggleRow wraps <Table.Td> cells inside RevealRow
function ToggleRow({
  cells,
  initiallyHidden = false,
}: {
  cells: ReactNode[];
  initiallyHidden?: boolean;
}) {
  return (
    <RevealRow initiallyHidden={initiallyHidden}>
      {cells.map((c, i) => (
        <Table.Td key={i}>{c}</Table.Td>
      ))}
    </RevealRow>
  );
}

type QA = {
  headers: string[];
  rows: { cells: ReactNode[]; hidden?: boolean }[];
  notes: { label: string; content: ReactNode; hidden?: boolean }[];
};

export function Question({ headers, rows, notes }: QA) {
  return (
    <div>
      <table>
        <thead>
          <Table.Tr>
            {headers.map((h, i) => (
              <Table.Th key={i}>{h}</Table.Th>
            ))}
          </Table.Tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <ToggleRow key={i} cells={r.cells} initiallyHidden={!!r.hidden} />
          ))}
        </tbody>
      </table>

      <ul>
        {notes.map((n, i) => (
          <li key={i}>
            {n.label}: <RevealSpan initiallyHidden={!!n.hidden}>{n.content}</RevealSpan>
          </li>
        ))}
      </ul>
    </div>
  );
}
