ALTER TABLE "rounds" ADD COLUMN "sub_round_number" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "rounds" ADD COLUMN "players_acted" text;