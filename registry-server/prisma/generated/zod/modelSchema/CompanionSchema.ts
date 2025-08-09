import { z } from 'zod';

/////////////////////////////////////////
// COMPANION SCHEMA
/////////////////////////////////////////

export const CompanionSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  personality: z.string(),
  story: z.string(),
  sample: z.string(),
  icon: z.string(),
  roomId: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type Companion = z.infer<typeof CompanionSchema>

export default CompanionSchema;
