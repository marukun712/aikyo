import type { Prisma } from '../../../../lib/generated/prisma';

import { z } from 'zod';
import { FurnitureWhereUniqueInputSchema } from './FurnitureWhereUniqueInputSchema';
import { FurnitureUpdateWithoutRoomInputSchema } from './FurnitureUpdateWithoutRoomInputSchema';
import { FurnitureUncheckedUpdateWithoutRoomInputSchema } from './FurnitureUncheckedUpdateWithoutRoomInputSchema';
import { FurnitureCreateWithoutRoomInputSchema } from './FurnitureCreateWithoutRoomInputSchema';
import { FurnitureUncheckedCreateWithoutRoomInputSchema } from './FurnitureUncheckedCreateWithoutRoomInputSchema';

export const FurnitureUpsertWithWhereUniqueWithoutRoomInputSchema: z.ZodType<Prisma.FurnitureUpsertWithWhereUniqueWithoutRoomInput> = z.object({
  where: z.lazy(() => FurnitureWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => FurnitureUpdateWithoutRoomInputSchema),z.lazy(() => FurnitureUncheckedUpdateWithoutRoomInputSchema) ]),
  create: z.union([ z.lazy(() => FurnitureCreateWithoutRoomInputSchema),z.lazy(() => FurnitureUncheckedCreateWithoutRoomInputSchema) ]),
}).strict() as z.ZodType<Prisma.FurnitureUpsertWithWhereUniqueWithoutRoomInput>;

export default FurnitureUpsertWithWhereUniqueWithoutRoomInputSchema;
