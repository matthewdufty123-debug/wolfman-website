"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./CareerLineage.module.css";
import {
  careerLineage,
  type CareerNode,
  type CategoryKey,
  type Skill,
} from "@/lib/career-lineage";

type Filter = "all" | "ach" | "skill";

const NOW = new Date().getFullYear();

function wrapText(s: string, width: number): string[] {
  const words = String(s).split(/\s+/);
  const out: string[] = [];
  let line = "";
  for (const w of words) {
    if (!line) line = w;
    else if ((line + " " + w).length <= width) line += " " + w;
    else {
      out.push(line);
      line = w;
    }
  }
  if (line) out.push(line);
  return out;
}

function buildLineageText(): string {
  const d = careerLineage;
  const W = 74;
  const L: string[] = [];
  const m = d.meta;
  L.push(m.owner.toUpperCase());
  L.push(`${m.headline} \u00b7 ${m.range}`);
  L.push("=".repeat(60));
  if (m.profile) {
    L.push("");
    wrapText(m.profile, W).forEach((x) => L.push(x));
  }
  L.push("");
  const catLabel = (k: CategoryKey) => d.categories[k]?.label ?? k;
  d.nodes.forEach((node) => {
    L.push(`[${node.ref}] ${node.title} \u00b7 ${node.company}`);
    L.push(`      ${node.meta}`);
    if (node.brief) {
      L.push("");
      return;
    }
    const skillNames = (node.skills || []).map((s) => s.n);
    const groups = d.categoryOrder
      .filter((k) => node.cats[k]?.length)
      .map((k) => ({ label: catLabel(k), items: (node.cats[k] as string[]).slice() }));
    groups.forEach((g, gi) => {
      const lastGroup = gi === groups.length - 1 && skillNames.length === 0;
      const gconn = lastGroup ? "  \u2514\u2500 " : "  \u251c\u2500 ";
      const gpipe = lastGroup ? "     " : "  \u2502  ";
      L.push(gconn + g.label);
      g.items.forEach((it, ii) => {
        const lastItem = ii === g.items.length - 1;
        const iconn = lastItem ? "\u2514\u2500 " : "\u251c\u2500 ";
        const ipipe = lastItem ? "   " : "\u2502  ";
        wrapText(it, W - 8).forEach((wl, wi) =>
          L.push(gpipe + (wi === 0 ? iconn : ipipe) + wl)
        );
      });
    });
    if (skillNames.length) {
      L.push("  \u2514\u2500 Skills");
      wrapText(skillNames.join(" \u00b7 "), W - 7).forEach((wl) =>
        L.push("       " + wl)
      );
    }
    L.push("");
  });
  return L.join("\n");
}

function skillBadge(sk: Skill) {
  if (sk.cert) {
    return { label: String(sk.s), active: true, cert: true, show: true, end: undefined };
  }
  const active = sk.e == null;
  const end = sk.e ?? NOW;
  const yrs = end - sk.s;
  return {
    label: `${yrs}y`,
    active,
    cert: false,
    show: yrs >= 1,
    end: sk.e,
  };
}

function SkillChip({ sk, colour }: { sk: Skill; colour: string }) {
  const b = skillBadge(sk);
  const title = b.active && !sk.e ? `Since ${sk.s}` : `${sk.s} to ${sk.e}`;
  const className = [
    styles.skill,
    !b.active ? styles.skillOff : "",
    b.cert ? styles.skillCert : "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <span
      className={className}
      title={title}
      style={{ ["--cc" as string]: colour } as React.CSSProperties}
    >
      <span className={styles.skN}>{sk.n}</span>
      {b.show && <span className={styles.skY}>{b.label}</span>}
      {!b.active && <span className={styles.skE}>{`\u2192${sk.e}`}</span>}
    </span>
  );
}

