import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';

const prisma = new PrismaClient();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 🕒 แปลงเวลาจาก DB เป็น Slot (1-10)
function timeToSlot(time: Date): number {
  if (!time || isNaN(time.getTime())) return 1;
  const hours = time.getUTCHours() + 7; // ปรับเป็นเวลาไทย (GMT+7)
  const minutes = time.getUTCMinutes();
  const totalMinutes = hours * 60 + minutes;
  
  if (totalMinutes <= 530) return 1;  
  if (totalMinutes <= 590) return 2;  
  if (totalMinutes <= 650) return 3;  
  if (totalMinutes <= 710) return 4;  
  if (totalMinutes <= 770) return 5; // LUNCH
  if (totalMinutes <= 830) return 6;  
  if (totalMinutes <= 890) return 7;  
  if (totalMinutes <= 950) return 8;  
  if (totalMinutes <= 1010) return 9; 
  return 10;
}

// 🕒 [FIXED] ฟังก์ชันแปลง Slot กลับเป็นเวลา (ล็อคตายตัว จบ 18:10)
function slotToTime(slot: number, isEnd: boolean = false): Date {
  const safeSlot = Math.max(1, Math.min(10, Number(slot)));
  
  const startTimeMap: { [key: number]: { h: number, m: number } } = {
    1: { h: 8, m: 10 },  2: { h: 9, m: 10 },  3: { h: 10, m: 10 }, 4: { h: 11, m: 10 },
    5: { h: 12, m: 10 }, 6: { h: 13, m: 10 }, 7: { h: 14, m: 10 }, 8: { h: 15, m: 10 },
    9: { h: 16, m: 10 }, 10: { h: 17, m: 10 }
  };

  const time = startTimeMap[safeSlot];
  const date = new Date();
  
  const hour = isEnd ? time.h + 1 : time.h;
  const minute = time.m;

  date.setUTCHours(hour - 7, minute, 0, 0); 
  
  return date;
}

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const groupIdStr = searchParams.get('groupId');
    if (!groupIdStr) return NextResponse.json({ error: "กรุณาระบุ Group ID" }, { status: 400 });
    const currentGroupId = parseInt(groupIdStr);

    // 🚩 1. ดึงข้อมูลกลุ่มเป้าหมาย
    const groupData = await prisma.student_groups.findUnique({ where: { group_id: currentGroupId } });
    if (!groupData) return NextResponse.json({ error: "ไม่พบกลุ่มเรียนนี้" }, { status: 404 });

    // 🚩 2. หาเครือญาติเฉพาะกลุ่มที่เรียนร่วมกันจริงๆ
    const allMappings = await prisma.combined_group_mappings.findMany({
      where: { OR: [{ main_group_id: currentGroupId }, { sub_group_id: currentGroupId }] },
      include: { main_group: true, sub_group: true }
    });

    const clusterIds = new Set<number>([currentGroupId]);
    allMappings.forEach(m => {
      if (m.main_group.major === groupData.major && m.main_group.academic_year === groupData.academic_year) clusterIds.add(m.main_group_id);
      if (m.sub_group.major === groupData.major && m.sub_group.academic_year === groupData.academic_year) clusterIds.add(m.sub_group_id);
    });
    const finalRelatedIds = Array.from(clusterIds);

    // 🚩 3. ดึงงานสอน (ล็อคเป้าสาขาและปีการศึกษา) + เงื่อนไขอาจารย์
    const [targetEnrollments, rooms] = await Promise.all([
      prisma.course_enrollments.findMany({
        where: { 
          group_id: { in: finalRelatedIds },
          student_groups: {
            major: groupData.major,
            academic_year: groupData.academic_year
          }
        },
        include: { teachers: { include: { teacher_preferred_slots: true } }, courses: true }
      }),
      prisma.rooms.findMany()
    ]);

    if (targetEnrollments.length === 0) return NextResponse.json({ error: "ไม่พบงานสอนในสาขานี้" }, { status: 400 });

   // 🚩 4. เตรียม Busy Slots และข้อจำกัดอาจารย์
    const teacherIds = Array.from(new Set(targetEnrollments.map(e => e.teacher_id)));
    const externalSchedules = await prisma.schedules.findMany({
      where: { 
        teacher_id: { in: teacherIds },
        group_id: { notIn: finalRelatedIds } 
      }
    });

    // 💡 [ADDED] เรียงลำดับวิชาที่ชั่วโมงเยอะ (จัดยาก) ขึ้นก่อน เพื่อให้ AI วางแผนได้ครบถ้วนในครั้งเดียว
    const enrollmentsForAI = targetEnrollments
      .filter(e => e.group_id === currentGroupId)
      .sort((a, b) => {
        const hoursA = (a.courses.theory_hours || 0) + (a.courses.lab_hours || 0);
        const hoursB = (b.courses.theory_hours || 0) + (b.courses.lab_hours || 0);
        return hoursB - hoursA; // วิชาใหญ่ทำก่อน
      });

    const contextData = {
      target_major: groupData.major,
      target_year: groupData.academic_year,
      enrollments: enrollmentsForAI.map(e => ({
        id: e.enrollment_id,
        subject: e.courses.subject_name,
        slots_to_fill: (e.courses.theory_hours || 0) + (e.courses.lab_hours || 0),
        teacher: {
          id: e.teacher_id,
          name: e.teachers.name,
          preferred_availability: e.teachers.teacher_preferred_slots.map(p => ({
            day: p.day_of_week,
            start_slot: timeToSlot(p.start_time),
            end_slot: timeToSlot(p.end_time)
          }))
        }
      })),
      teacher_busy_slots: externalSchedules.map(s => ({
        day: s.day_of_week,
        start: timeToSlot(s.start_time),
        end: timeToSlot(s.end_time),
        teacher_id: s.teacher_id
      })),
      rooms: rooms.map(r => ({ id: r.room_id, label: r.room_number }))
    };

  // 🚩 5. [THE ULTIMATE PROMPT] รวมกฎเหล็กทุุกข้อ (1-24) เพื่อความสมบูรณ์ 100%
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a strict academic scheduler. 
          [STRICT RULES]
          1. MANDATORY COMPLETION: Schedule ALL subjects in the "enrollments" list exactly once.
          2. DURATION LOCK: (slot_end - slot_start + 1) MUST ALWAYS EQUAL "slots_to_fill" for each enrollment_id.
          3. NO OVERLAP: Each slot (1-10) is a unique resource. No multiple subjects per slot.
          4. NO DUPLICATES: Do not return the same enrollment_id more than once.
          5. TEACHER & ROOM LOCK: Avoid "teacher_busy_slots".
          6. LUNCH LOCK: Slot 5 is strictly LUNCH. No classes.
          7. TIME LIMIT: Max slot is 10. End time is 18:10.
          8. DISTRIBUTION: You MUST prioritize filling afternoon slots (6, 7, 8, 9, 10) equally with morning slots. DO NOT leave slot 6 empty if morning slots are congested. 
          9. DAILY BALANCE: Avoid scheduling more than 9 hours per day for this group. Spread them across the week.
          10. Return ONLY JSON: { "schedule": [ { "enrollment_id": number, "day": "Mon"|"Tue"|"Wed"|"Thu"|"Fri", "slot_start": number, "slot_end": number, "room_id": number } ] }
          11. PREFERENCE FLEXIBILITY: If a teacher's preferred slots are full, you MUST use ANY other available slot (especially afternoon slots 6-10) to ensure rule #1 is met.
          12. GUARANTEE: Every enrollment_id provided MUST appear in the final JSON. Skipping is strictly forbidden.
          13. THINK STEP-BY-STEP: Plan the schedule to ensure all slots fit before generating JSON.
          14. PENALTY: If any enrollment_id is missing, the schedule is invalid. You MUST include every single ID from the list.
          15. EXACT DURATION: For each enrollment, the (slot_end - slot_start + 1) MUST match "slots_to_fill" exactly. No more, no less. If you can't fit 3 hours in one block, you MUST move it to a day that has a 3-hour gap.
          16. NO FRAGMENTATION: If a subject needs 2 hours, find a 2-hour gap. If Mon is full, move the ENTIRE block to Tue/Wed/Thu/Fri. Never assign a 2-hour subject into a 1-hour space.
          17. MORNING PRIORITIZATION: You MUST actively look for gaps in slots 1, 2, 3, and 4. Do not cluster everything after slot 6 unless morning slots are genuinely blocked by busy_slots.
          18. NO GIVING UP: If a subject cannot fit due to teacher preferences, you MUST prioritize the "MANDATORY COMPLETION" rule over the "teacher_preferred_slots" rule. Place it anywhere available.
          19. UNIFORM DISTRIBUTION: Aim for an even number of classes per day. Do not schedule 8 hours on Monday and 0 hours on Wednesday. Spread them out!
          20. SLOT OFFSET & RESERVATION: Slot 1 is STRICTLY 08:10-09:10. The period 07:30-08:10 is NOT a slot for subjects. DO NOT start any subject before Slot 1.
          21. CALCULATION CHECK: If a subject needs 4 hours (slots_to_fill: 4) and starts at Slot 1, it MUST end at Slot 4 (1, 2, 3, 4). If it starts at Slot 6, it MUST end at Slot 9 (6, 7, 8, 9). Always verify (slot_end - slot_start + 1) == slots_to_fill.
          22. STRICT CONFLICT PREVENTION: For the same group or the same teacher, a subject MUST NOT start on the same slot another subject ends. If Subject A ends at Slot 4, Subject B MUST start at Slot 5 or later.
          23. MENTAL GRID VERIFICATION: Before outputting JSON, verify that each Day-Slot combination (e.g., Mon-1, Mon-2) is assigned to at most ONE enrollment_id. Overlapping slots is strictly prohibited.
          24. FINAL REVIEW: Double-check that all IDs from contextData are present. If any are missing, re-calculate to fit them in before answering.`
        },
        { role: "user", content: `Data: ${JSON.stringify(contextData)}. Action: Generate a 100% complete, balanced, and non-overlapping schedule. Ensure Slot 1-4 for 4-hour subjects and no gaps between consecutive hours.` }
      ],
      response_format: { type: "json_object" },
      // 🚩 Temperature 0.8 ช่วยให้ AI กล้าสลับวันเพื่อให้ลงตัวมากขึ้น
      temperature: 0.8,
      top_p: 0.95,
      presence_penalty: 0.1
    });

    const aiSchedule = JSON.parse(response.choices[0].message.content || "{}").schedule || [];

    // 🚩 6. [FIXED] ประมวลผลข้อมูลเพื่อส่งกลับ (ป้องกันการ Loop ซ้อนและข้อมูลหาย)
    let finalFlattenedData: any[] = [];
    const usedEnrollmentIds = new Set<number>();
    const processedKeys = new Set<string>();

    if (aiSchedule && aiSchedule.length > 0) {
      for (const s of aiSchedule) {
        // หาข้อมูลหลักจาก EnrollmentID ที่ AI ส่งมา
        const en = enrollmentsForAI.find(e => e.enrollment_id === Number(s.enrollment_id));
        if (!en || usedEnrollmentIds.has(en.enrollment_id)) continue;
        
        // ป้องกัน AI ส่งข้อมูลนอกเหนือเวลาที่กำหนด
        const start = Math.max(1, Math.min(10, Number(s.slot_start)));
        const end = Math.max(start, Math.min(10, Number(s.slot_end)));

        // สร้าง Key ป้องกันวิชาเดียวกันลงเวลาเดียวกันซ้ำ
        const uniqueKey = `${en.course_id}-${en.teacher_id}-${s.day}-${start}`;
        if (processedKeys.has(uniqueKey)) continue;

        // ดึงเครือญาติ (Siblings) ที่ต้องเรียนร่วมกันในกลุ่มที่เกี่ยวข้อง
        const siblings = targetEnrollments.filter(sib => 
          sib.course_id === en.course_id && 
          sib.teacher_id === en.teacher_id && 
          finalRelatedIds.includes(sib.group_id)
        );

        siblings.forEach(sib => {
          finalFlattenedData.push({
            enrollment_id: sib.enrollment_id,
            group_id:      sib.group_id,
            room_id:       Number(s.room_id),
            teacher_id:    sib.teacher_id,
            day_of_week:   s.day, 
            start_time:    slotToTime(start),
            end_time:      slotToTime(end, true),
            type_of_slot:  'theory',
            subject_name:  sib.courses.subject_name,
            course_code:   sib.courses.course_code,
            teacher_name:  sib.teachers.name,
            room_number:   rooms.find(r => r.room_id === Number(s.room_id))?.room_number || "RM " + s.room_id,
            slot_start:    start,
            slot_end:      end
          });
          usedEnrollmentIds.add(sib.enrollment_id);
        });
        
        processedKeys.add(uniqueKey);
      }
    }
    
    // 🚩 คืนข้อมูล JSON กลับไปหน้าบ้านอย่างเดียว (ห้ามแตะ Database)
    return NextResponse.json(finalFlattenedData);

  } catch (error: any) {
    console.error("❌ API ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}