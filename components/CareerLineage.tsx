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

function skillBadge(sk: Skill) {
  if (sk.cert) {
    return { label: String(sk.s), active: true, cert: true, end: undefined };
  }
  const active = sk.e == null;
  const end = sk.e ?? NOW;
  const yrs = end - sk.s;
  return {
    label: yrs >= 1 ? `${yrs}y` : "new",
    active,
    cert: false,
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
      <span className={styles.skY}>{b.label}</span>
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
        <p className={styles.kicker}>Wolfman Analytics</p>
        <p className={styles.eyebrow}>{`Career lineage \u00b7 ${meta.range}`}</p>
        <h1>
          How I got here,
          <br />
          <span className={styles.soft}>traced like data lineage.</span>
        </h1>
        <p className={styles.thesis}>
          Over twenty years turning data into decisions.{" "}
          <strong>
            Each role grew skills and shipped wins, grouped by what they were
            really about.
          </strong>{" "}
          Skills start at the job where I first earned them and the clock keeps
          running while I keep using them.
        </p>

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
          Each win is numbered to its role. Skills show years of experience
          counted to today, and dim when I stopped using them. Personal projects
          ran alongside the work and carry a copper marker.
        </p>

        <div className={styles.controls} role="group" aria-label="Filter">
          {([
            ["all", "Everything"],
            ["ach", "Wins only"],
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
