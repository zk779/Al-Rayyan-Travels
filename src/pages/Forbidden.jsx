"use client";

import { useEffect, useRef, useState } from "react";
import LogoDark from "../assets/logo-dark.png";
import LogoLight from "../assets/logo-light.png";

/* ======================================================================
   FORBIDDEN 403 — "Departure Board" concept
   The HTTP status code doubles as the flight number on an airport
   split-flap (Solari) board. Everything else stays quiet so that one
   idea carries the page. Ships as a single self-contained component —
   styling is scoped in an inline <style> tag so it doesn't depend on
   this project's Tailwind theme.
   ====================================================================== */

const FLAP_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ·—";

/** One mechanical split-flap character tile. Cycles through random
 *  glyphs before settling on its final character, staggered by `delay`. */
function Flap({ finalChar, delay }) {
  const [display, setDisplay] = useState(" ");
  const [settled, setSettled] = useState(false);
  const tickRef = useRef(null);

  useEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) {
      setDisplay(finalChar);
      setSettled(true);
      return;
    }

    let ticks = 0;
    const maxTicks = 8 + Math.floor(Math.random() * 5);

    const start = window.setTimeout(() => {
      tickRef.current = window.setInterval(() => {
        ticks += 1;
        if (ticks >= maxTicks) {
          setDisplay(finalChar);
          setSettled(true);
          if (tickRef.current) window.clearInterval(tickRef.current);
          return;
        }
        setDisplay(FLAP_CHARS[Math.floor(Math.random() * FLAP_CHARS.length)]);
      }, 55);
    }, delay);

    return () => {
      window.clearTimeout(start);
      if (tickRef.current) window.clearInterval(tickRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finalChar, delay]);

  return (
    <span className={`f403-flap${settled ? " is-settled" : ""}`}>
      <span className="f403-flap-inner">{display}</span>
    </span>
  );
}

function FlapRow({ text, baseDelay = 0, stagger = 40 }) {
  return (
    <span className="f403-flap-row">
      {text.split("").map((ch, i) => (
        <Flap
          key={i}
          finalChar={ch === " " ? " " : ch}
          delay={baseDelay + i * stagger}
        />
      ))}
    </span>
  );
}

/**
 * @param {Object} props
 * @param {string} [props.logoUrl] - URL to your own logo. If omitted, a placeholder slot is shown.
 * @param {string} [props.attemptedPath] - The route or resource the user tried to reach.
 * @param {string} [props.homeHref] - Where "Return to check-in" should send the user. Defaults to "/".
 * @param {() => void} [props.onRequestAccess] - Called when the user asks for access. If omitted, opens a mailto link.
 * @param {string} [props.supportEmail] - Support/admin contact used for the default mailto fallback.
 */