function Node({ node }: { node: CareerNode }) {
  const { categories, categoryOrder, skillColour } = careerLineage;

  let counter = 0;
  const catBlocks = categoryOrder
    .filter((key) => node.cats[key]?.length)
    .map((key: CategoryKey) => {
      const def = categories[key];
      const items = node.cats[key] as string[];
      return (
        <div
          key={key}
          className={styles.cat}
          style={{ ["--cc" as string]: def.colour } as React.CSSProperties}
        >
          <div className={styles.catLabel}>{def.label}</div>
          {items.map((text) => {
            counter += 1;
            return (
              <div className={styles.leaf} key={`${node.ref}.${counter}`}>
                <span className={styles.bRef}>{`${node.ref}.${counter}`}</span>
                <span className={styles.bText}>{text}</span>
              </div>
            );
          })}
        </div>
      );
    });

  const nodeClass = [
    styles.node,
    node.current ? styles.current : "",
    node.personal ? styles.personal : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article className={nodeClass} data-reveal>
      <div className={styles.rail}>
        <span className={styles.dot} />
      </div>
      <div className={styles.main}>
        <div className={styles.rolehead}>
          <span className={styles.ref}>{node.ref}</span>
          <span className={styles.title}>{node.title}</span>
          <span className={styles.at}>at</span>
          <span className={styles.company}>{node.company}</span>
          {node.current && (
            <span className={`${styles.pill} ${styles.pillNow}`}>Now</span>
          )}
          {node.personal && !node.current && (
            <span className={`${styles.pill} ${styles.pillPersonal}`}>
              Personal
            </span>
          )}
          <span className={styles.meta}>{node.meta}</span>
        </div>
        <p className={styles.summary}>{node.summary}</p>
        {catBlocks}
        {node.skills.length > 0 && (
          <div
            className={`${styles.cat} ${styles.skills}`}
            style={{ ["--cc" as string]: skillColour } as React.CSSProperties}
          >
            <div className={styles.catLabel}>Skills gained here</div>
            <div className={styles.chips}>
              {node.skills.map((sk) => (
                <SkillChip key={sk.n} sk={sk} colour={skillColour} />
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

export default function CareerLineage() {
  const { meta, nodes } = careerLineage;
  const lineageRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [copied, setCopied] = useState(false);

  const handleDownload = () => {
    const blob = new Blob([buildLineageText()], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "matthew-dufty-career.txt";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    const txt = buildLineageText();
    try {
      await navigator.clipboard.writeText(txt);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = txt;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      try {
        document.execCommand("copy");
      } catch {
        /* no-op */
      }
      ta.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  useEffect(() => {
    const root = lineageRef.current;
    if (!root) return;
    const items = Array.from(
      root.querySelectorAll<HTMLElement>("[data-reveal]")
    );
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      items.forEach((el) => el.classList.add(styles.in));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add(styles.in);
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 }
    );
    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const lineageClass = [
    filter === "ach" ? styles.onlyAch : "",
    filter === "skill" ? styles.onlySkill : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={styles.root}>
      <main className={styles.wrap}>
        <p className={styles.kicker}>Matthew Dufty</p>
        <p className={styles.eyebrow}>{`Career lineage \u00b7 ${meta.range}`}</p>
        <h1>
          Professional Development
          <br />
          <span className={styles.soft}>with skills and achievements.</span>
        </h1>
        <p className={styles.thesis}>{meta.profile}</p>

        <div className={styles.exportActions}>
          <button type="button" className={styles.exportBtn} onClick={handleDownload}>
            Download .txt
          </button>
          <button type="button" className={styles.exportBtn} onClick={handleCopy}>
            {copied ? "Copied" : "Copy"}
          </button>
        </div>

        <div className={styles.legend} aria-hidden="true">
          {careerLineage.categoryOrder.map((key) => (
            <span className={styles.tier} key={key}>
              <span
                className={styles.swatch}
                style={{ background: careerLineage.categories[key].colour }}
              />
              {careerLineage.categories[key].label}
            </span>
          ))}
          <span className={styles.tier}>
            <span
              className={styles.swatch}
              style={{ background: careerLineage.skillColour }}
            />
            Skills
          </span>
        </div>
        <p className={styles.legendNote}>
          Each achievement is numbered to its role. Skills show years of experience
          counted to today, and dim when I stopped using them. Personal projects
          ran alongside the work and carry a copper marker.
        </p>

        <div className={styles.controls} role="group" aria-label="Filter">
          {([
            ["all", "Everything"],
            ["ach", "Achievements only"],
            ["skill", "Skills only"],
          ] as [Filter, string][]).map(([key, label]) => (
            <button
              key={key}
              className={`${styles.filter} ${
                filter === key ? styles.filterOn : ""
              }`}
              aria-pressed={filter === key}
              onClick={() => setFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>

        <div
          ref={lineageRef}
          className={lineageClass}
          data-filter={filter}
        >
          {nodes.map((node) => (
            <Node key={node.ref} node={node} />
          ))}
        </div>

        <footer className={styles.footer}>
          <span>{`${meta.owner} \u00b7 ${meta.headline}`}</span>
          <span>
            <a href="https://wolfman.app">wolfman.app</a>
            {" \u00b7 "}
            <a href="https://www.linkedin.com/in/matthew-dufty-2a696514/">
              LinkedIn
            </a>
          </span>
        </footer>
      </main>
    </div>
  );
}
