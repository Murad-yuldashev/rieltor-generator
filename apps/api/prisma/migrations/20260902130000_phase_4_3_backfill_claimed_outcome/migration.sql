-- Backfill: leads claimed before Phase 4.3 have a NULL outcomeStage and would be
-- un-recordable (setOutcome 409s) + excluded from funnels/scoring. Set them to NEW,
-- the correct initial stage for a just-migrated claimed lead. Data-only, additive.
UPDATE "PropertyRequest" SET "outcomeStage" = 'NEW' WHERE "status" = 'CLAIMED' AND "outcomeStage" IS NULL;
