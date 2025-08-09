import type { Prisma } from '../../../../lib/generated/prisma';

import { z } from 'zod';
import { CompanionWhereUniqueInputSchema } from './CompanionWhereUniqueInputSchema';
import { CompanionUpdateWithWhereUniqueWithoutRoomInputSchema } from './CompanionUpdateWithWhereUniqueWithoutRoomInputSchema';
import { CompanionUpdateManyWithWhereWithoutRoomInputSchema } from './CompanionUpdateManyWithWhereWithoutRoomInputSchema';
import { CompanionScalarWhereInputSchema } from './CompanionScalarWhereInputSchema';

export const CompanionUpdateManyWithoutRoomNestedInputSchema: z.ZodType<Prisma.CompanionUpdateManyWithoutRoomNestedInput> = z.object({
  set: z.union([ z.lazy(() => CompanionWhereUniqueInputSchema),z.lazy(() => CompanionWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => CompanionWhereUniqueInputSchema),z.lazy(() => CompanionWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => CompanionWhereUniqueInputSchema),z.lazy(() => CompanionWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => CompanionWhereUniqueInputSchema),z.lazy(() => CompanionWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => CompanionUpdateWithWhereUniqueWithoutRoomInputSchema),z.lazy(() => CompanionUpdateWithWhereUniqueWithoutRoomInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => CompanionUpdateManyWithWhereWithoutRoomInputSchema),z.lazy(() => CompanionUpdateManyWithWhereWithoutRoomInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => CompanionScalarWhereInputSchema),z.lazy(() => CompanionScalarWhereInputSchema).array() ]).optional(),
}).strict() as z.ZodType<Prisma.CompanionUpdateManyWithoutRoomNestedInput>;

export default CompanionUpdateManyWithoutRoomNestedInputSchema;
