ALTER TABLE "actions" ADD COLUMN "phase" varchar(20) DEFAULT 'preflop' NOT NULL;--> statement-breakpoint
ALTER TABLE "rounds" ADD COLUMN "community_cards" text;--> statement-breakpoint
ALTER TABLE "rounds" ADD COLUMN "current_player" uuid;--> statement-breakpoint
ALTER TABLE "rounds" ADD COLUMN "current_bet" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "rounds" ADD COLUMN "small_blind" integer DEFAULT 10 NOT NULL;--> statement-breakpoint
ALTER TABLE "rounds" ADD COLUMN "big_blind" integer DEFAULT 20 NOT NULL;--> statement-breakpoint
ALTER TABLE "rounds" ADD COLUMN "phase" varchar(20) DEFAULT 'preflop' NOT NULL;--> statement-breakpoint
ALTER TABLE "table_players" ADD COLUMN "current_bet" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "table_players" ADD COLUMN "total_bet" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "table_players" ADD COLUMN "is_folded" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "table_players" ADD COLUMN "cards" text;--> statement-breakpoint
ALTER TABLE "rounds" ADD CONSTRAINT "rounds_current_player_users_id_fk" FOREIGN KEY ("current_player") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;