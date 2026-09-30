"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Calculator, X, Delete, Copy, History } from "lucide-react";
import { appToast } from "../../shadcn/components/ui/appToast";

/* ─── Arithmetic engine ───────────────────────────────────
   Classic calculator reducer: tracks the value on screen, the
   pending operator + previous operand, and whether the next digit
   should start a fresh number (right after an operator/equals).
──────────────────────────────────────────────────────────── */
const MAX_DIGITS = 12;

const formatDisplay = (value) => {
  if (value === "Error") return value;
  const num = Number(value);
  if (!Number.isFinite(num)) return "Error";

  // Keep the raw string while the user is still typing a decimal
  // ("12." etc.) — only reformat once it's a clean number.
  if (typeof value === "string" && value.endsWith(".")) return value;

  const str = Math.abs(num) >= 1e12 || (Math.abs(num) < 1e-9 && num !== 0)
    ? num.toExponential(6)
    : num.toLocaleString("en-US", { maximumFractionDigits: 8 });

  return str;
};

const compute = (a, b, op) => {
  const x = parseFloat(a);
  const y = parseFloat(b);
  switch (op) {
    case "+": return x + y;
    case "−": return x - y;
    case "×": return x * y;
    case "÷": return y === 0 ? NaN : x / y;
    default: return y;
  }
};

function useCalculatorEngine() {
  const [display, setDisplay] = useState("0");
  const [previousValue, setPreviousValue] = useState(null);
  const [operator, setOperator] = useState(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [expression, setExpression] = useState("");
  const [history, setHistory] = useState([]);

  const inputDigit = useCallback((digit) => {
    setDisplay((prev) => {
      if (waitingForOperand) return digit;
      if (prev === "0") return digit;
      if (prev.replace(/[-.]/g, "").length >= MAX_DIGITS) return prev;
      return prev + digit;
    });
    setWaitingForOperand(false);
  }, [waitingForOperand]);

  const inputDecimal = useCallback(() => {
    setDisplay((prev) => {
      if (waitingForOperand) return "0.";
      if (prev.includes(".")) return prev;
      return prev + ".";
    });
    setWaitingForOperand(false);
  }, [waitingForOperand]);

  const clearAll = useCallback(() => {
    setDisplay("0");
    setPreviousValue(null);
    setOperator(null);
    setWaitingForOperand(false);
    setExpression("");
  }, []);

  const backspace = useCallback(() => {
    setDisplay((prev) => {
      if (waitingForOperand || prev.length <= 1 || (prev.length === 2 && prev.startsWith("-"))) return "0";
      return prev.slice(0, -1);
    });
  }, [waitingForOperand]);

  const toggleSign = useCallback(() => {
    setDisplay((prev) => (prev === "0" ? prev : prev.startsWith("-") ? prev.slice(1) : `-${prev}`));
  }, []);

  const inputPercent = useCallback(() => {
    setDisplay((prev) => String(parseFloat(prev) / 100));
  }, []);

  const performOperation = useCallback((nextOperator) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
      setExpression(`${formatDisplay(display)} ${nextOperator}`);
    } else if (operator && !waitingForOperand) {
      const result = compute(previousValue, inputValue, operator);
      const resultStr = Number.isFinite(result) ? String(result) : "Error";
      setPreviousValue(Number.isFinite(result) ? result : null);
      setDisplay(resultStr);
      setExpression(`${formatDisplay(resultStr)} ${nextOperator}`);
    } else {
      setExpression(`${formatDisplay(previousValue)} ${nextOperator}`);
    }

    setWaitingForOperand(true);
    setOperator(nextOperator);
  }, [display, previousValue, operator, waitingForOperand]);

  const equals = useCallback(() => {
    if (operator === null || previousValue === null) return;
    const inputValue = parseFloat(display);
    const result = compute(previousValue, inputValue, operator);
    const resultStr = Number.isFinite(result) ? String(result) : "Error";
    const fullExpression = `${formatDisplay(previousValue)} ${operator} ${formatDisplay(display)}`;

    setHistory((prev) => [{ expression: fullExpression, result: resultStr }, ...prev].slice(0, 6));
    setDisplay(resultStr);
    setPreviousValue(null);
    setOperator(null);
    setWaitingForOperand(true);
    setExpression("");
  }, [display, previousValue, operator]);

  const useHistoryResult = useCallback((value) => {
    setDisplay(value);
    setPreviousValue(null);
    setOperator(null);
    setWaitingForOperand(false);
    setExpression("");
  }, []);

  return {
    display: formatDisplay(display),
    rawDisplay: display,
    expression,
    history,
    inputDigit,
    inputDecimal,
    clearAll,
    backspace,
    toggleSign,
    inputPercent,
    performOperation,
    equals,
    useHistoryResult,
  };
}

