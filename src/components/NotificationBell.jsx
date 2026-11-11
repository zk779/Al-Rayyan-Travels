"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import {
  ArrowRight,
  BadgeDollarSign,
  Banknote,
  Bell,
  BellOff,
  BellRing,
  CheckCheck,
  FileStack,
  Hotel,
  Plane,
  Receipt,
  RotateCcw,
  Scale,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import { Button } from "../../shadcn/components/ui/button";
import { Badge } from "../../shadcn/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../shadcn/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../shadcn/components/ui/tooltip";
import { appToast } from "../../shadcn/components/ui/appToast";
import { useAuth } from "../context/AuthContext";
import { useIsAdmin } from "../utils/useIsAdmin";
import { disablePush, enablePush, pushPermission, pushSupported, pushWanted, resumePush } from "../utils/pushNotifications";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const POLL_MS = 30000;

// muted tiles per kind of event
const KINDS = [
  { match: /^SALE_/, icon: Plane, tile: "bg-indigo-50 text-indigo-600 ring-indigo-100" },
  { match: /^HOTEL_/, icon: Hotel, tile: "bg-sky-50 text-sky-600 ring-sky-100" },
  { match: /^VOID_/, icon: Undo2, tile: "bg-rose-50 text-rose-600 ring-rose-100" },
  { match: /^REFUND_/, icon: RotateCcw, tile: "bg-amber-50 text-amber-600 ring-amber-100" },
  { match: /^OTHER_SERVICE_/, icon: FileStack, tile: "bg-violet-50 text-violet-600 ring-violet-100" },
  { match: /^EXPENSE_/, icon: Receipt, tile: "bg-orange-50 text-orange-600 ring-orange-100" },
  { match: /^PAYMENT_/, icon: BadgeDollarSign, tile: "bg-emerald-50 text-emerald-600 ring-emerald-100" },
  { match: /^BALANCE_/, icon: Scale, tile: "bg-slate-100 text-slate-600 ring-slate-200" },
];
const kindOf = (type) => KINDS.find((k) => k.match.test(type)) || { icon: Banknote, tile: "bg-slate-100 text-slate-600 ring-slate-200" };

const ago = (d) => {
  try {
    return formatDistanceToNow(new Date(d), { addSuffix: true });
  } catch {
    return "";
  }
};

