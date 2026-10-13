-- CreateTable
CREATE TABLE "profile_photos" (
    "profile_id" UUID NOT NULL,
    "data" BYTEA NOT NULL,
    "content_type" TEXT NOT NULL,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "profile_photos_pkey" PRIMARY KEY ("profile_id")
);

-- AddForeignKey
ALTER TABLE "profile_photos" ADD CONSTRAINT "profile_photos_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
