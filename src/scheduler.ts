const { PrismaClient } = require('@prisma/client');
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function runAIScheduler() {
  try {
    console.log("⏳ 1. กำลังดึงข้อมูลจาก Database...");
    
    const teachers = await prisma.teachers.findMany({ include: { teacher_preferred_slots: true } });
    const rooms = await prisma.rooms.findMany();
    const enrollments = await prisma.course_enrollments.findMany({
      include: { courses: true, student_groups: true, teachers: true }
    });

    const aiInput = {
      rooms: rooms.map((r: any) => ({ id: r.room_id, name: r.room_name, cap: r.capacity })),
      teachers: teachers.map((t: any) => ({
        id: t.teacher_id, 
        name: t.name,
        busy: t.teacher_preferred_slots.map((p: any) => `${p.day_of_week} ${p.start_time}-${p.end_time}`)
      })),
      tasks: enrollments.map((e: any) => ({
        id: e.enrollment_id,
        course: e.courses.subject_name,
        hours: e.courses.theory_hours + e.courses.lab_hours,
        students: e.student_groups.student_count,
        teacher_id: e.teacher_id
      }))
    };

    console.log("🤖 2. กำลังส่งข้อมูลให้ Gemini AI ประมวลผล...");

    // หมายเหตุ: ใช้ชื่อรุ่น gemini-1.5-flash ตามที่คุณรันผ่านล่าสุด
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `
      คุณคือผู้เชี่ยวชาญการจัดตารางสอน 
      จงนำข้อมูล JSON นี้ไปจัดตารางสอนโดยห้ามให้ครูสอนซ้อนกัน และห้ามใช้ห้องซ้อนกัน
      Data: ${JSON.stringify(aiInput)}
      
      ตอบกลับเป็น JSON format เท่านั้น โดยมีโครงสร้างดังนี้:
      [{"enrollment_id": id, "room_id": id, "teacher_id": id, "day": "Mon", "start": "09:00", "end": "12:00"}]
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log("✅ 3. AI จัดตารางเสร็จแล้ว:");
    
    // ทำความสะอาดข้อความจาก AI เผื่อมีการติด Markdown ```json มา
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const schedules = JSON.parse(cleanJson);

    console.log("💾 4. กำลังบันทึกตารางสอนลง Database...");

    // ล้างข้อมูลตารางสอนเดิมก่อนบันทึกใหม่ (Optional: ถ้าต้องการล้างข้อมูลเก่าก่อน)
    // await prisma.schedules.deleteMany({});

    for (const item of schedules) {
      await prisma.schedules.create({
        data: {
          enrollment_id: item.enrollment_id,
          room_id: item.room_id,
          teacher_id: item.teacher_id,
          day_of_week: item.day,
          // จัดฟอร์แมตเวลาให้ PostgreSQL (1970-01-01 คือวันที่หลอกเพื่อให้ได้ค่า Time)
          start_time: new Date(`1970-01-01T${item.start}:00Z`),
          end_time: new Date(`1970-01-01T${item.end}:00Z`),
          type_of_slot: 'theory', 
          is_confirmed: true
        }
      });
    }

    console.log("✨ บันทึกตารางสอนทั้งหมดสำเร็จเรียบร้อยแล้ว!");

  } catch (error) {
    console.error("❌ เกิดข้อผิดพลาด:", error);
  } finally {
    await prisma.$disconnect();
  }
}

runAIScheduler();