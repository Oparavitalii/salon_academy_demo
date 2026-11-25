CREATE TABLE "certificates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"number" text NOT NULL,
	"year" integer NOT NULL,
	"seq" integer NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"user_id" uuid,
	"course_line1" text NOT NULL,
	"course_line2" text,
	"issued_on" text NOT NULL,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "certificates_number_unique" UNIQUE("number")
);
--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "certificates_year_seq_uq" ON "certificates" USING btree ("year","seq");