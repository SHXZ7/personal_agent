Follow this frontend folder structure strictly:

src/
├── components/          ← All reusable UI components go here
│   ├── Navbar.tsx
│   ├── Button.tsx
│   └── ...              ← One file per component, PascalCase naming
│
├── pages/               ← Extra pages go in their own folder
│   ├── dashboard/
│   │   └── page.tsx
│   ├── settings/
│   │   └── page.tsx
│   └── ...
│
└── app/                 ← (or index.tsx / main page)
    └── page.tsx         ← Main page — imports and uses components from /components

Rules:
1. Every reusable UI piece goes in /components as its own file
2. Each component must be exported as a named or default export
3. The main page imports components from /components — no inline component definitions
4. Any additional pages go in /pages/<page-name>/page.tsx
5. No component logic inside page files — pages are composition only
6. Keep components single-responsibility — one component, one job