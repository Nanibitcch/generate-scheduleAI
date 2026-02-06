import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 🚩 [NEW] 1. GET: ดึงข้อมูลครบเซ็ต (มึงลืมอันนี้ ข้อมูลเลยไม่ขึ้น!)
export async function GET() {
  try {
    const [courses, teachers, groups, enrollments, rooms] = await Promise.all([
      prisma.courses.findMany({ orderBy: { course_code: 'asc' } }),
      prisma.teachers.findMany({ orderBy: { name: 'asc' } }),
      prisma.student_groups.findMany({ 
        include: { mapping_as_main: true, mapping_as_sub: true }, 
        orderBy: { group_name: 'asc' } 
      }),
      prisma.course_enrollments.findMany({
        include: {
          courses: true,
          teachers: true,
          student_groups: true,
          preferred_room: true,
        },
        orderBy: { enrollment_id: 'desc' }
      }),
      prisma.rooms.findMany({ orderBy: { room_number: 'asc' } })
    ]);

    return NextResponse.json({ courses, teachers, groups, enrollments, rooms });
  } catch (error: any) {
    console.error("GET Error:", error);
    return NextResponse.json({ error: "ดึงข้อมูลล้มเหลว: " + error.message }, { status: 500 });
  }
}

// 🚩 [HELPER] หา ID ทุุกห้องที่เป็นเครือญาติกัน (ใช้เฉพาะเมื่อเป็น Combined)
async function getRelatedGroupIds(groupId: number) {
  const currentGroup = await prisma.student_groups.findUnique({
    where: { group_id: groupId },
    include: { mapping_as_main: true, mapping_as_sub: true }
  });

  let ids = [groupId];
  if (currentGroup?.mapping_as_main.length) {
    ids.push(...currentGroup.mapping_as_main.map(m => m.sub_group_id));
  } else if (currentGroup?.mapping_as_sub.length) {
    const mainId = currentGroup.mapping_as_sub[0].main_group_id;
    const allSiblings = await prisma.combined_group_mappings.findMany({ where: { main_group_id: mainId } });
    ids = [mainId, ...allSiblings.map(s => s.sub_group_id)];
  }
  return Array.from(new Set(ids));
}

// 2. POST: สร้างงานสอน (รองรับทั้งห้องเดี่ยวและห้องรวม)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { course_id, teacher_id, group_id, room_id, is_combined } = body;

    if (!course_id || !teacher_id || !group_id) {
      return NextResponse.json({ error: "กรุณาระบุข้อมูลให้ครบถ้วน" }, { status: 400 });
    }

    // กรณีจัด "ห้องเดี่ยว"
    if (!is_combined) {
      const singleEnrollment = await prisma.course_enrollments.create({
        data: {
          course_id: parseInt(course_id),
          teacher_id: parseInt(teacher_id),
          group_id: parseInt(group_id),
          preferred_room_id: room_id ? parseInt(room_id) : null,
          is_combined: false 
        }
      });
      return NextResponse.json(singleEnrollment, { status: 201 });
    }

    // กรณี "เรียนร่วมกัน" (Combined)
    const finalGroupIds = await getRelatedGroupIds(parseInt(group_id));
    const newEnrollments = await prisma.$transaction(
      finalGroupIds.map(id => 
        prisma.course_enrollments.create({
          data: {
            course_id: parseInt(course_id),
            teacher_id: parseInt(teacher_id),
            group_id: id,
            preferred_room_id: room_id ? parseInt(room_id) : null,
            is_combined: true 
          }
        })
      )
    );
    return NextResponse.json(newEnrollments[0], { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ: " + error.message }, { status: 500 });
  }
}

// 3. PUT: แก้ไขงานสอน
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { enrollment_id, course_id, teacher_id, room_id, is_combined } = body;

    const current = await prisma.course_enrollments.findUnique({
      where: { enrollment_id: parseInt(enrollment_id) }
    });
    if (!current) return NextResponse.json({ error: "ไม่พบข้อมูล" }, { status: 404 });

    if (current.is_combined) {
      const relatedGroupIds = await getRelatedGroupIds(current.group_id);
      await prisma.course_enrollments.updateMany({
        where: {
          group_id: { in: relatedGroupIds },
          course_id: current.course_id,
          teacher_id: current.teacher_id
        },
        data: {
          course_id: parseInt(course_id),
          teacher_id: parseInt(teacher_id),
          preferred_room_id: room_id ? parseInt(room_id) : null,
        }
      });
    } else {
      await prisma.course_enrollments.update({
        where: { enrollment_id: parseInt(enrollment_id) },
        data: {
          course_id: parseInt(course_id),
          teacher_id: parseInt(teacher_id),
          preferred_room_id: room_id ? parseInt(room_id) : null,
          is_combined: !!is_combined
        }
      });
    }

    return NextResponse.json({ message: "อัปเดตสำเร็จ" });
  } catch (error: any) {
    return NextResponse.json({ error: "แก้ไขไม่สำเร็จ: " + error.message }, { status: 500 });
  }
}

// 4. DELETE: ลบงานสอน
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: "ระบุ ID" }, { status: 400 });

    const target = await prisma.course_enrollments.findUnique({
      where: { enrollment_id: parseInt(id) }
    });
    if (!target) return NextResponse.json({ error: "ไม่พบข้อมูล" }, { status: 404 });

    if (target.is_combined) {
      const relatedGroupIds = await getRelatedGroupIds(target.group_id);
      await prisma.course_enrollments.deleteMany({
        where: {
          group_id: { in: relatedGroupIds },
          course_id: target.course_id,
          teacher_id: target.teacher_id
        }
      });
    } else {
      await prisma.course_enrollments.delete({
        where: { enrollment_id: parseInt(id) }
      });
    }

    return NextResponse.json({ message: "ยกเลิกสำเร็จ" });
  } catch (error: any) {
    return NextResponse.json({ error: "ลบไม่สำเร็จ: " + error.message }, { status: 500 });
  }
}