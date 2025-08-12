import type { Prisma } from '../../../../lib/generated/prisma';

import { z } from 'zod';
import { FurnitureScalarWhereInputSchema } from './FurnitureScalarWhereInputSchema';
import { FurnitureUpdateManyMutationInputSchema } from './FurnitureUpdateManyMutationInputSchema';
import { FurnitureUncheckedUpdateManyWithoutRoomInputSchema } from './FurnitureUncheckedUpdateManyWithoutRoomInputSchema';

export const FurnitureUpdateManyWithWhereWithoutRoomInputSchema: z.ZodType<Prisma.FurnitureUpdateManyWithWhereWithoutRoomInput> = z.object({
  where: z.lazy(() => FurnitureScalarWhereInputSchema),
  data: z.union([ z.lazy(() => FurnitureUpdateManyMutationInputSchema),z.lazy(() => FurnitureUncheckedUpdateManyWithoutRoomInputSchema) ]),
}).strict() as z.ZodType<Prisma.FurnitureUpdateManyWithWhereWithoutRoomInput>;

export default FurnitureUpdateManyWithWhereWithoutRoomInputSchema;
