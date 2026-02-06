import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 🚩 [MODIFIED] ส่วนดึงข้อมูลตารางสอน (GET) - แก้เพื่อให้ข้อมูลวิชาโผล่แน่นอน!
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId');

    if (!groupId) {
      return NextResponse.json({ error: "ไม่พบ Group ID" }, { status: 400 });
    }

    // 1. หา "เครือญาติ" (Related Groups)
    const groupInfo = await prisma.student_groups.findUnique({
      where: { group_id: parseInt(groupId) },
      include: { mapping_as_main: true, mapping_as_sub: true }
    });

    const relatedIds = [
      parseInt(groupId),
      ...(groupInfo?.mapping_as_main.map(m => m.sub_group_id) || []),
      ...(groupInfo?.mapping_as_sub.map(m => m.main_group_id) || [])
    ];

    // 2. ดึงตารางสอน
    const schedules = await prisma.schedules.findMany({
      where: { group_id: { in: relatedIds } },
      include: {
        course_enrollments: {
          include: {
            courses: true,  // 🚩 ชื่อวิชา
            teachers: true  // 🚩 ชื่อครู
          }
        },
        rooms: true // 🚩 ข้อมูลห้อง
      }
    });

    // 🚀 [THE TRICK] แปลงข้อมูลให้หน้าบ้านเรียกใช้ง่ายๆ ไม่ต้องซ้อนเยอะ
    const flattenedSchedules = schedules.map(item => ({
      ...item,
      // ยัดชื่อวิชาและรหัสวิชาออกมาไว้ข้างนอกเลยกันเหนียว
      subject_name: item.course_enrollments?.courses?.subject_name || "ไม่มีชื่อวิชา",
      course_code: item.course_enrollments?.courses?.course_code || "",
      teacher_name: item.course_enrollments?.teachers?.name || "ไม่ระบุอาจารย์",
      room_number: item.rooms?.room_number || "ไม่ระบุห้อง"
    }));

    return NextResponse.json(flattenedSchedules);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 🚩 [ORIGINAL] ส่วนบันทึกข้อมูล (POST) - ห้ามลบ! (เหมือนเดิมเป๊ะ)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { groupId, schedule } = body;

    if (!groupId || !schedule || !Array.isArray(schedule)) {
      return NextResponse.json({ error: "ข้อมูลไม่ครบถ้วนหรือรูปแบบไม่ถูกต้อง" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const groupInfo = await tx.student_groups.findUnique({
        where: { group_id: parseInt(groupId) },
        include: { mapping_as_main: true, mapping_as_sub: true }
      });

      const relatedIds = [
        parseInt(groupId),
        ...(groupInfo?.mapping_as_main.map(m => m.sub_group_id) || []),
        ...(groupInfo?.mapping_as_sub.map(m => m.main_group_id) || [])
      ];

      await tx.schedules.deleteMany({
        where: { group_id: { in: relatedIds } }
      });

      const getSlotTime = (slot: number, isEnd = false) => {
        const hour = 7 + slot + (isEnd ? 1 : 0);
        const date = new Date();
        date.setUTCHours(hour, 10, 0, 0);
        return date;
      };

      const dataToSave = schedule.map((s: any) => ({
        enrollment_id: parseInt(s.enrollment_id),
        room_id:       parseInt(s.room_id),
        teacher_id:    parseInt(s.teacher_id),
        group_id:      parseInt(s.group_id),
        day_of_week:   (s.day || s.day_of_week) as any,
        start_time:    getSlotTime(parseInt(s.slot_start || s.start_slot)),
        end_time:      getSlotTime(parseInt(s.slot_end || s.end_slot), true),
        type_of_slot:  'theory' as any,
        is_confirmed:  true
      }));

      return await tx.schedules.createMany({
        data: dataToSave
      });
    });

    return NextResponse.json({ 
      message: "บันทึกตารางสอนสำเร็จ", 
      count: result.count 
    });

  } catch (error: any) {
    console.error("Critical Save Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


// 🚩 [ORIGINAL] ส่วนลบข้อมูลตาราง (DELETE) - ห้ามลบ! (เหมือนเดิมเป๊ะ)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId');

    if (!groupId) {
      return NextResponse.json({ error: "ไม่พบ Group ID" }, { status: 400 });
    }

    const deleted = await prisma.schedules.deleteMany({
      where: { group_id: parseInt(groupId) }
    });

    return NextResponse.json({ message: "ลบตารางสอนสำเร็จ", count: deleted.count });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}