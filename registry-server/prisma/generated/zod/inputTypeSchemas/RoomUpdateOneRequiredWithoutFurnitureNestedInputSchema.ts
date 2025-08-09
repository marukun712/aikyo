import type { Prisma } from '../../../../lib/generated/prisma';

import { z } from 'zod';
import { RoomWhereUniqueInputSchema } from './RoomWhereUniqueInputSchema';
import { RoomUpdateToOneWithWhereWithoutFurnitureInputSchema } from './RoomUpdateToOneWithWhereWithoutFurnitureInputSchema';
import { RoomUpdateWithoutFurnitureInputSchema } from './RoomUpdateWithoutFurnitureInputSchema';
import { RoomUncheckedUpdateWithoutFurnitureInputSchema } from './RoomUncheckedUpdateWithoutFurnitureInputSchema';

export const RoomUpdateOneRequiredWithoutFurnitureNestedInputSchema: z.ZodType<Prisma.RoomUpdateOneRequiredWithoutFurnitureNestedInput> = z.object({
  connect: z.lazy(() => RoomWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => RoomUpdateToOneWithWhereWithoutFurnitureInputSchema),z.lazy(() => RoomUpdateWithoutFurnitureInputSchema),z.lazy(() => RoomUncheckedUpdateWithoutFurnitureInputSchema) ]).optional(),
}).strict() as z.ZodType<Prisma.RoomUpdateOneRequiredWithoutFurnitureNestedInput>;

export default RoomUpdateOneRequiredWithoutFurnitureNestedInputSchema;
