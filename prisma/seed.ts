import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Start seeding...');

  // 1. ล้างข้อมูลเก่า (ต้องลบตามลำดับความสัมพันธ์: ลบตารางปลายทางก่อนเสมอ)
  await prisma.schedules.deleteMany();
  await prisma.course_enrollments.deleteMany();
  await prisma.teacher_preferred_slots.deleteMany();
  await prisma.combined_group_mappings.deleteMany(); 
  await prisma.student_groups.deleteMany();
  await prisma.teachers.deleteMany();
  await prisma.courses.deleteMany();
  await prisma.rooms.deleteMany();

  console.log('🗑️ Cleaned old data');

  // 2. สร้างห้องเรียน
  const room1 = await prisma.rooms.create({
    data: { room_name: 'ห้องปฏิบัติการคอมพิวเตอร์ 1', room_number: '121', capacity: 40 }
  });

  const room2 = await prisma.rooms.create({
    data: { room_name: 'ห้องทฤษฎี 1', room_number: '321', capacity: 30 }
  });

  // 3. สร้างกลุ่มเรียน
  const group6 = await prisma.student_groups.create({
    data: { 
      level: 'ปวส.', 
      academic_year: '1', 
      major: 'เทคโนโลยีสารสนเทศ', 
      group_name: 'G6', 
      student_count: 20 
    }
  });

  const group7 = await prisma.student_groups.create({
    data: { 
      level: 'ปวส.', 
      academic_year: '1', 
      major: 'เทคโนโลยีสารสนเทศ', 
      group_name: 'G7', 
      student_count: 20
    }
  });

  // 4. สร้างการจับคู่เรียนร่วม (Mapping)
  await prisma.combined_group_mappings.create({
    data: {
      combined_name: 'IT_Year1_Combined_G6_G7',
      main_group_id: group6.group_id,
      sub_group_id: group7.group_id 
    }
  });

  // 5. สร้างอาจารย์
  const teacher1 = await prisma.teachers.create({
    data: { 
      title: 'ครู', 
      first_name: 'สมชาย', 
      last_name: 'สายเน็ต', 
      name: 'ครูสมชาย สายเน็ต',
      max_hours_per_week: 20 
    }
  });

  // 6. สร้างรายวิชา
  const course1 = await prisma.courses.create({
    data: { course_code: '30901-2001', subject_name: 'การจัดการระบบเครือข่าย', theory_hours: 1, lab_hours: 4 }
  });

  const course2 = await prisma.courses.create({
    data: { course_code: '30000-1101', subject_name: 'ภาษาไทยเพื่อสื่อสาร', theory_hours: 2, lab_hours: 0 }
  });

  // 7. มอบหมายงานสอน (Enrollment) 
  // 🚩 เคสที่ 1: เรียนร่วม (G6 และ G7 เรียนพร้อมกัน)
  const enrollCombined = await prisma.course_enrollments.create({
    data: {
      course_id: course1.course_id,
      group_id: group6.group_id, 
      teacher_id: teacher1.teacher_id,
      preferred_room_id: room1.room_id,
      is_combined: true, 
      combined_with: 'G7'
    }
  });

  // 🚩 เคสที่ 2: เรียนเดี่ยว (เฉพาะ G6)
  await prisma.course_enrollments.create({
    data: {
      course_id: course2.course_id,
      group_id: group6.group_id, 
      teacher_id: teacher1.teacher_id,
      preferred_room_id: room2.room_id,
      is_combined: false
    }
  });

  console.log('✅ Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });