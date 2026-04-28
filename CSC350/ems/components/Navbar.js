
// The top navigation bar that appears on every page.

"use client"; //(client-side hook)

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  //"Employees" tab when on the list page
  const isListActive = pathname === "/";
  //"Add Employee" tab when on the add page
  const isAddActive = pathname === "/employees/add";

  return (
    <nav className="topnav">
      {/* Logo */}
      <Link href="/" className="logo">
        <div className="logo-icon">⚙</div>
        <span className="logo-text">EMS</span>
      </Link>

      {/* Navigation links */}
      <div className="nav-links">
        <Link href="/">
          <button className={`nav-btn ${isListActive ? "active" : ""}`}>
            Employees
          </button>
        </Link>
        <Link href="/employees/add">
          <button className={`nav-btn ${isAddActive ? "active" : ""}`}>
            + Add Employee
          </button>
        </Link>
      </div>

      {/* User avatar (placeholder) */}
      <div className="nav-avatar">A</div>
    </nav>
  );
}
