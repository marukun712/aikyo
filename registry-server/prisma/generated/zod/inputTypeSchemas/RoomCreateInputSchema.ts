import type { Prisma } from '../../../../lib/generated/prisma';

import { z } from 'zod';
import { FurnitureCreateNestedManyWithoutRoomInputSchema } from './FurnitureCreateNestedManyWithoutRoomInputSchema';
import { CompanionCreateNestedManyWithoutRoomInputSchema } from './CompanionCreateNestedManyWithoutRoomInputSchema';

export const RoomCreateInputSchema: z.ZodType<Prisma.RoomCreateInput> = z.object({
  id: z.string().uuid().optional(),
  name: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  furniture: z.lazy(() => FurnitureCreateNestedManyWithoutRoomInputSchema).optional(),
  companions: z.lazy(() => CompanionCreateNestedManyWithoutRoomInputSchema).optional()
}).strict() as z.ZodType<Prisma.RoomCreateInput>;

export default RoomCreateInputSchema;
