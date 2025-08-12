import type { Prisma } from '../../../../lib/generated/prisma';

import { z } from 'zod';
import { RoomUpdateWithoutFurnitureInputSchema } from './RoomUpdateWithoutFurnitureInputSchema';
import { RoomUncheckedUpdateWithoutFurnitureInputSchema } from './RoomUncheckedUpdateWithoutFurnitureInputSchema';
import { RoomCreateWithoutFurnitureInputSchema } from './RoomCreateWithoutFurnitureInputSchema';
import { RoomUncheckedCreateWithoutFurnitureInputSchema } from './RoomUncheckedCreateWithoutFurnitureInputSchema';
import { RoomWhereInputSchema } from './RoomWhereInputSchema';

export const RoomUpsertWithoutFurnitureInputSchema: z.ZodType<Prisma.RoomUpsertWithoutFurnitureInput> = z.object({
  update: z.union([ z.lazy(() => RoomUpdateWithoutFurnitureInputSchema),z.lazy(() => RoomUncheckedUpdateWithoutFurnitureInputSchema) ]),
  create: z.union([ z.lazy(() => RoomCreateWithoutFurnitureInputSchema),z.lazy(() => RoomUncheckedCreateWithoutFurnitureInputSchema) ]),
  where: z.lazy(() => RoomWhereInputSchema).optional()
}).strict() as z.ZodType<Prisma.RoomUpsertWithoutFurnitureInput>;

export default RoomUpsertWithoutFurnitureInputSchema;
