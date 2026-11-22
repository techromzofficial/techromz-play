
'use client';

import styles from './InstituteChrome.module.css';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import {
  Menu,
  X,
  ChevronDown,
  Gamepad2,
} from 'lucide-react';
import { INSTITUTE_DEPARTMENT_NAVIGATION } from './institute-navigation';

type NavItem = {
  href: string;
  label: string;
  children?: readonly {
    href: string;
    label: string;
  }[];
};

const links: NavItem[] = [
  {
    href: 'https://techromzit.com/institute/courses',
    label: 'Explore Courses',
    children: [
      {
        href: 'https://techromzit.com/institute/courses',
        label: 'All Courses',
      },
      {
        href: 'https://techromzit.com/institute/learning-tracks',
        label: 'Learning Tracks',
      },
    ],
  },
  {
    href: 'https://techromzit.com/institute/departments',
    label: 'Departments',
    children: [
      {
        href: 'https://techromzit.com/institute/departments',
        label: 'All Departments',
      },
      ...INSTITUTE_DEPARTMENT_NAVIGATION,
    ],
  },
  {
    href: 'https://techromzit.com/institute/community-impact',
    label: 'Community Impact',
  },
  {
    href: 'https://techromzit.com/institute/for-organisations',
    label: 'For Organisations',
  },
  {
    href: 'https://techromzit.com/institute/about',
    label: 'About',
    children: [
      {
        href: 'https://techromzit.com/institute/about',
        label: 'About Us',
      },
      {
        href: 'https://techromzit.com/institute/contact',
        label: 'Contact',
      },
    ],
  },
];

export default function PlayHeader() {
  const pathname = usePathname() ?? '';
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const headerRef = useRef<HTMLElement>(null);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const isGroupActive = (item: NavItem) =>
    isActive(item.href) ||
    Boolean(item.children?.some((child) => isActive(child.href)));

  const closeMenus = () => {
    setOpenMenu(null);
    setMobileOpen(false);
  };

  const toggleMenu = (href: string) => {
    setOpenMenu((current) =>
      current === href ? null : href
    );
  };

  useEffect(() => {
    setOpenMenu(null);
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        headerRef.current &&
        !headerRef.current.contains(event.target as Node)
      ) {
        setOpenMenu(null);
        setMobileOpen(false);
      }
    }

    document.addEventListener('mousedown', handleOutsideClick);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  return (
    <header
      ref={headerRef}
      className={`${styles.chrome} sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur`}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          const nav = (event.target as HTMLElement).closest('nav');
          const trigger = nav?.querySelector<HTMLButtonElement>(
            'button[aria-expanded="true"]'
          );

          if (openMenu) {
            setOpenMenu(null);
            trigger?.focus();
          } else {
            setMobileOpen(false);
          }
        }
      }}
    >
      <div className="mx-auto flex h-24 max-w-7xl items-center justify-between px-4 sm:h-28 sm:px-6 lg:px-8">

        {/* Institute Logo */}
        <Link
          href="https://techromzit.com/"
          className="flex shrink-0 items-center"
          onClick={closeMenus}
          aria-label="Techromz Institute of Technology home"
        >
          <Image
            src="/images/institute/techromz-institute-logo-840.webp"
            alt="Techromz Institute of Technology logo"
            width={840}
            height={480}
            priority
            draggable={false}
            className="h-auto w-[170px] sm:w-[210px]"
          />
        </Link>

        {/* Desktop Navigation */}
        <nav
          className="hidden items-center gap-5 xl:flex"
          aria-label="Institute navigation"
        >
          {links.map((item) =>
            item.children ? (
              <div
                key={item.href}
                className="relative"
              >
                <button
                  type="button"
                  onClick={() => toggleMenu(item.href)}
                  aria-expanded={openMenu === item.href}
                  className={`flex items-center gap-1 whitespace-nowrap rounded-md py-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] ${
                    isGroupActive(item)
                      ? 'text-[#1246AB]'
                      : 'text-slate-600 hover:text-[#1246AB]'
                  }`}
                >
                  {item.label}

                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${
                      openMenu === item.href
                        ? 'rotate-180'
                        : ''
                    }`}
                  />
                </button>

                {openMenu === item.href && (
                  <div className="absolute left-0 top-full w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={closeMenus}
                        aria-current={
                          pathname === child.href
                            ? 'page'
                            : undefined
                        }
                        className={`block rounded-lg px-4 py-3 text-sm font-semibold transition hover:bg-[#EAF1FF] hover:text-[#1246AB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] ${
                          pathname === child.href
                            ? 'bg-[#EAF1FF] text-[#1246AB]'
                            : 'text-slate-700'
                        }`}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMenus}
                aria-current={
                  pathname === item.href ? 'page' : undefined
                }
                className={`whitespace-nowrap text-sm font-semibold transition ${
                  isActive(item.href)
                    ? 'text-[#1246AB]'
                    : 'text-slate-600 hover:text-[#1246AB]'
                }`}
              >
                {item.label}
              </Link>
            )
          )}

          {/* Techromz Play */}
          <Link
            href="/"
            onClick={closeMenus}
            aria-current="page"
            className="ml-6 inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg bg-[#1246AB] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#2563EB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2"
          >
            <Gamepad2 className="h-5 w-5" />
            Techromz Play
          </Link>
        </nav>

        {/* Mobile Menu Button */}
        <button
          type="button"
          className="rounded-md p-2 text-slate-700 xl:hidden"
          onClick={() => {
            setMobileOpen(!mobileOpen);
            setOpenMenu(null);
          }}
          aria-expanded={mobileOpen}
          aria-controls="institute-mobile-navigation"
          aria-label="Toggle navigation"
        >
          {mobileOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {mobileOpen && (
        <nav
          id="institute-mobile-navigation"
          className="max-h-[70vh] overflow-y-auto border-t border-slate-200 bg-white px-4 py-3 xl:hidden"
          aria-label="Mobile institute navigation"
        >
          {links.map((item) => (
            <div key={item.href}>
              {item.children ? (
                <>
                  <button
                    type="button"
                    onClick={() => toggleMenu(item.href)}
                    aria-expanded={openMenu === item.href}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-3 text-left text-sm font-semibold ${
                      isGroupActive(item)
                        ? 'bg-[#EAF1FF] text-[#1246AB]'
                        : 'text-slate-700'
                    }`}
                  >
                    {item.label}

                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${
                        openMenu === item.href
                          ? 'rotate-180'
                          : ''
                      }`}
                    />
                  </button>

                  {openMenu === item.href && (
                    <div className="ml-4 border-l border-slate-200 pl-2">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={closeMenus}
                          className={`block rounded-lg px-3 py-3 text-sm ${
                            pathname === child.href
                              ? 'bg-[#EAF1FF] text-[#1246AB]'
                              : 'text-slate-600'
                          }`}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href={item.href}
                  onClick={closeMenus}
                  className={`block rounded-lg px-3 py-3 text-sm font-semibold ${
                    isActive(item.href)
                      ? 'bg-[#EAF1FF] text-[#1246AB]'
                      : 'text-slate-700'
                  }`}
                >
                  {item.label}
                </Link>
              )}
            </div>
          ))}

          <div className="mt-4 border-t border-slate-200 pt-4">
            <Link
              href="/"
              onClick={closeMenus}
              aria-current="page"
              className="flex items-center justify-center gap-2 rounded-lg bg-[#1246AB] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#2563EB]"
            >
              <Gamepad2 className="h-5 w-5" />
              Techromz Play
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
