import type { Prisma } from '../../../../lib/generated/prisma';

import { z } from 'zod';
import { CompanionUncheckedCreateNestedManyWithoutRoomInputSchema } from './CompanionUncheckedCreateNestedManyWithoutRoomInputSchema';

export const RoomUncheckedCreateWithoutFurnitureInputSchema: z.ZodType<Prisma.RoomUncheckedCreateWithoutFurnitureInput> = z.object({
  id: z.string().uuid().optional(),
  name: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  companions: z.lazy(() => CompanionUncheckedCreateNestedManyWithoutRoomInputSchema).optional()
}).strict() as z.ZodType<Prisma.RoomUncheckedCreateWithoutFurnitureInput>;

export default RoomUncheckedCreateWithoutFurnitureInputSchema;
