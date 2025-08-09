import { z } from 'zod';

export const FurnitureScalarFieldEnumSchema = z.enum(['id','label','x','y','z','roomId','createdAt','updatedAt']);

export default FurnitureScalarFieldEnumSchema;
