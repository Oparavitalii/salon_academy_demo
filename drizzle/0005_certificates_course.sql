ALTER TABLE "certificates" ADD COLUMN "course_id" uuid;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "certificates_user_course_uq" ON "certificates" USING btree ("user_id","course_id");