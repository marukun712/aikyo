import type { Prisma } from '../../../../lib/generated/prisma';

import { z } from 'zod';
import { FurnitureWhereUniqueInputSchema } from './FurnitureWhereUniqueInputSchema';
import { FurnitureUpdateWithWhereUniqueWithoutRoomInputSchema } from './FurnitureUpdateWithWhereUniqueWithoutRoomInputSchema';
import { FurnitureUpdateManyWithWhereWithoutRoomInputSchema } from './FurnitureUpdateManyWithWhereWithoutRoomInputSchema';
import { FurnitureScalarWhereInputSchema } from './FurnitureScalarWhereInputSchema';

export const FurnitureUpdateManyWithoutRoomNestedInputSchema: z.ZodType<Prisma.FurnitureUpdateManyWithoutRoomNestedInput> = z.object({
  set: z.union([ z.lazy(() => FurnitureWhereUniqueInputSchema),z.lazy(() => FurnitureWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => FurnitureWhereUniqueInputSchema),z.lazy(() => FurnitureWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => FurnitureWhereUniqueInputSchema),z.lazy(() => FurnitureWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => FurnitureWhereUniqueInputSchema),z.lazy(() => FurnitureWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => FurnitureUpdateWithWhereUniqueWithoutRoomInputSchema),z.lazy(() => FurnitureUpdateWithWhereUniqueWithoutRoomInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => FurnitureUpdateManyWithWhereWithoutRoomInputSchema),z.lazy(() => FurnitureUpdateManyWithWhereWithoutRoomInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => FurnitureScalarWhereInputSchema),z.lazy(() => FurnitureScalarWhereInputSchema).array() ]).optional(),
}).strict() as z.ZodType<Prisma.FurnitureUpdateManyWithoutRoomNestedInput>;

export default FurnitureUpdateManyWithoutRoomNestedInputSchema;
