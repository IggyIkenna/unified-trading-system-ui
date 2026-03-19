import { z } from "zod";

export const userAccessSchema = z.object({
  groupIds: z.array(z.string()).optional(),
  presentationIds: z.array(z.string()).optional(),
  clientId: z.string().optional(),
});
export type UserAccess = z.infer<typeof userAccessSchema>;

export const clientSchema = z.object({
  presentationIds: z.array(z.string()).optional(),
});

export const groupSchema = z.object({
  presentationIds: z.array(z.string()).optional(),
  isFolderGroup: z.boolean().optional(),
  folderName: z.string().optional(),
});

export const presentationSchema = z.object({
  title: z.string(),
  gcsPath: z.string(),
});

export const userRoleSchema = z.object({
  role: z.string().optional(),
});
