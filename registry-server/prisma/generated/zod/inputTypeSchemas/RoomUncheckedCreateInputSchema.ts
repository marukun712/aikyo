import type { Prisma } from '../../../../lib/generated/prisma';

import { z } from 'zod';
import { FurnitureUncheckedCreateNestedManyWithoutRoomInputSchema } from './FurnitureUncheckedCreateNestedManyWithoutRoomInputSchema';
import { CompanionUncheckedCreateNestedManyWithoutRoomInputSchema } from './CompanionUncheckedCreateNestedManyWithoutRoomInputSchema';

export const RoomUncheckedCreateInputSchema: z.ZodType<Prisma.RoomUncheckedCreateInput> = z.object({
  id: z.string().uuid().optional(),
  name: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  furniture: z.lazy(() => FurnitureUncheckedCreateNestedManyWithoutRoomInputSchema).optional(),
  companions: z.lazy(() => CompanionUncheckedCreateNestedManyWithoutRoomInputSchema).optional()
}).strict() as z.ZodType<Prisma.RoomUncheckedCreateInput>;

export default RoomUncheckedCreateInputSchema;
