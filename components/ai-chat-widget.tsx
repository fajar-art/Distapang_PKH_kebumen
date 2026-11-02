"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Send, X, Sparkles, ArrowRight } from "lucide-react";
import { getAuthSession, checkModuleAccess, checkSubmenuAccess } from "@/lib/auth";

type PageLinkInfo = {
  moduleKey: "bitpro" | "keswan" | "kesmavet" | "aset" | "admin";
  submenuKey: string;
  label: string;
  href: string;
  adminOnly?: boolean;
  searchQuery?: string;
};

type Message = {
  role: "user" | "assistant";
  content: string;
  pageLink?: PageLinkInfo | null;
};

export default function AiChatWidget() {
  const pathname = usePathname();
  const router = useRouter();
  const [canAccessWidget, setCanAccessWidget] = useState(false);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Halo! Saya asisten data SiMantap. Anda dapat menanyakan ringkasan populasi ternak, sebaran farm, atau data produksi di Kebumen.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  // State & Ref untuk Floating Launcher (Tombol Maskot) yang bisa digeser
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const launcherDragMovedRef = useRef(false);
  const launcherDragDataRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    initX: number;
    initY: number;
    startTime: number;
  } | null>(null);
  const lastToggleTimeRef = useRef(0);

  const chatBoxRef = useRef<HTMLDivElement>(null);

  // Fungsi toggle pembuka jendela chat dengan proteksi debounce (mengatasi konflik tap pada Firefox Mobile)
  const toggleChat = () => {
    const now = Date.now();
    if (now - lastToggleTimeRef.current < 350) return;
    lastToggleTimeRef.current = now;
    setOpen((prev) => !prev);
  };

  // Handler Pointer untuk Tombol Maskot Draggable (Unifikasi Mouse & Touch untuk Firefox, Chrome, HP & Desktop)
  const handleLauncherPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    if (!launcherRef.current) return;
    const rect = launcherRef.current.getBoundingClientRect();
    launcherDragMovedRef.current = false;
    launcherDragDataRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      initX: rect.left,
      initY: rect.top,
      startTime: Date.now(),
    };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
  };

  const handleLauncherPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!launcherDragDataRef.current || launcherDragDataRef.current.pointerId !== e.pointerId) return;
    const dx = e.clientX - launcherDragDataRef.current.startX;
    const dy = e.clientY - launcherDragDataRef.current.startY;
    const dist = Math.hypot(dx, dy);

    // Ambang batas geser 10px: toleran terhadap getaran jari di HP / Firefox touch emulation
    if (dist > 10) {
      launcherDragMovedRef.current = true;
      const widgetSize = 74;
      const newX = Math.max(10, Math.min(window.innerWidth - widgetSize - 10, launcherDragDataRef.current.initX + dx));
      const newY = Math.max(20, Math.min(window.innerHeight - widgetSize - 10, launcherDragDataRef.current.initY + dy));
      setDragPos({ x: newX, y: newY });
    }
  };

  const handleLauncherPointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!launcherDragDataRef.current || launcherDragDataRef.current.pointerId !== e.pointerId) return;
    const dx = e.clientX - launcherDragDataRef.current.startX;
    const dy = e.clientY - launcherDragDataRef.current.startY;
    const dist = Math.hypot(dx, dy);
    const elapsed = Date.now() - launcherDragDataRef.current.startTime;

    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {}

    launcherDragDataRef.current = null;

    // Jika digeser <= 10px dan durasi < 500ms, ini adalah ketukan (tap / klik) yang valid!
    if (!launcherDragMovedRef.current && dist <= 10 && elapsed < 500) {
      toggleChat();
      setTimeout(() => {
        launcherDragMovedRef.current = false;
      }, 200);
    } else {
      setTimeout(() => {
        launcherDragMovedRef.current = false;
      }, 200);
    }
  };

  const handleLauncherClick = () => {
    if (launcherDragMovedRef.current) {
      launcherDragMovedRef.current = false;
      return;
    }
    toggleChat();
  };



  // Pantau perubahan ukuran layar (Responsive Viewport Resize)
  useEffect(() => {
    const handleResize = () => {
      if (typeof window === "undefined") return;
      setDragPos((prev) => {
        if (!prev) return null;
        return {
          x: Math.max(10, Math.min(window.innerWidth - 76, prev.x)),
          y: Math.max(20, Math.min(window.innerHeight - 76, prev.y)),
        };
      });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Menghitung letak jendela chat cerdas agar TIDAK PERNAH menutupi tombol/logo maskot
  const getPopupStyle = () => {
    if (typeof window === "undefined") return undefined;

    const isMobile = window.innerWidth < 640;
    const popupWidth = isMobile ? window.innerWidth - 24 : 400;
    const popupHeight = isMobile ? Math.min(520, window.innerHeight - 100) : 520;
    const widgetSize = isMobile ? 64 : 76;
    const gap = 14;

    // 1. TAMPILAN MOBILE (< 640px):
    if (isMobile) {
      // Jika tombol maskot pernah digeser di HP:
      if (dragPos) {
        const screenH = window.innerHeight;
        // Jika maskot di separuh bawah layar -> buka jendela chat di bagian atas layar agar logo tidak tertutup
        if (dragPos.y > screenH / 2) {
          return {
            top: "16px",
            bottom: "auto",
            left: "12px",
            right: "12px",
            maxHeight: `${Math.max(380, dragPos.y - gap - 16)}px`,
          };
        } else {
          // Jika maskot di separuh atas layar -> buka jendela chat di bagian bawah layar agar logo tidak tertutup
          const startY = dragPos.y + widgetSize + gap;
          return {
            top: `${startY}px`,
            bottom: "16px",
            left: "12px",
            right: "12px",
            maxHeight: `${Math.max(380, screenH - startY - 16)}px`,
          };
        }
      }
      // Posisi default mobile (saat belum digeser):
      // Chat di atas tombol maskot (bottom-24) sehingga tombol maskot (bottom-4) tidak tertutup
      return undefined;
    }

    // 2. TAMPILAN DESKTOP (>= 640px):
    // Jendela chat selalu mengikuti posisi tombol maskot (tidak terpisah sendiri)
    if (dragPos) {
      const wx = dragPos.x;
      const wy = dragPos.y;

      const spaceAbove = wy - 14;
      const spaceBelow = window.innerHeight - (wy + widgetSize) - 14;

      let top: number;
      let left: number;

      if (spaceAbove >= popupHeight) {
        // Pilihan A: Buka di ATAS maskot (Zero overlap, logo terlihat bebas di bawah)
        top = wy - popupHeight - gap;
        left = wx + widgetSize - popupWidth;
        left = Math.max(12, Math.min(window.innerWidth - popupWidth - 12, left));
      } else if (spaceBelow >= popupHeight) {
        // Pilihan B: Buka di BAWAH maskot (Zero overlap, logo terlihat bebas di atas)
        top = wy + widgetSize + gap;
        left = wx + widgetSize - popupWidth;
        left = Math.max(12, Math.min(window.innerWidth - popupWidth - 12, left));
      } else {
        // Pilihan C: Ruang atas & bawah tidak muat -> Buka di SAMPING KIRI atau KANAN maskot
        if (wx + widgetSize / 2 >= window.innerWidth / 2) {
          // Maskot di sisi kanan -> Jendela chat di sebelah KIRI maskot
          left = wx - popupWidth - gap;
          left = Math.max(12, left);
        } else {
          // Maskot di sisi kiri -> Jendela chat di sebelah KANAN maskot
          left = wx + widgetSize + gap;
          left = Math.min(window.innerWidth - popupWidth - 12, left);
        }
        // Pastikan batas vertikal tetap di dalam layar
        top = Math.max(14, Math.min(window.innerHeight - popupHeight - 14, wy - popupHeight / 2 + widgetSize / 2));
      }

      return {
        top: `${top}px`,
        left: `${left}px`,
        right: "auto",
        bottom: "auto",
      };
    }

    // Default posisi awal desktop
    return undefined;
  };

  // Verifikasi Hak Akses: Hanya tampilkan widget untuk Administrator, Tim Bitpro, Tim Keswan, dan Tim Kesmavet
  useEffect(() => {
    if (pathname !== "/beranda") {
      setCanAccessWidget(false);
      return;
    }

    const session = getAuthSession();
    if (!session) {
      setCanAccessWidget(false);
      return;
    }

    const role = (session.role || "").toLowerCase();
    const nama = (session.nama || "").toLowerCase();

    // 1. Petugas Lapangan & Puskeswan DILARANG akses widget AI
    if (role.includes("lapangan") || nama.includes("puskeswan")) {
      setCanAccessWidget(false);
      return;
    }

    // 2. Administrator, Tim Bitpro, Tim Keswan, Tim Kesmavet DIIZINKAN akses
    const isAdmin = role.includes("admin") || nama.includes("admin");
    const isBitpro = session.permissions?.bitpro?.enabled === true;
    const isKeswan = session.permissions?.keswan?.enabled === true;
    const isKesmavet = session.permissions?.kesmavet?.enabled === true;

    if (isAdmin || isBitpro || isKeswan || isKesmavet) {
      setCanAccessWidget(true);
    } else {
      setCanAccessWidget(false);
    }
  }, [pathname]);

  useEffect(() => {
    if (open) {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  // Cek apakah pengguna yang sedang login memiliki hak akses RBAC ke halaman terkait
  function canUserAccessPageLink(pageLink?: PageLinkInfo | null): boolean {
    if (!pageLink) return false;
    const session = getAuthSession();
    if (!session) return false;

    if (pageLink.adminOnly || pageLink.moduleKey === "admin") {
      return (session.role || "").toLowerCase() === "administrator";
    }

    return (
      checkModuleAccess(pageLink.moduleKey) &&
      checkSubmenuAccess(pageLink.moduleKey, pageLink.submenuKey)
    );
  }

  // Terapkan filter / pencarian kata kunci ke dalam dokumen halaman (mendukung iframe maupun halaman langsung)
  function applyFilterToDoc(doc: Document, searchQuery: string, submenuKey: string): boolean {
    if (!searchQuery) return false;
    const qClean = searchQuery.trim();
    const qUpper = qClean.toUpperCase();
    const qLower = qClean.toLowerCase();
    let applied = false;

    // 1. Khusus Database KTT: jika kata kunci cocok dengan tombol kecamatan di sidebar
    if (submenuKey === "database-ktt") {
      const allButtons = Array.from(doc.querySelectorAll<HTMLButtonElement>("aside button, button"));
      const kecButton = allButtons.find((btn) => {
        const text = (btn.textContent || "").trim().toUpperCase();
        return text.includes(qUpper) && !text.includes("SEMUA WILAYAH");
      });
      if (kecButton) {
        kecButton.click();
        applied = true;
      }
    }

    // 2. Khusus Sebaran Farm: jika kata kunci cocok dengan tab komoditas (broiler, petelur, kambing, sapi, dll)
    if (submenuKey === "data-farm") {
      const allButtons = Array.from(doc.querySelectorAll<HTMLButtonElement>("button"));
      const farmTab = allButtons.find((btn) => {
        const text = (btn.textContent || "").trim().toLowerCase();
        return text.includes(qLower);
      });
      if (farmTab) {
        farmTab.click();
        applied = true;
      }
    }

    // 3. Khusus SKLB: jika kata kunci rekapitulasi timur / barat
    if (submenuKey === "sklb") {
      if (qLower.includes("timur") || qLower.includes("barat") || qLower.includes("grup")) {
        const rekapTab = Array.from(doc.querySelectorAll<HTMLButtonElement>("button")).find((btn) => {
          const text = (btn.textContent || "").toLowerCase();
          return text.includes("rekap") || text.includes("rekapitulasi");
        });
        if (rekapTab) {
          rekapTab.click();
          applied = true;
        }
      }
    }

    // 4. Input Pencarian Tabel (Search Bar)
    const inputs = Array.from(
      doc.querySelectorAll<HTMLInputElement>('input[type="text"], input[type="search"]')
    );
    const searchInput =
      inputs.find((inp) => {
        const ph = (inp.placeholder || "").toLowerCase();
        const idOrClass = ((inp.id || "") + " " + (inp.className || "")).toLowerCase();
        return ph.includes("cari") || ph.includes("search") || idOrClass.includes("search");
      }) || (inputs.length === 1 ? inputs[0] : null);

    if (searchInput) {
      const nativeSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value"
      )?.set;
      if (nativeSetter) {
        nativeSetter.call(searchInput, qClean);
      } else {
        searchInput.value = qClean;
      }
      searchInput.dispatchEvent(new Event("input", { bubbles: true }));
      searchInput.dispatchEvent(new Event("change", { bubbles: true }));
      try {
        searchInput.focus();
      } catch {}
      applied = true;
    }

    return applied;
  }

  // Picu pencarian data otomatis secara berkala hingga dokumen target selesai merender
  function triggerAutoFilter(searchQuery: string, submenuKey: string) {
    if (!searchQuery) return;

    try {
      sessionStorage.setItem(
        "simantap_ai_pending_search",
        JSON.stringify({ query: searchQuery, submenuKey, ts: Date.now() })
      );
    } catch {}

    let attempts = 0;
    const maxAttempts = 25; // 25 x 150ms = ~3.75 detik

    const intervalId = setInterval(() => {
      attempts++;
      let done = false;

      // Cek di dalam iframe dashboard /beranda
      const iframe = document.querySelector("iframe") as HTMLIFrameElement | null;
      if (iframe && iframe.contentDocument) {
        try {
          done = applyFilterToDoc(iframe.contentDocument, searchQuery, submenuKey);
        } catch {}
      }

      // Cek di main document (jika bukan iframe)
      if (!done) {
        try {
          done = applyFilterToDoc(document, searchQuery, submenuKey);
        } catch {}
      }

      if (done || attempts >= maxAttempts) {
        clearInterval(intervalId);
      }
    }, 150);
  }

  // Pantau perpindahan rute untuk mengeksekusi pencarian yang tertunda
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("simantap_ai_pending_search");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Date.now() - parsed.ts < 12000) {
          triggerAutoFilter(parsed.query, parsed.submenuKey);
        } else {
          sessionStorage.removeItem("simantap_ai_pending_search");
        }
      }
    } catch {}
  }, [pathname]);

  // Navigasi ke halaman data sesuai mekanisme dashboard /beranda dan langsung menampilkan data yang dicari
  function handleNavigateToPage(pageLink: PageLinkInfo) {
    if (!canUserAccessPageLink(pageLink)) return;

    if (pageLink.searchQuery) {
      triggerAutoFilter(pageLink.searchQuery, pageLink.submenuKey);
    }

    if (pageLink.moduleKey !== "admin" && pathname === "/beranda") {
      try {
        const url = new URL(window.location.href);
        url.searchParams.set("tab", pageLink.submenuKey);
        if (pageLink.searchQuery) {
          url.searchParams.set("search", pageLink.searchQuery);
        }
        window.history.pushState({ tab: pageLink.submenuKey }, "", url.toString());
        window.dispatchEvent(new PopStateEvent("popstate"));
        return;
      } catch {}
    }

    router.push(pageLink.href);
  }

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const newMessages: Message[] = [...messages, { role: "user", content: input.trim() }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply,
          pageLink: data.pageLink || null,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Maaf, koneksi ke asisten sedang mengalami gangguan. Silakan coba kembali sesaat lagi.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  // Hanya tampilkan widget AI Chat di Dashboard ('/beranda') dan khusus akun yang berhak
  if (pathname !== "/beranda" || !canAccessWidget) {
    return null;
  }

  return (
    <>
      {/* 1. Tombol Pembuka Chat: Maskot Animasi Murni Tanpa Background & Border (Bisa Digeser) */}
      <button
        ref={launcherRef}
        type="button"
        onPointerDown={handleLauncherPointerDown}
        onPointerMove={handleLauncherPointerMove}
        onPointerUp={handleLauncherPointerUp}
        onPointerCancel={handleLauncherPointerUp}
        onClick={handleLauncherClick}
        aria-label={open ? "Tutup Asisten AI SiMantap (MoosAI)" : "Buka Asisten AI SiMantap (MoosAI)"}
        title="MoosAI - Klik untuk membuka chat, tahan & geser untuk memindahkan"
        style={
          dragPos
            ? {
                left: `${dragPos.x}px`,
                top: `${dragPos.y}px`,
                right: "auto",
                bottom: "auto",
              }
            : undefined
        }
        className={`fixed ${
          !dragPos ? "bottom-4 right-4 sm:bottom-7 sm:right-7" : ""
        } z-[60] w-16 h-16 sm:w-20 sm:h-20 bg-transparent border-none p-0 flex items-center justify-center cursor-grab active:cursor-grabbing focus-visible:outline-none select-none touch-none filter drop-shadow-[0_8px_20px_rgba(33,146,255,0.35)] hover:scale-105 active:scale-95 transition-transform duration-150`}
      >
        <div className="relative w-full h-full flex items-center justify-center pointer-events-none select-none">
          <iframe
            src="/simantap-maskot.svg"
            className="w-full h-full border-none pointer-events-none bg-transparent"
            style={{ transform: "scale(1.9) translateY(-2px)" }}
            tabIndex={-1}
            aria-hidden="true"
          />
          {/* Lapisan transparan pelindung iframe agar klik dan sentuhan pada Firefox / HP tidak tertelan oleh iframe */}
          <div className="absolute inset-0 z-10 bg-transparent pointer-events-none" />
        </div>

        {/* Teks MoosAI (Kiri) sejajar dengan Titik Hijau / Tombol X (Kanan) di Kanan Atas Widget */}
        <div className="absolute top-0.5 right-0.5 sm:top-1.5 sm:right-1 z-20 flex items-center gap-1 pointer-events-none select-none">
          <span className="text-[10px] sm:text-xs font-bold tracking-tight select-none pointer-events-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] whitespace-nowrap">
            <span className="text-azure dark:text-sky-400">Moos</span>
            <span className="text-emerald-500 dark:text-lime">AI</span>
          </span>
          {!open ? (
            <span
              className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-lime border-2 border-white dark:border-zinc-950 shadow-sm animate-pulse"
              title="Sistem SiMantap Aktif"
            />
          ) : (
            <span
              className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-slate-900/85 dark:bg-white/90 text-white dark:text-zinc-900 flex items-center justify-center text-[8px] sm:text-[9px] font-bold shadow-md"
              title="Klik untuk menutup"
            >
              ✕
            </span>
          )}
        </div>
      </button>

      {/* 2. KOTAK UTAMA POPUP CHAT (Mengikuti Gerakan Maskot Logo) */}
      {open && (
        <div
          ref={chatBoxRef}
          style={getPopupStyle()}
          className={`fixed ${
            !dragPos ? "inset-x-3 bottom-24 sm:inset-x-auto sm:right-7 sm:bottom-28" : ""
          } z-50 w-auto sm:w-[400px] h-[520px] max-h-[82vh] rounded-2xl bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-zinc-800 shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200`}
        >
          
          {/* 3. HEADER POPUP */}
          <div className="px-5 py-3.5 bg-slate-50/90 dark:bg-zinc-900/90 border-b border-slate-200/80 dark:border-zinc-800 flex items-center justify-between select-none">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-azure/15 border border-azure/30 flex items-center justify-center text-azure">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-slate-900 dark:text-white tracking-tight">
                  Asisten Data SiMantap
                </h3>
                <p className="text-xs text-emerald-600 dark:text-lime font-mono flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-lime animate-pulse" />
                  Sistem Aktif
                </p>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
              }}
              aria-label="Tutup jendela chat"
              className="w-8 h-8 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-zinc-800 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 4. AREA ISI CHAT (Conversation History) — Ubah bg-transparent jika ingin memberi warna khusus di tengah */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3.5 text-sm leading-relaxed bg-transparent">
            {messages.map((m, i) => {
              const showPageButton =
                m.role === "assistant" && canUserAccessPageLink(m.pageLink);

              return (
                <div
                  key={i}
                  className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
                >
                  {m.role === "assistant" ? (
                    <div className="flex items-start gap-2 max-w-[92%]">
                      {/* Animasi Maskot Murni: Tanpa Lingkaran, Tanpa Background, Aman Gelap & Terang */}
                      <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center -mt-1 select-none pointer-events-none">
                        <iframe
                          src="/simantap-maskot.svg"
                          className="w-full h-full border-none pointer-events-none bg-transparent"
                          style={{ transform: "scale(1.85) translateY(-2px)" }}
                          tabIndex={-1}
                          aria-hidden="true"
                        />
                      </div>

                      {/* Balon Chat AI: Latar Netral Lembut, Teks Kontras, Sudut Atas-Kiri Lancip Mengarah ke Maskot */}
                      <div className="flex-1 px-4 py-3 rounded-2xl rounded-tl-none text-sm leading-relaxed whitespace-pre-line bg-slate-100 text-slate-800 dark:bg-zinc-900 dark:text-slate-100 border border-slate-200/90 dark:border-zinc-800 shadow-sm font-normal">
                        {m.content} 

                        {/* Tombol Pintas Halaman Data */}
                        {showPageButton && m.pageLink && (
                          <div className="mt-2.5 pt-2 border-t border-slate-200/80 dark:border-zinc-800">
                            <button
                              type="button"
                              onClick={() => handleNavigateToPage(m.pageLink!)}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-azure dark:text-sky-400 hover:underline focus:outline-none"
                            >
                              <span>Lihat {m.pageLink.label}{m.pageLink.searchQuery ? ` (${m.pageLink.searchQuery})` : ""}</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Balon Chat User: Latar Azure Blue, Teks Putih, Sudut Bawah-Kanan Lancip */
                    <div className="max-w-[85%] px-4 py-3 rounded-2xl rounded-br-none text-sm leading-relaxed whitespace-pre-line bg-azure text-white border border-blue-600/70 dark:border-blue-500/50 shadow-sm font-medium">
                      {m.content}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Indikator Loading */}
            {loading && (
              <div className="flex items-start gap-2 max-w-[92%]">
                <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center -mt-1 select-none pointer-events-none">
                  <iframe
                    src="/simantap-maskot.svg"
                    className="w-full h-full border-none pointer-events-none bg-transparent"
                    style={{ transform: "scale(1.85) translateY(-2px)" }}
                    tabIndex={-1}
                    aria-hidden="true"
                  />
                </div>
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl rounded-tl-none bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-slate-300 text-xs w-fit shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-azure animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-vitality animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 rounded-full bg-lime animate-bounce [animation-delay:0.4s]" />
                  <span className="font-medium ml-1">Mencari data dinas...</span>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* 6. AREA INPUT PESAN BAWAH */}
          <div className="p-3 bg-slate-50/80 dark:bg-zinc-900/80 border-t border-slate-200/80 dark:border-zinc-800 flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Tanyakan data peternakan..."
              className="flex-1 bg-white/90 dark:bg-zinc-950/90 border border-slate-300 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-azure transition-colors"
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              aria-label="Kirim pertanyaan"
              className="min-w-touch min-h-touch h-10 w-10 rounded-xl bg-azure text-white flex items-center justify-center hover:bg-azure/90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}