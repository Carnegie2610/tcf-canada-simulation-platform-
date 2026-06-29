# Logo Integration & Update Procedure

Follow these instructions to replace the existing platform iconography with the new `4c2-logo.svg` asset across the application and specifically within the generated PDF report dossier.

## Phase 1: Asset Integration

1. **Deployment:** Ensure the new asset is placed in the project root within the `public/` directory. The file path must be `/public/4c2-logo.svg`. This allows the file to be served statically from the web root.

## Phase 2: Component-Level Replacement

The agent must locate all instances where the "Objectif 4C2" logo is currently rendered, specifically within the `Logo` component.

1. **Identification:** Locate the `Logo` component, typically found in your report generation files (e.g., `Objectif4C2Report.jsx`).
2. **Icon Removal:** Identify the existing `Lucide` icon component (such as `BookOpen` or any placeholder icon) currently being rendered in the branding section.
3. **Image Insertion:** Replace the entire icon component wrapper with a standard HTML `img` element.
    - Set the `src` attribute to the absolute path `/4c2-logo.svg`.
    - Apply an `alt` tag for accessibility, e.g., "Objectif 4C2 Academy Logo".
    - Ensure the `img` element uses Tailwind classes (e.g., `w-full`, `h-full`, `object-contain`) to maintain the visual sizing requirements established in the design system.

## Phase 3: Scaling & Styling Adjustments

To maintain the professional aesthetic of the PDF dossier:

1. **Parent Container:** The `img` tag should be wrapped in the same parent `div` that previously held the icon. This container should maintain the fixed dimensions (e.g., `w-12`, `h-12`) defined in your design system.
2. **Object Fitting:** Ensure the `object-contain` property is applied to the image element to prevent the logo from stretching or distorting if the container aspect ratio changes during responsive scaling.
3. **Verification:** Confirm that the logo visually aligns with the surrounding text ("OBJECTIF" and "4C2 ACADEMY") so that the horizontal layout remains consistent with the original design blueprint.

## Phase 4: Verification

1. **Local Preview:** After applying the changes, trigger a re-render of the `Objectif4C2Report` component.
2. **Consistency Check:** Verify that the logo appears at the top of the Cover Page and on every Task page without shifting the layout of the adjacent text elements.
3. **Static Path Test:** Confirm that the browser can resolve the `/4c2-logo.svg` path by inspecting the page source or network tab.