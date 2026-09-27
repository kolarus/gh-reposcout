import { z } from 'zod';

/** `GET /users/{login}` (ADR-0008): users and organisations alike. Only the fields shown. */
export const ownerSchema = z.object({
  login: z.string(),
  name: z.string().nullable(),
  avatar_url: z.string(),
  html_url: z.string(),
  type: z.string(),
  bio: z.string().nullable(),
  company: z.string().nullable(),
  location: z.string().nullable(),
  blog: z.string().nullable(),
  followers: z.number(),
  public_repos: z.number(),
});

export type OwnerDto = z.infer<typeof ownerSchema>;
