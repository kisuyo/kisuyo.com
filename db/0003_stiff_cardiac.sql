CREATE TABLE "betting_sub_rounds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"round_id" uuid NOT NULL,
	"phase" varchar(20) NOT NULL,
	"sub_round_number" integer NOT NULL,
	"current_bet" integer DEFAULT 0 NOT NULL,
	"players_acted" text NOT NULL,
	"is_complete" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "community_cards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"round_id" uuid NOT NULL,
	"cards" text NOT NULL,
	"flop_revealed" boolean DEFAULT false NOT NULL,
	"turn_revealed" boolean DEFAULT false NOT NULL,
	"river_revealed" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "rounds" ALTER COLUMN "phase" SET DEFAULT 'blinds';--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "token" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "betting_sub_rounds" ADD CONSTRAINT "betting_sub_rounds_round_id_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."rounds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_cards" ADD CONSTRAINT "community_cards_round_id_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."rounds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rounds" DROP COLUMN "community_cards";--> statement-breakpoint
ALTER TABLE "rounds" DROP COLUMN "sub_round_number";--> statement-breakpoint
ALTER TABLE "rounds" DROP COLUMN "players_acted";--> statement-breakpoint
ALTER TABLE "table_players" DROP COLUMN "current_bet";--> statement-breakpoint
ALTER TABLE "table_players" DROP COLUMN "total_bet";--> statement-breakpoint
ALTER TABLE "table_players" DROP COLUMN "is_folded";--> statement-breakpoint
ALTER TABLE "table_players" DROP COLUMN "cards";--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_token_unique" UNIQUE("token");