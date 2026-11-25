ALTER TABLE "payments" ADD COLUMN "email_claimed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "email_failed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "admin_email_sent_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "admin_email_claimed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "livemode" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "webhook_events" ADD COLUMN "state" text DEFAULT 'done' NOT NULL;--> statement-breakpoint
ALTER TABLE "webhook_events" ADD COLUMN "claimed_at" timestamp with time zone DEFAULT now() NOT NULL;