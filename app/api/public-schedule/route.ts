import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const groupId = searchParams.get('groupId');

  try {
    const schedules = await prisma.schedules.findMany({
      where: groupId ? { course_enrollments: { group_id: parseInt(groupId) } } : {},
      include: {
        course_enrollments: {
          include: {
            courses: true,
            teachers: true,
            student_groups: true
          }
        },
        rooms: true
      },
      orderBy: { start_time: 'asc' }
    });
    return NextResponse.json(schedules);
  } catch (error) {
    return NextResponse.json({ error: "ดึงข้อมูลตารางสอนไม่สำเร็จ" }, { status: 500 });
  }
}