/** The header bell for ADMINS: the stored notifications, read / remove, and the push switch. */
export default function NotificationBell() {
  const isAdmin = useIsAdmin();
  const { user } = useAuth();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}`, "Content-Type": "application/json" }), [token]);

  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState(null); // { pushEnabled, instanceId }
  const [pushOn, setPushOn] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [expanded, setExpanded] = useState(() => new Set());
  const alive = useRef(true);

  const userId = user?.id;

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/notifications?limit=100`, { headers });
      const json = await res.json();
      if (!alive.current || !res.ok || !json.success) return;
      setItems(json.data || []);
      setUnread(json.unread || 0);
    } catch {
      /* offline — try again next time */
    } finally {
      if (alive.current) setLoading(false);
    }
  }, [headers]);

  useEffect(() => {
    alive.current = true;
    if (!isAdmin) return undefined;
    load();
    const t = setInterval(load, POLL_MS);
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => {
      alive.current = false;
      clearInterval(t);
      window.removeEventListener("focus", onFocus);
    };
  }, [isAdmin, load]);

  // push set-up: ask the backend whether Beams is configured; if this device was already turned on, re-attach it
  useEffect(() => {
    if (!isAdmin || !userId) return;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/notifications/config`, { headers });
        const json = await res.json();
        if (!json.success) return;
        setConfig(json.data);
        if (json.data.pushEnabled && pushWanted(userId) && pushPermission() === "granted") {
          setPushOn(true);
          resumePush({ instanceId: json.data.instanceId, userId, token }).catch(() => {});
        }
      } catch {
        /* no push */
      }
    })();
  }, [isAdmin, userId, headers, token]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  if (!isAdmin) return null;

  const post = (path, method) => fetch(`${API_BASE}/api/notifications${path}`, { method, headers }).catch(() => {});

  const openItem = async (n) => {
    if (!n.read) {
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      setUnread((u) => Math.max(u - 1, 0));
      post(`/${n.id}/read`, "PUT");
    }
    if (n.link) {
      setOpen(false);
      navigate(n.link);
    }
  };

  const remove = (n) => {
    setItems((prev) => prev.filter((x) => x.id !== n.id));
    if (!n.read) setUnread((u) => Math.max(u - 1, 0));
    post(`/${n.id}`, "DELETE");
  };
  const readAll = () => {
    setItems((prev) => prev.map((x) => ({ ...x, read: true })));
    setUnread(0);
    post("/read-all", "PUT");
  };
  const clearAll = () => {
    setItems([]);
    setUnread(0);
    post("", "DELETE");
  };
  const toggleExpand = (id) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const togglePush = async () => {
    if (!config?.pushEnabled) return;
    setPushBusy(true);
    try {
      if (pushOn) {
        await disablePush({ instanceId: config.instanceId, userId });
        setPushOn(false);
        appToast.success("Push notifications are off on this device");
      } else {
        await enablePush({ instanceId: config.instanceId, userId, token });
        setPushOn(true);
        appToast.success("Push notifications are on for this device");
      }
    } catch (err) {
      appToast.error(err.message || "Could not change push notifications");
    } finally {
      setPushBusy(false);
    }
  };

  const blocked = pushSupported() && pushPermission() === "denied";

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="relative" onClick={() => setOpen(true)} aria-label="Notifications" data-testid="bell">
            <Bell className="h-6 w-6" />
            {unread > 0 && (
              <Badge variant="destructive" className="absolute -right-0 -top-0 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px]" data-testid="bell-count">
                {unread > 9 ? "9+" : unread}
              </Badge>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>Notifications</TooltipContent>
      </Tooltip>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex max-h-[85vh] flex-col gap-0 p-0 sm:max-w-xl">
          <DialogHeader className="border-b border-slate-100 px-5 py-4">
            <div className="flex items-center justify-between gap-3 pr-6">
              <div>
                <DialogTitle className="flex items-center gap-2 text-lg">
                  <BellRing className="h-5 w-5 text-slate-500" /> Notifications
                  {unread > 0 && <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[11px] font-semibold text-white">{unread} new</span>}
                </DialogTitle>
                <DialogDescription className="mt-0.5 text-xs">What was created or changed in the system.</DialogDescription>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs" onClick={readAll} disabled={unread === 0}>
                  <CheckCheck className="h-3.5 w-3.5" /> Mark all read
                </Button>
                <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs text-rose-600 hover:text-rose-700" onClick={clearAll} disabled={items.length === 0}>
                  <Trash2 className="h-3.5 w-3.5" /> Clear all
                </Button>
              </div>
            </div>
          </DialogHeader>

          {config?.pushEnabled && (
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-2.5" data-testid="push-row">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                {pushOn ? <BellRing className="h-4 w-4 text-emerald-600" /> : <BellOff className="h-4 w-4 text-slate-400" />}
                <span>
                  {!pushSupported()
                    ? "This browser can't show push notifications."
                    : blocked
                      ? "Blocked in the browser settings for this site."
                      : pushOn
                        ? "Push notifications are on for this device."
                        : "Get these as push notifications on this device."}
                </span>
              </div>
              {pushSupported() && !blocked && (
                <Button size="sm" variant={pushOn ? "outline" : "default"} className="h-8 text-xs" onClick={togglePush} disabled={pushBusy}>
                  {pushBusy ? "Please wait…" : pushOn ? "Turn off" : "Turn on"}
                </Button>
              )}
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto" data-testid="notification-list">
            {loading && items.length === 0 && <p className="px-5 py-10 text-center text-sm text-slate-400">Loading…</p>}
            {!loading && items.length === 0 && (
              <div className="px-5 py-14 text-center">
                <Bell className="mx-auto h-9 w-9 text-slate-200" />
                <p className="mt-2 text-sm font-medium text-slate-500">You're all caught up</p>
                <p className="text-xs text-slate-400">New sales, payments, expenses and changes will show up here.</p>
              </div>
            )}
            <ul className="divide-y divide-slate-100">
              {items.map((n) => {
                const k = kindOf(n.type);
                const isOpen = expanded.has(n.id);
                const hasMore = (n.details?.length || 0) > 0 || (n.changes?.length || 0) > 3;
                return (
                  <li key={n.id} className={`group relative flex gap-3 px-5 py-3.5 transition-colors ${n.read ? "bg-white" : "bg-slate-50/80"}`} data-testid="notification">
                    {!n.read && <span className="absolute left-2 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-indigo-500" aria-label="Unread" />}
                    <span className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl ring-1 ${k.tile}`}>
                      <k.icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-3">
                        <button type="button" onClick={() => openItem(n)} className="truncate text-left text-sm font-semibold text-slate-900 hover:underline">
                          {n.title}
                        </button>
                        <span className="shrink-0 text-[11px] text-slate-400">{ago(n.createdAt)}</span>
                      </div>
                      <p className="mt-0.5 text-[13px] leading-snug text-slate-600">{n.message}</p>

                      {n.changes?.length > 0 && (
                        <ul className="mt-2 space-y-1 rounded-lg bg-white p-2 ring-1 ring-slate-200/70" data-testid="changes">
                          {(isOpen ? n.changes : n.changes.slice(0, 3)).map((c, i) => (
                            <li key={i} className="flex flex-wrap items-center gap-x-1.5 text-xs text-slate-600">
                              <span className="font-medium text-slate-800">{c.field}:</span>
                              <span className="text-slate-400 line-through decoration-slate-300">{c.from}</span>
                              <ArrowRight className="h-3 w-3 text-slate-400" />
                              <span className="font-semibold text-slate-900">{c.to}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      {isOpen && n.details?.length > 0 && (
                        <ul className="mt-2 space-y-0.5 text-xs text-slate-500" data-testid="details">
                          {n.details.map((d, i) => (
                            <li key={i}>{d}</li>
                          ))}
                        </ul>
                      )}

                      <div className="mt-1.5 flex items-center gap-3 text-[11px] text-slate-400">
                        {n.actorName && <span>by {n.actorName}</span>}
                        {hasMore && (
                          <button type="button" onClick={() => toggleExpand(n.id)} className="font-medium text-slate-500 hover:text-slate-800">
                            {isOpen ? "Show less" : "Show details"}
                          </button>
                        )}
                        {n.link && (
                          <button type="button" onClick={() => openItem(n)} className="font-medium text-indigo-600 hover:text-indigo-800">
                            Open
                          </button>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(n)}
                      aria-label="Remove notification"
                      title="Remove"
                      className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg text-slate-300 transition-colors hover:bg-rose-50 hover:text-rose-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
