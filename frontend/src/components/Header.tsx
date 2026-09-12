"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Search,
  UserRound,
  Heart,
  ShoppingBag,
  Menu,
  X,
} from "lucide-react";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <>
      {/* ================================
          ANNOUNCEMENT
          ================================ */}
      <div className="announcement">
        FREE SHIPPING ACROSS INDIA &nbsp;|&nbsp; COD AVAILABLE
      </div>

      {/* ================================
          HEADER
          ================================ */}
      <header className="header">

        {/* ================================
            MOBILE MENU BUTTON
            ================================ */}
        <button
          type="button"
          className="mobile-menu-button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          title={menuOpen ? "Close Menu" : "Menu"}
          onClick={() => setMenuOpen((prev) => !prev)}
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* ================================
            LOGO
            ================================ */}
        <Link
          href="/"
          className="brand"
          onClick={closeMenu}
          aria-label="Kashi Banaras Home"
          title="Kashi Banaras"
        >
          <span className="brand-mark">✦</span>

          <span>
            KASHI
            <small>BANARAS</small>
          </span>
        </Link>

        {/* ================================
            DESKTOP NAVIGATION
            ================================ */}
        <nav className="desktop-nav">
          <Link href="/">HOME</Link>

          <Link href="/sarees">
            SAREES
          </Link>

          <Link href="/collections">
            COLLECTIONS
          </Link>

          <Link href="/#story">
            OUR STORY
          </Link>

          <Link href="/#contact">
            CONTACT
          </Link>
        </nav>

        {/* ================================
            HEADER ICONS
            ================================ */}
        <div className="icons">

          {/* Search */}
          <Link
            href="/search"
            className="header-icon"
            aria-label="Search products"
            title="Search"
          >
            <Search />
          </Link>

          {/* Account */}
          <Link
            href="/account"
            className="header-icon"
            aria-label="Account"
            title="Account"
          >
            <UserRound />
          </Link>

          {/* Wishlist */}
          <Link
            href="/wishlist"
            className="header-icon"
            aria-label="Wishlist"
            title="Wishlist"
          >
            <Heart />
          </Link>

          {/* Cart */}
          <Link
            href="/cart"
            className="header-icon"
            aria-label="Shopping cart"
            title="Shopping Cart"
          >
            <ShoppingBag />
          </Link>

        </div>

        {/* ================================
            MOBILE NAVIGATION
            ================================ */}
        <div
          className={`mobile-nav ${
            menuOpen ? "mobile-nav-open" : ""
          }`}
          aria-hidden={!menuOpen}
        >
          <Link
            href="/"
            onClick={closeMenu}
          >
            HOME
          </Link>

          <Link
            href="/sarees"
            onClick={closeMenu}
          >
            SAREES
          </Link>

         <Link
           href="/collections"
           onClick={closeMenu}
         >
           COLLECTIONS
         </Link>

          <Link
            href="/#story"
            onClick={closeMenu}
          >
            OUR STORY
          </Link>

          <Link
            href="/#contact"
            onClick={closeMenu}
          >
            CONTACT
          </Link>
        </div>
      </header>

      {/* ================================
          HEADER RESPONSIVE CSS
          ================================ */}
      <style jsx>{`
        .header {
          position: relative;
          z-index: 10000;
        }

        .desktop-nav {
          display: flex;
        }

        /* ================================
           MOBILE MENU BUTTON
           ================================ */

        .mobile-menu-button {
          display: none;

          align-items: center;
          justify-content: center;

          padding: 0;
          margin: 0;

          border: none;
          background: transparent;

          color: inherit;

          cursor: pointer;

          flex-shrink: 0;

          -webkit-tap-highlight-color: transparent;
        }

        .mobile-menu-button:hover {
          opacity: 0.8;
        }

        /* ================================
           HEADER ICON
           ================================ */

        .header-icon {
          display: flex;
          align-items: center;
          justify-content: center;

          flex-shrink: 0;

          text-decoration: none;

          cursor: pointer;

          transition:
            opacity 0.2s ease,
            transform 0.2s ease;
        }

        .header-icon:hover {
          opacity: 0.75;
        }

        .header-icon:active {
          transform: scale(0.94);
        }

        .mobile-nav {
          display: none;
        }

        /* ================================
           MOBILE
           ================================ */

        @media (max-width: 768px) {
          .header {
            position: relative;
            z-index: 10000;

            width: 100%;
            box-sizing: border-box;

            display: flex;
            align-items: center;

            padding-left: 14px;
            padding-right: 12px;

            gap: 0;

            min-width: 0;
          }

          /* ================================
             HAMBURGER
             ================================ */

          .mobile-menu-button {
            display: flex !important;

            width: 24px;
            min-width: 24px;

            height: 24px;

            margin-right: 8px;
          }

          /* ================================
             LOGO
             ================================ */

          .brand {
            min-width: 0;
            flex-shrink: 1;

            display: flex;
            align-items: center;

            text-decoration: none;
          }

          .brand > span:last-child {
            min-width: 0;
          }

          /* ================================
             DESKTOP NAV HIDDEN
             ================================ */

          .desktop-nav {
            display: none !important;
          }

          /* ================================
             RIGHT SIDE ICONS
             ================================ */

          .icons {
            margin-left: auto;

            display: flex;
            align-items: center;
            justify-content: flex-end;

            flex-shrink: 0;

            gap: 11px;

            min-width: 0;
          }

          /*
           * Mobile par bhi:
           * Search
           * Account
           * Wishlist
           * Cart
           *
           * sab visible rahenge.
           */

          .header-icon {
            width: 20px;
            height: 20px;

            flex: 0 0 20px;
          }

          .header-icon svg {
            width: 19px;
            height: 19px;
          }

          /* ================================
             MOBILE NAV PANEL
             ================================ */

          .mobile-nav {
            position: absolute;

            top: 100%;
            left: 0;
            right: 0;

            z-index: 99999;

            display: flex !important;
            flex-direction: column;

            width: 100%;

            box-sizing: border-box;

            background: #11100e;

            border-top: 1px solid
              rgba(255, 255, 255, 0.08);

            border-bottom: 1px solid
              rgba(255, 255, 255, 0.12);

            padding: 8px 0;

            opacity: 0;
            visibility: hidden;

            transform: translateY(-8px);

            pointer-events: none;

            transition:
              opacity 0.2s ease,
              transform 0.2s ease,
              visibility 0.2s ease;
          }

          .mobile-nav-open {
            opacity: 1;
            visibility: visible;

            transform: translateY(0);

            pointer-events: auto;
          }

          .mobile-nav :global(a) {
            display: block;

            width: 100%;

            box-sizing: border-box;

            padding: 16px 20px;

            color: #f7f2e8;

            text-decoration: none;

            font-size: 12px;

            font-weight: 500;

            letter-spacing: 2px;

            border-bottom: 1px solid
              rgba(255, 255, 255, 0.06);

            background: #11100e;
          }

          .mobile-nav :global(a:last-child) {
            border-bottom: none;
          }

          .mobile-nav :global(a:hover) {
            background: rgba(255, 255, 255, 0.05);

            color: #d6ad5b;
          }
        }

        /* ================================
           SMALL PHONES
           ================================ */

        @media (max-width: 400px) {
          .header {
            padding-left: 11px;
            padding-right: 10px;
          }

          .mobile-menu-button {
            margin-right: 6px;
          }

          .icons {
            gap: 8px;
          }

          .header-icon {
            width: 19px;
            height: 19px;

            flex-basis: 19px;
          }

          .header-icon svg {
            width: 18px;
            height: 18px;
          }
        }
      `}</style>
    </>
  );
}