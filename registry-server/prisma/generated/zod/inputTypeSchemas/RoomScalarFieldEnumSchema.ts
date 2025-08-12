import { z } from 'zod';

export const RoomScalarFieldEnumSchema = z.enum(['id','name','createdAt','updatedAt']);

export default RoomScalarFieldEnumSchema;
