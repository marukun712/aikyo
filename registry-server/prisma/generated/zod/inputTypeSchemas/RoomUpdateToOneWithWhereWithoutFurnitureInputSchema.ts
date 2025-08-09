import type { Prisma } from '../../../../lib/generated/prisma';

import { z } from 'zod';
import { RoomWhereInputSchema } from './RoomWhereInputSchema';
import { RoomUpdateWithoutFurnitureInputSchema } from './RoomUpdateWithoutFurnitureInputSchema';
import { RoomUncheckedUpdateWithoutFurnitureInputSchema } from './RoomUncheckedUpdateWithoutFurnitureInputSchema';

export const RoomUpdateToOneWithWhereWithoutFurnitureInputSchema: z.ZodType<Prisma.RoomUpdateToOneWithWhereWithoutFurnitureInput> = z.object({
  where: z.lazy(() => RoomWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => RoomUpdateWithoutFurnitureInputSchema),z.lazy(() => RoomUncheckedUpdateWithoutFurnitureInputSchema) ]),
}).strict() as z.ZodType<Prisma.RoomUpdateToOneWithWhereWithoutFurnitureInput>;

export default RoomUpdateToOneWithWhereWithoutFurnitureInputSchema;
