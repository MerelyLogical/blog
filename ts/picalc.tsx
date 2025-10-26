"use client";

import { useCallback, useEffect, useRef } from "react";
import { Button } from '@/ts/ui/Button';

const SVG_NS = "http://www.w3.org/2000/svg";

export function PiCalc() {
  const graph = useRef<SVGSVGElement | null>(null);
  const result = useRef<HTMLSpanElement | null>(null);
  const stats = useRef<HTMLSpanElement | null>(null);
  const total = useRef(0);
  const in_count = useRef(0);
  const pie = useRef(-1);

  useEffect(() => {
    const svg = graph.current;
    if (!svg) {
      return;
    }

    svg.replaceChildren();
    const p = document.createElementNS(SVG_NS, "path");
    p.setAttribute("d", "M 0 0 L 0 1 A 1 1 0 0 0 1 0 L 0 0");
    p.style.fill = "#444444";
    svg.appendChild(p);

    if (stats.current) {
      stats.current.textContent = "0 of 0";
    }
    if (result.current) {
      result.current.textContent = "";
    }

    return () => {
      svg.replaceChildren();
    };
  }, []);

  const step = useCallback((count: number) => {
    const svg = graph.current;
    const resultEl = result.current;
    const statsEl = stats.current;
    if (!svg || !resultEl || !statsEl) {
      return;
    }

    for (let i = 0; i < count; i++) {
      const randx = Math.random();
      const randy = Math.random();
      const c = document.createElementNS(SVG_NS, "circle");
      c.setAttribute("cx", randx.toString());
      c.setAttribute("cy", randy.toString());
      c.setAttribute("r", "0.002");
      c.style.fill = "#AAAAAA";

      const dist = Math.sqrt(randx ** 2 + randy ** 2);
      if (dist < 1) {
        in_count.current += 1;
        c.style.fill = "#CCCCFF";
      }
      total.current += 1;

      svg.appendChild(c);
    }

    if (total.current > 0) {
      pie.current = (4 * in_count.current) / total.current;
      resultEl.textContent = pie.current.toString();
    } else {
      pie.current = -1;
      resultEl.textContent = "";
    }
    statsEl.textContent = `${in_count.current} of ${total.current}`;
  }, []);

  return (
    <div>
      <div className="app-form-inline app-form-inline--compact">
        <Button type="button" onClick={() => step(1)}>
          Go
        </Button>
        <Button type="button" onClick={() => step(10)}>
          ×10
        </Button>
        <Button type="button" onClick={() => step(100)}>
          ×100
        </Button>
        <Button type="button" onClick={() => step(1000)}>
          ×1000
        </Button>
      </div>
      <p>
        <span ref={stats} /> dots landed inside the circle.
      </p>
      <p>
        π is <span ref={result} />
      </p>
      <br/>
      <svg ref={graph} id="graph" viewBox="0 0 1 1" />
    </div>
  );
}
