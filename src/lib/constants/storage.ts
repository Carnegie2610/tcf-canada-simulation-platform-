// Storage bucket names — kept in their own zero-dependency file so both server
// routes and client components can safely import them (importing straight from
// a route.ts file would drag its server-only imports, e.g. next/headers, into
// the client bundle).
export const TESTIMONIAL_AVATARS_BUCKET = "testimonial-avatars";
