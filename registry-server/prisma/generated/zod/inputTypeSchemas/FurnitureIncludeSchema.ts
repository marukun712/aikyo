import { z } from 'zod';
import type { Prisma } from '../../../../lib/generated/prisma';
import { RoomArgsSchema } from "../outputTypeSchemas/RoomArgsSchema"

export const FurnitureIncludeSchema: z.ZodType<Prisma.FurnitureInclude> = z.object({
  Room: z.union([z.boolean(),z.lazy(() => RoomArgsSchema)]).optional(),
}).strict()

export default FurnitureIncludeSchema;
