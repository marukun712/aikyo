import { z } from 'zod';
import type { Prisma } from '../../../../lib/generated/prisma';
import { RoomArgsSchema } from "../outputTypeSchemas/RoomArgsSchema"

export const CompanionSelectSchema: z.ZodType<Prisma.CompanionSelect> = z.object({
  id: z.boolean().optional(),
  name: z.boolean().optional(),
  personality: z.boolean().optional(),
  story: z.boolean().optional(),
  sample: z.boolean().optional(),
  icon: z.boolean().optional(),
  roomId: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  Room: z.union([z.boolean(),z.lazy(() => RoomArgsSchema)]).optional(),
}).strict()

export default CompanionSelectSchema;