export default function Forbidden403Page({
  logoUrl,
  attemptedPath = "this destination",
  homeHref = "/dashboard",
  onRequestAccess,
  supportEmail = "support@yourtravelagency.com",
}) {
  const handleRequestAccess = () => {
    if (onRequestAccess) return onRequestAccess();
    window.location.href = `mailto:${supportEmail}?subject=Access request&body=I need clearance for: ${attemptedPath}`;
  };

  return (
    <div className="f403-root">
      <div className="f403-runway" aria-hidden="true">
        {Array.from({ length: 14 }).map((_, i) => (
          <span key={i} style={{ animationDelay: `${i * 0.18}s` }} />
        ))}
      </div>

      <div className="f403-sky" aria-hidden="true" />

      <header className="f403-header">

          <img
            src={LogoDark}
            className="w-28 h-full object-contain"
            alt="logo"
          />
      </header>

      <main className="f403-main">
        <div
          className="f403-board"
          role="img"
          aria-label="Flight 403, destination this page, status denied"
        >
          <div className="f403-board-head">
            <span>FLIGHT</span>
            <span>DESTINATION</span>
            <span>GATE</span>
            <span>STATUS</span>
          </div>
          <div className="f403-board-row">
            <div className="f403-col f403-col-flight">
              <FlapRow text="403" baseDelay={0} />
            </div>
            <div className="f403-col f403-col-dest">
              <FlapRow text="THIS PAGE" baseDelay={200} />
            </div>
            <div className="f403-col f403-col-gate">
              <FlapRow text="——" baseDelay={560} />
            </div>
            <div className="f403-col f403-col-status">
              <FlapRow text="DENIED" baseDelay={680} />
            </div>
          </div>
          <div className="f403-board-glow" aria-hidden="true" />
        </div>

        <section className="f403-pass" aria-labelledby="f403-pass-heading">
          <div
            className="f403-pass-notch f403-pass-notch-left"
            aria-hidden="true"
          />
          <div
            className="f403-pass-notch f403-pass-notch-right"
            aria-hidden="true"
          />

          <div className="f403-pass-main">
            <p className="f403-eyebrow">BOARDING PASS · RESTRICTED AREA</p>
            <h1 id="f403-pass-heading" className="f403-title">
              You don&rsquo;t have clearance for this route
            </h1>
            <p className="f403-body">
              Your account isn&rsquo;t authorized to board{" "}
              <strong>{attemptedPath}</strong>. If you think this is a mistake,
              request access below and an administrator will review it.
            </p>

            <dl className="f403-fields">
              <div>
                <dt>FROM</dt>
                <dd>Your clearance level</dd>
              </div>
              <div>
                <dt>TO</dt>
                <dd>{attemptedPath}</dd>
              </div>
              <div>
                <dt>STATUS</dt>
                <dd className="f403-status-denied">Boarding denied</dd>
              </div>
            </dl>

            <div className="f403-actions">
              <a href={homeHref} className="f403-btn f403-btn-primary">
                Return to Dashboard
              </a>
              <button
                type="button"
                onClick={handleRequestAccess}
                className="f403-btn f403-btn-secondary"
              >
                Request access
              </button>
            </div>
          </div>

          <div className="f403-pass-perforation" aria-hidden="true" />

          <div className="f403-pass-stub">
            <span className="f403-stub-code">403</span>
            <span className="f403-stub-label">NOT BOARDED</span>
          </div>
        </section>
      </main>

      <style>{`
        .f403-root {
          position: relative;
          min-height: 100vh;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          overflow: hidden;
          background: radial-gradient(120% 100% at 50% -10%, #132846 0%, #0A1628 55%, #070f1e 100%);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          color: #F4F1EA;
        }

        .f403-sky {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(1px 1px at 20% 20%, rgba(244,241,234,0.35) 50%, transparent 51%),
                            radial-gradient(1px 1px at 70% 10%, rgba(244,241,234,0.25) 50%, transparent 51%),
                            radial-gradient(1.5px 1.5px at 85% 30%, rgba(244,241,234,0.3) 50%, transparent 51%),
                            radial-gradient(1px 1px at 40% 15%, rgba(244,241,234,0.2) 50%, transparent 51%),
                            radial-gradient(1px 1px at 60% 35%, rgba(244,241,234,0.25) 50%, transparent 51%),
                            radial-gradient(1.5px 1.5px at 10% 40%, rgba(244,241,234,0.2) 50%, transparent 51%);
          pointer-events: none;
        }

        .f403-runway {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 3px;
          display: flex;
          justify-content: space-evenly;
          padding: 0 4%;
          pointer-events: none;
        }
        .f403-runway span {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #F5A623;
          box-shadow: 0 0 8px 2px rgba(245,166,35,0.7);
          animation: f403-pulse 1.8s ease-in-out infinite;
        }
        @keyframes f403-pulse {
          0%, 100% { opacity: 0.25; }
          50% { opacity: 1; }
        }

        .f403-header {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 960px;
          padding: 32px 24px 0;
          display: flex;
          justify-content: center;
        }
        .f403-logo-img { height: 36px; object-fit: contain; }
        .f403-logo-placeholder {
          font-size: 12px;
          letter-spacing: 0.12em;
          color: #7C8AA0;
          border: 1px dashed #33415a;
          padding: 8px 18px;
          border-radius: 6px;
        }

        .f403-main {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 960px;
          padding: 40px 20px 80px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 40px;
        }

        /* ---------- Departure board ---------- */
        .f403-board {
          position: relative;
          width: 100%;
          max-width: 720px;
          background: linear-gradient(180deg, #0F2138 0%, #0B1A2E 100%);
          border-radius: 14px;
          border: 1px solid #1c2f4a;
          box-shadow: 0 30px 60px -20px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04);
          padding: 22px 18px 26px;
        }
        .f403-board-head {
          display: grid;
          grid-template-columns: 1fr 2fr 0.8fr 1.4fr;
          gap: 8px;
          padding: 0 6px 12px;
          font-family: 'IBM Plex Mono', ui-monospace, SFMono-Regular, monospace;
          font-size: 11px;
          letter-spacing: 0.14em;
          color: #6E7EA0;
          border-bottom: 1px solid #1c2f4a;
          margin-bottom: 14px;
        }
        .f403-board-row {
          display: grid;
          grid-template-columns: 1fr 2fr 0.8fr 1.4fr;
          gap: 8px;
          padding: 0 6px;
        }
        .f403-col { display: flex; align-items: center; }
        .f403-col-status .f403-flap-inner { color: #FF7A52; }

        .f403-flap-row { display: inline-flex; gap: 3px; flex-wrap: wrap; }
        .f403-flap {
          display: inline-block;
          background: #171008;
          border-radius: 3px;
          width: 1.35em;
          height: 1.9em;
          line-height: 1.9em;
          text-align: center;
          overflow: hidden;
          box-shadow: inset 0 0 0 1px #2A2113, 0 1px 0 rgba(0,0,0,0.5);
          position: relative;
        }
        .f403-flap::after {
          content: "";
          position: absolute;
          left: 0; right: 0; top: 50%;
          height: 1px;
          background: rgba(0,0,0,0.55);
        }
        .f403-flap-inner {
          display: block;
          font-family: 'IBM Plex Mono', ui-monospace, SFMono-Regular, monospace;
          font-weight: 600;
          font-size: 1.05em;
          color: #F5A623;
          text-shadow: 0 0 6px rgba(245,166,35,0.35);
        }
        .f403-flap:not(.is-settled) .f403-flap-inner {
          animation: f403-flicker 0.055s linear infinite;
        }
        @keyframes f403-flicker {
          from { transform: translateY(-2%); }
          to { transform: translateY(2%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .f403-flap:not(.is-settled) .f403-flap-inner { animation: none; }
        }

        .f403-board-glow {
          position: absolute;
          inset: -1px;
          border-radius: 14px;
          box-shadow: 0 0 40px -10px rgba(245,166,35,0.08);
          pointer-events: none;
        }

        /* ---------- Boarding pass ---------- */
        .f403-pass {
          position: relative;
          width: 100%;
          max-width: 640px;
          background: #F4F1EA;
          color: #16202E;
          border-radius: 16px;
          display: grid;
          grid-template-columns: 1fr auto;
          box-shadow: 0 30px 60px -25px rgba(0,0,0,0.55);
        }
        .f403-pass-main { padding: 34px 32px; }
        .f403-eyebrow {
          font-family: 'IBM Plex Mono', ui-monospace, monospace;
          font-size: 11px;
          letter-spacing: 0.14em;
          color: #B5551E;
          margin: 0 0 14px;
        }
        .f403-title {
          font-size: 26px;
          line-height: 1.25;
          margin: 0 0 12px;
          font-weight: 700;
          letter-spacing: -0.01em;
        }
        .f403-body {
          font-size: 14.5px;
          line-height: 1.6;
          color: #4B5567;
          margin: 0 0 22px;
        }
        .f403-body strong { color: #16202E; }

        .f403-fields {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin: 0 0 26px;
          padding-top: 18px;
          border-top: 1px dashed #C9C3B4;
        }
        .f403-fields dt {
          font-family: 'IBM Plex Mono', ui-monospace, monospace;
          font-size: 10px;
          letter-spacing: 0.12em;
          color: #8B93A7;
          margin-bottom: 4px;
        }
        .f403-fields dd { margin: 0; font-size: 13.5px; font-weight: 600; }
        .f403-status-denied { color: #E4572E; }

        .f403-actions { display: flex; gap: 12px; flex-wrap: wrap; }
        .f403-btn {
          appearance: none;
          border: none;
          cursor: pointer;
          font-size: 13.5px;
          font-weight: 600;
          padding: 11px 20px;
          border-radius: 8px;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .f403-btn:focus-visible {
          outline: 2px solid #16202E;
          outline-offset: 2px;
        }
        .f403-btn-primary {
          background: #16202E;
          color: #F4F1EA;
        }
        .f403-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 8px 16px -8px rgba(22,32,46,0.5); }
        .f403-btn-secondary {
          background: transparent;
          color: #16202E;
          box-shadow: inset 0 0 0 1.5px #C9C3B4;
        }
        .f403-btn-secondary:hover { box-shadow: inset 0 0 0 1.5px #16202E; }

        .f403-pass-perforation {
          position: relative;
          width: 0;
          border-left: 2px dashed #C9C3B4;
          margin: 20px 0;
        }
        .f403-pass-notch {
          position: absolute;
          width: 24px;
          height: 24px;
          background: #0A1628;
          border-radius: 50%;
          top: 50%;
          transform: translateY(-50%);
        }
        .f403-pass-notch-left { left: calc(100% * (1 - 0.185) - 12px); }
        .f403-pass-notch-right { right: -12px; }

        .f403-pass-stub {
          padding: 34px 26px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          min-width: 128px;
        }
        .f403-stub-code {
          font-family: 'IBM Plex Mono', ui-monospace, monospace;
          font-size: 34px;
          font-weight: 700;
          color: #E4572E;
          writing-mode: vertical-rl;
          text-orientation: mixed;
          letter-spacing: 0.05em;
        }
        .f403-stub-label {
          font-family: 'IBM Plex Mono', ui-monospace, monospace;
          font-size: 10px;
          letter-spacing: 0.14em;
          color: #8B93A7;
          writing-mode: vertical-rl;
        }

        @media (max-width: 640px) {
          .f403-board-head, .f403-board-row {
            grid-template-columns: 1fr 1fr;
            row-gap: 14px;
          }
          .f403-pass { grid-template-columns: 1fr; }
          .f403-pass-perforation {
            border-left: none;
            border-top: 2px dashed #C9C3B4;
            margin: 0 20px;
          }
          .f403-pass-notch-left, .f403-pass-notch-right {
            top: -12px;
            left: 50%;
            transform: translateX(-50%);
            right: auto;
          }
          .f403-pass-notch-right { top: auto; bottom: -12px; }
          .f403-pass-stub {
            flex-direction: row;
            padding: 18px 26px 26px;
          }
          .f403-stub-code, .f403-stub-label {
            writing-mode: horizontal-tb;
          }
        }
      `}</style>
    </div>
  );
}
