// Moved to src/listings/process-image.ts (Task 13a) so the guarded upload
// endpoint can share the same sharp pipeline as this seed script. Re-exported
// here so prisma/seed.ts keeps its original import path.
export {
  processImage,
  type ProcessedImage,
  type ProcessImageOptions,
} from '../src/listings/process-image';
