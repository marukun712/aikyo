import { z } from 'zod';
import type { Prisma } from '../../../../lib/generated/prisma';
import { FurnitureFindManyArgsSchema } from "../outputTypeSchemas/FurnitureFindManyArgsSchema"
import { CompanionFindManyArgsSchema } from "../outputTypeSchemas/CompanionFindManyArgsSchema"
import { RoomCountOutputTypeArgsSchema } from "../outputTypeSchemas/RoomCountOutputTypeArgsSchema"

export const RoomIncludeSchema: z.ZodType<Prisma.RoomInclude> = z.object({
  furniture: z.union([z.boolean(),z.lazy(() => FurnitureFindManyArgsSchema)]).optional(),
  companions: z.union([z.boolean(),z.lazy(() => CompanionFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => RoomCountOutputTypeArgsSchema)]).optional(),
}).strict()

export default RoomIncludeSchema;
