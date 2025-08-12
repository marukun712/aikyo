import type { Prisma } from '../../../../lib/generated/prisma';

import { z } from 'zod';
import { FurnitureWhereUniqueInputSchema } from './FurnitureWhereUniqueInputSchema';
import { FurnitureUpdateWithoutRoomInputSchema } from './FurnitureUpdateWithoutRoomInputSchema';
import { FurnitureUncheckedUpdateWithoutRoomInputSchema } from './FurnitureUncheckedUpdateWithoutRoomInputSchema';

export const FurnitureUpdateWithWhereUniqueWithoutRoomInputSchema: z.ZodType<Prisma.FurnitureUpdateWithWhereUniqueWithoutRoomInput> = z.object({
  where: z.lazy(() => FurnitureWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => FurnitureUpdateWithoutRoomInputSchema),z.lazy(() => FurnitureUncheckedUpdateWithoutRoomInputSchema) ]),
}).strict() as z.ZodType<Prisma.FurnitureUpdateWithWhereUniqueWithoutRoomInput>;

export default FurnitureUpdateWithWhereUniqueWithoutRoomInputSchema;
