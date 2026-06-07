import { NavBar } from "@/components/molecules/NavBar";

const navItems = [
  { href: "/comprehension-orale", label: "Compréhension Orale" },
  { href: "/comprehension-ecrite", label: "Compréhension Écrite" },
  { href: "/expression-ecrite", label: "Expression Écrite" },
  { href: "/expression-orale", label: "Expression Orale" },
  { href: "/#tarifs", label: "Tarifs" },
];

export function GlobalNav() {
  return (
    <header
      className="sticky top-0 z-50 w-full border-b border-[--slate-800] bg-[--slate-950]/80 backdrop-blur-md"
      role="banner"
    >
      <nav role="navigation" aria-label="Navigation principale">
        <NavBar navItems={navItems} />
      </nav>
    </header>
  );
}
