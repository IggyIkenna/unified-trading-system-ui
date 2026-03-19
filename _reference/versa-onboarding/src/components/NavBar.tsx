"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { firebaseAuth, firestore } from "@/lib/firebaseClient";
import { useAuthUser } from "@/lib/useAuth";

type Presentation = {
  id: string;
  title: string;
};

const navLinks = [
  { href: "/#overview", label: "Business" },
  { href: "/#team", label: "Team" },
  { href: "/#board", label: "Board" },
  { href: "/#approach", label: "Approach" },
  { href: "/#careers", label: "Careers" },
  { href: "/#contact", label: "Contact" },
];

export default function NavBar() {
  const { user, loading } = useAuthUser();
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Only fetch presentations when user is authenticated and not loading
    if (loading || !user) {
      setPresentations([]);
      setIsAdmin(false);
      return;
    }

    let cancelled = false;
    const loadPresentations = async () => {
      try {
        const response = await fetch("/api/presentations", {
          credentials: "include",
        });

        if (cancelled) return;

        if (!response.ok) {
          // 401 is expected when not authenticated - handle silently
          if (response.status === 401) {
            setPresentations([]);
            return;
          }
          // Only log unexpected errors
          console.error(
            "[NavBar] Presentations fetch failed:",
            response.status,
          );
          return;
        }

        const data = (await response.json()) as {
          presentations: Presentation[];
        };

        if (!cancelled) {
          setPresentations(data.presentations || []);
        }
      } catch (_error) {
        // Silently handle network errors - don't spam console
        if (!cancelled) {
          setPresentations([]);
        }
      }
    };

    loadPresentations();

    return () => {
      cancelled = true;
    };
  }, [user, loading]);

  useEffect(() => {
    if (!user) return;
    const loadRole = async () => {
      const userSnap = await getDoc(doc(firestore, "users", user.uid));
      const role = userSnap.data()?.role;
      setIsAdmin(role === "admin");
    };
    loadRole();
  }, [user]);

  const handleLogout = async () => {
    await signOut(firebaseAuth);
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    window.location.href = "/";
  };

  const closeMobile = () => setMobileOpen(false);

  useEffect(() => {
    if (mobileOpen) {
      const scrollY = window.scrollY;
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = "0";
      document.body.style.right = "0";
      return () => {
        document.documentElement.style.overflow = "";
        document.body.style.overflow = "";
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.left = "";
        document.body.style.right = "";
        window.scrollTo(0, scrollY);
      };
    }
    return () => {};
  }, [mobileOpen]);

  const navLinkClass = "text-neutral-600 hover:text-black transition-colors";
  const navLinkClassMobile =
    "block py-3 text-base font-medium text-neutral-700 hover:text-black border-b border-neutral-100 last:border-0";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 w-full border-b border-neutral-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 sm:gap-3 text-lg font-semibold tracking-tight text-black sm:text-xl"
        >
          <img
            src="https://static.wixstatic.com/media/75b7b3_c007ca3165df412b9835bb9f493850fc~mv2.png/v1/fill/w_158,h_160,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/download%20(2).png"
            alt="Odum Research logo"
            className="h-8 w-8 rounded-full border border-neutral-200 object-cover sm:h-10 sm:w-10"
          />
          <span>Odum Research</span>
        </Link>

        {/* Desktop navigation */}
        <div className="hidden lg:flex items-center gap-1 xl:gap-2 text-sm">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`px-2 py-1 rounded ${navLinkClass}`}
            >
              {label}
            </Link>
          ))}
          {!loading && user && (
            <Link
              href="/portal"
              className={`px-2 py-1 rounded ${navLinkClass}`}
            >
              Presentations
            </Link>
          )}
          {!loading && user && presentations.length > 0 && (
            <div className="relative ml-1">
              <select
                className="rounded border border-neutral-300 bg-white px-2 py-1.5 text-sm min-w-[140px] cursor-pointer text-neutral-900 appearance-none"
                style={{ color: "inherit" }}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value) window.location.href = `/presentations/${value}`;
                }}
                defaultValue=""
                title="Open a presentation"
              >
                <option value="" disabled>
                  Open…
                </option>
                {presentations.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
          )}
          {!loading && user && isAdmin && (
            <Link href="/admin" className={`px-2 py-1 rounded ${navLinkClass}`}>
              Admin
            </Link>
          )}
          {!loading && !user && (
            <>
              <Link
                href="/login"
                className="rounded border border-neutral-300 px-3 py-1.5 text-neutral-700 hover:border-black hover:text-black ml-2"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded bg-black px-3 py-1.5 text-white hover:bg-neutral-800 ml-1"
              >
                Register
              </Link>
            </>
          )}
          {!loading && user && (
            <button
              type="button"
              onClick={handleLogout}
              className="rounded border border-neutral-300 px-3 py-1.5 text-neutral-700 hover:border-black hover:text-black ml-2"
            >
              Log out
            </button>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setMobileOpen((o) => !o)}
          className="flex lg:hidden items-center justify-center w-10 h-10 rounded-lg text-neutral-600 hover:bg-neutral-100 hover:text-black transition-colors"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? (
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu overlay & panel - rendered via portal to avoid stacking/overflow issues */}
      {mounted &&
        createPortal(
          <>
            <div
              className={`fixed inset-0 top-[53px] sm:top-[60px] z-[100] bg-black/20 transition-opacity duration-300 lg:hidden ${mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
              onClick={closeMobile}
              aria-hidden="true"
            />
            <div
              className={`fixed top-[53px] sm:top-[60px] right-0 bottom-0 z-[101] w-[min(100%,24rem)] max-w-[85vw] bg-white shadow-2xl lg:hidden overflow-y-auto transition-transform duration-300 ease-out ${mobileOpen ? "translate-x-0" : "translate-x-full"}`}
            >
              <div className="flex flex-col px-4 py-4">
                {navLinks.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={closeMobile}
                    className={navLinkClassMobile}
                  >
                    {label}
                  </Link>
                ))}
                {!loading && user && (
                  <Link
                    href="/portal"
                    onClick={closeMobile}
                    className={navLinkClassMobile}
                  >
                    Presentations
                  </Link>
                )}
                {!loading && user && presentations.length > 0 && (
                  <div className="py-3 border-b border-neutral-100">
                    <label className="block text-xs font-medium text-neutral-700 mb-2">
                      Open a presentation
                    </label>
                    <select
                      className="w-full rounded border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900"
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value)
                          window.location.href = `/presentations/${value}`;
                      }}
                      defaultValue=""
                    >
                      <option value="" disabled>
                        Select presentation
                      </option>
                      {presentations.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {!loading && user && isAdmin && (
                  <Link
                    href="/admin"
                    onClick={closeMobile}
                    className={navLinkClassMobile}
                  >
                    Admin
                  </Link>
                )}
                {!loading && !user && (
                  <div className="flex flex-col gap-3 pt-4 border-t border-neutral-100">
                    <Link
                      href="/login"
                      onClick={closeMobile}
                      className="rounded border border-neutral-300 px-4 py-3 text-center font-medium text-neutral-700 hover:border-black hover:text-black"
                    >
                      Log in
                    </Link>
                    <Link
                      href="/register"
                      onClick={closeMobile}
                      className="rounded bg-black px-4 py-3 text-center font-medium text-white hover:bg-neutral-800"
                    >
                      Register
                    </Link>
                  </div>
                )}
                {!loading && user && (
                  <button
                    type="button"
                    onClick={() => {
                      handleLogout();
                      closeMobile();
                    }}
                    className="mt-4 rounded border border-neutral-300 px-4 py-3 text-center font-medium text-neutral-700 hover:border-black hover:text-black w-full"
                  >
                    Log out
                  </button>
                )}
              </div>
            </div>
          </>,
          document.body,
        )}
    </nav>
  );
}