/* ─── Key definitions (classic 4-column layout) ───────────── */
const KEY_ROWS = [
  [
    { label: "AC", type: "clear" },
    { label: "+/-", type: "sign" },
    { label: "%", type: "percent" },
    { label: "÷", type: "op", op: "÷" },
  ],
  [
    { label: "7", type: "digit" }, { label: "8", type: "digit" }, { label: "9", type: "digit" },
    { label: "×", type: "op", op: "×" },
  ],
  [
    { label: "4", type: "digit" }, { label: "5", type: "digit" }, { label: "6", type: "digit" },
    { label: "−", type: "op", op: "−" },
  ],
  [
    { label: "1", type: "digit" }, { label: "2", type: "digit" }, { label: "3", type: "digit" },
    { label: "+", type: "op", op: "+" },
  ],
];

export default function FloatingCalculator() {
  const [open, setOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const containerRef = useRef(null);
  const engine = useCalculatorEngine();

  const handleKey = (key) => {
    switch (key.type) {
      case "clear": return engine.clearAll();
      case "sign": return engine.toggleSign();
      case "percent": return engine.inputPercent();
      case "op": return engine.performOperation(key.op);
      case "digit": return engine.inputDigit(key.label);
      default: return null;
    }
  };

  const copyResult = async () => {
    try {
      await navigator.clipboard.writeText(engine.rawDisplay);
      appToast.success("Copied", `${engine.display} copied to clipboard`);
    } catch {
      appToast.error("Copy failed", "Couldn't access the clipboard");
    }
  };

  // Close on outside click — the boundary is the whole floating cluster
  // (panel + FAB), so clicking the FAB itself to close the panel doesn't
  // also get treated as an "outside" click that re-toggles it open.
  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  // Keyboard support while open.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (/^[0-9]$/.test(e.key)) return engine.inputDigit(e.key);
      if (e.key === ".") return engine.inputDecimal();
      if (e.key === "+") return engine.performOperation("+");
      if (e.key === "-") return engine.performOperation("−");
      if (e.key === "*") return engine.performOperation("×");
      if (e.key === "/") { e.preventDefault(); return engine.performOperation("÷"); }
      if (e.key === "Enter" || e.key === "=") { e.preventDefault(); return engine.equals(); }
      if (e.key === "Backspace") return engine.backspace();
      if (e.key === "Escape") return setOpen(false);
      if (e.key.toLowerCase() === "c") return engine.clearAll();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, engine.inputDigit, engine.inputDecimal, engine.performOperation, engine.equals, engine.backspace, engine.clearAll]);

  return (
    <div ref={containerRef} className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 print:hidden">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 16 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="w-[300px] rounded-3xl border border-slate-200/70 dark:border-slate-700/60
                       bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-primary">
              <div className="flex items-center gap-2 text-white">
                <Calculator className="h-4 w-4" />
                <span className="text-sm font-semibold tracking-wide">Calculator</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowHistory((v) => !v)}
                  className={`h-7 w-7 flex items-center justify-center rounded-full transition-colors
                    ${showHistory ? "bg-white/25 text-white" : "text-white/80 hover:bg-white/15 hover:text-white"}`}
                  title="History"
                >
                  <History className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="h-7 w-7 flex items-center justify-center rounded-full text-white/80 hover:bg-white/15 hover:text-white transition-colors"
                  title="Close"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* History strip */}
            <AnimatePresence>
              {showHistory && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-b border-slate-200/70 dark:border-slate-700/60"
                >
                  <div className="max-h-32 overflow-y-auto px-4 py-2 space-y-1 bg-slate-50/80 dark:bg-slate-800/50">
                    {engine.history.length === 0 ? (
                      <p className="text-xs text-slate-400 py-2 text-center">No calculations yet</p>
                    ) : (
                      engine.history.map((h, i) => (
                        <button
                          key={i}
                          onClick={() => { engine.useHistoryResult(h.result); setShowHistory(false); }}
                          className="w-full flex items-center justify-between text-left px-2 py-1.5 rounded-lg
                                     hover:bg-white dark:hover:bg-slate-700/60 transition-colors group"
                        >
                          <span className="text-[11px] text-slate-400 truncate">{h.expression}</span>
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 group-hover:text-indigo-600">
                            = {formatDisplay(h.result)}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Display */}
            <div className="px-4 pt-4 pb-3 bg-gradient-to-br from-slate-900 to-slate-800">
              <div className="min-h-[16px] text-right text-[11px] font-medium text-slate-400 truncate">
                {engine.expression || " "}
              </div>
              <button
                onClick={copyResult}
                className="w-full flex items-center justify-end gap-1.5 group"
                title="Click to copy"
              >
                <Copy className="h-3 w-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                <span
                  className="text-right font-semibold text-white tabular-nums truncate"
                  style={{ fontSize: engine.display.length > 9 ? "1.5rem" : "2.25rem", lineHeight: 1.1 }}
                >
                  {engine.display}
                </span>
              </button>
            </div>

            {/* Keypad */}
            <div className="grid grid-cols-4 gap-2 p-3 bg-white dark:bg-slate-900">
              {KEY_ROWS.flat().map((key, i) => (
                <CalcButton key={i} keyDef={key} onPress={() => handleKey(key)} />
              ))}

              {/* Bottom row: 0 (span 2), ., = */}
              <button
                onClick={() => engine.inputDigit("0")}
                className="col-span-2 aspect-[2.15/1] rounded-full flex items-center justify-start pl-6
                           bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-medium text-lg
                           hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition-all"
              >
                0
              </button>
              <button
                onClick={engine.inputDecimal}
                className="aspect-square rounded-full flex items-center justify-center
                           bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-medium text-lg
                           hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition-all"
              >
                .
              </button>
              <button
                onClick={engine.equals}
                className="aspect-square rounded-full flex items-center justify-center
                           bg-gradient-primary text-white font-semibold text-lg shadow-md
                           hover:opacity-90 active:scale-95 transition-all"
              >
                =
              </button>
            </div>

            {/* Backspace footer */}
            <div className="flex justify-center pb-3 bg-white dark:bg-slate-900">
              <button
                onClick={engine.backspace}
                className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <Delete className="h-3 w-3" /> Backspace
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating action button */}
      <motion.button
        onClick={() => setOpen((v) => !v)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        className="h-14 w-14 rounded-full bg-gradient-primary shadow-xl shadow-slate-900/20
                   flex items-center justify-center text-white ring-4 ring-white/40 dark:ring-slate-900/40"
        title="Calculator"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={open ? "close" : "open"}
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {open ? <X className="h-6 w-6" /> : <Calculator className="h-6 w-6" />}
          </motion.span>
        </AnimatePresence>
      </motion.button>
    </div>
  );
}

function CalcButton({ keyDef, onPress }) {
  const isOperator = keyDef.type === "op";
  const isFunction = keyDef.type === "clear" || keyDef.type === "sign" || keyDef.type === "percent";

  return (
    <button
      onClick={onPress}
      className={`aspect-square rounded-full flex items-center justify-center font-medium text-lg
                  active:scale-95 transition-all
        ${isOperator
          ? "bg-gradient-primary text-white shadow-sm hover:opacity-90"
          : isFunction
            ? "bg-slate-200/80 dark:bg-slate-700/80 text-slate-700 dark:text-slate-200 hover:bg-slate-300/80 dark:hover:bg-slate-600/80"
            : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700"
        }`}
    >
      {keyDef.label}
    </button>
  );
}
