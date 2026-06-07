
Skill: Atomic Frontend Design

Context

Use this skill when constructing new user interface elements, layouts, and modals in the application workspace.

Guidelines

Component Categorization: Organize frontend code based on Atomic design structures:

Atoms: Simple elements (e.g., buttons, text inputs, micro badges).

Molecules: Small groups of elements (e.g., form fields, countdown timers, search inputs).

Organisms: Complex UI modules (e.g., split-screen editors, navigation menus, user lookup cards).

Responsive Styling: Avoid hardcoded static layouts. Always utilize fluid, mobile-first Tailwind wrappers.

Code Patterns

Folder Architecture Map

src/components/
├── atoms/           # Button.tsx, Input.tsx, Badge.tsx
├── molecules/       # TimerWidget.tsx, FormField.tsx
└── organisms/       # SplitScreenArena.tsx, AdminUserTable.tsx


