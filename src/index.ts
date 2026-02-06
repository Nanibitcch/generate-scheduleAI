// เปลี่ยนบรรทัด 1-2 เป็นแบบนี้ครับ
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function getSchedulingData() {
  try {
    const teachers = await prisma.teachers.findMany({
      include: { teacher_preferred_slots: true },
    });
    const rooms = await prisma.rooms.findMany();
    const enrollments = await prisma.course_enrollments.findMany({
      include: { courses: true, student_groups: true, teachers: true },
    });

    const aiInput = {
      metadata: { working_days: ["Mon", "Tue", "Wed", "Thu", "Fri"], time_slot: "08:00 - 17:00" },
      rooms: rooms.map((r: any) => ({
        id: r.room_id,
        name: r.room_name,
        capacity: r.capacity
      })),
      teachers: teachers.map((t: any) => ({
        id: t.teacher_id,
        name: t.name,
        availability: t.teacher_preferred_slots.map((p: any) => ({
          day: p.day_of_week,
          start: p.start_time,
          end: p.end_time
        }))
      })),
      tasks: enrollments.map((e: any) => ({
        enrollment_id: e.enrollment_id,
        subject: e.courses.subject_name,
        theory_hours: e.courses.theory_hours,
        lab_hours: e.courses.lab_hours,
        student_count: e.student_groups.student_count,
        teacher_id: e.teacher_id
      }))
    };

    console.log("--- ข้อมูลพร้อมส่งให้ AI ---");
    console.log(JSON.stringify(aiInput, null, 2));
    return aiInput;
  } catch (error) {
    console.error("เกิดข้อผิดพลาด:", error);
  } finally {
    await prisma.$disconnect();
  }
}

getSchedulingData();