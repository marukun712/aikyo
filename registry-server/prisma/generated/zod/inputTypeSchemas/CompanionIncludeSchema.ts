import { z } from 'zod';
import type { Prisma } from '../../../../lib/generated/prisma';
import { RoomArgsSchema } from "../outputTypeSchemas/RoomArgsSchema"

export const CompanionIncludeSchema: z.ZodType<Prisma.CompanionInclude> = z.object({
  room: z.union([z.boolean(),z.lazy(() => RoomArgsSchema)]).optional(),
}).strict()

export default CompanionIncludeSchema;
