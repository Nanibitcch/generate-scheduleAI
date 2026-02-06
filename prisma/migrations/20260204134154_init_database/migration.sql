-- CreateEnum
CREATE TYPE "day_name" AS ENUM ('Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat');

-- CreateEnum
CREATE TYPE "slot_type" AS ENUM ('theory', 'lab');

-- CreateTable
CREATE TABLE "teachers" (
    "teacher_id" SERIAL NOT NULL,
    "title" VARCHAR(20),
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "name" VARCHAR(250) NOT NULL,
    "max_hours_per_week" INTEGER DEFAULT 20,

    CONSTRAINT "teachers_pkey" PRIMARY KEY ("teacher_id")
);

-- CreateTable
CREATE TABLE "teacher_preferred_slots" (
    "teacher_id" INTEGER NOT NULL,
    "day_of_week" "day_name" NOT NULL,
    "start_time" TIME(6) NOT NULL,
    "end_time" TIME(6) NOT NULL,

    CONSTRAINT "teacher_preferred_slots_pkey" PRIMARY KEY ("teacher_id","day_of_week","start_time")
);

-- CreateTable
CREATE TABLE "courses" (
    "course_id" SERIAL NOT NULL,
    "course_code" VARCHAR(20) NOT NULL,
    "subject_name" VARCHAR(100) NOT NULL,
    "theory_hours" INTEGER DEFAULT 0,
    "lab_hours" INTEGER DEFAULT 0,
    "is_remedial" BOOLEAN DEFAULT false,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("course_id")
);

-- CreateTable
CREATE TABLE "student_groups" (
    "group_id" SERIAL NOT NULL,
    "level" VARCHAR(20),
    "academic_year" VARCHAR(10),
    "major" VARCHAR(100),
    "group_name" VARCHAR(50) NOT NULL,
    "student_count" INTEGER,
    "home_room_id" INTEGER,

    CONSTRAINT "student_groups_pkey" PRIMARY KEY ("group_id")
);

-- CreateTable
CREATE TABLE "combined_group_mappings" (
    "mapping_id" SERIAL NOT NULL,
    "combined_name" VARCHAR(100),
    "main_group_id" INTEGER NOT NULL,
    "sub_group_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "combined_group_mappings_pkey" PRIMARY KEY ("mapping_id")
);

-- CreateTable
CREATE TABLE "course_enrollments" (
    "enrollment_id" SERIAL NOT NULL,
    "course_id" INTEGER NOT NULL,
    "group_id" INTEGER NOT NULL,
    "teacher_id" INTEGER NOT NULL,
    "preferred_room_id" INTEGER,
    "is_combined" BOOLEAN DEFAULT false,
    "combined_with" VARCHAR(100),

    CONSTRAINT "course_enrollments_pkey" PRIMARY KEY ("enrollment_id")
);

-- CreateTable
CREATE TABLE "rooms" (
    "room_id" SERIAL NOT NULL,
    "room_name" VARCHAR(100) NOT NULL,
    "room_number" VARCHAR(20) NOT NULL,
    "capacity" INTEGER,
    "equipment_list" TEXT,

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("room_id")
);

-- CreateTable
CREATE TABLE "schedules" (
    "schedule_id" SERIAL NOT NULL,
    "enrollment_id" INTEGER NOT NULL,
    "room_id" INTEGER NOT NULL,
    "teacher_id" INTEGER NOT NULL,
    "group_id" INTEGER NOT NULL,
    "day_of_week" "day_name" NOT NULL,
    "start_time" TIME(6) NOT NULL,
    "end_time" TIME(6) NOT NULL,
    "type_of_slot" "slot_type" NOT NULL DEFAULT 'theory',
    "is_confirmed" BOOLEAN DEFAULT false,

    CONSTRAINT "schedules_pkey" PRIMARY KEY ("schedule_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "teachers_first_name_last_name_key" ON "teachers"("first_name", "last_name");

-- CreateIndex
CREATE UNIQUE INDEX "courses_course_code_key" ON "courses"("course_code");

-- CreateIndex
CREATE UNIQUE INDEX "student_groups_level_academic_year_major_group_name_key" ON "student_groups"("level", "academic_year", "major", "group_name");

-- CreateIndex
CREATE UNIQUE INDEX "combined_group_mappings_sub_group_id_key" ON "combined_group_mappings"("sub_group_id");

-- AddForeignKey
ALTER TABLE "teacher_preferred_slots" ADD CONSTRAINT "teacher_preferred_slots_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("teacher_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_groups" ADD CONSTRAINT "student_groups_home_room_id_fkey" FOREIGN KEY ("home_room_id") REFERENCES "rooms"("room_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "combined_group_mappings" ADD CONSTRAINT "combined_group_mappings_main_group_id_fkey" FOREIGN KEY ("main_group_id") REFERENCES "student_groups"("group_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "combined_group_mappings" ADD CONSTRAINT "combined_group_mappings_sub_group_id_fkey" FOREIGN KEY ("sub_group_id") REFERENCES "student_groups"("group_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_enrollments" ADD CONSTRAINT "course_enrollments_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("course_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_enrollments" ADD CONSTRAINT "course_enrollments_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "student_groups"("group_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_enrollments" ADD CONSTRAINT "course_enrollments_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("teacher_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_enrollments" ADD CONSTRAINT "course_enrollments_preferred_room_id_fkey" FOREIGN KEY ("preferred_room_id") REFERENCES "rooms"("room_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "course_enrollments"("enrollment_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("room_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("teacher_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "student_groups"("group_id") ON DELETE CASCADE ON UPDATE CASCADE;
