import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// --- 1. GET: ดึงข้อมูลอาจารย์และรายการเวลาทั้งหมด ---
export async function GET() {
  try {
    const teachers = await prisma.teachers.findMany({ orderBy: { name: 'asc' } });
    const savedSlots = await prisma.teacher_preferred_slots.findMany({
      include: { teachers: true },
      orderBy: [{ teacher_id: 'asc' }, { day_of_week: 'asc' }]
    });
    
    return NextResponse.json({ teachers, savedSlots });
  } catch (error) {
    return NextResponse.json({ error: "ดึงข้อมูลล้มเหลว" }, { status: 500 });
  }
}

// --- 2. POST: บันทึกข้อมูลใหม่ ---
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { teacher_id, day_of_week, start_time, end_time } = body;

    const startTime = new Date(`1970-01-01T${start_time}:00.000Z`);
    const endTime = new Date(`1970-01-01T${end_time}:00.000Z`);

    const newSlot = await prisma.teacher_preferred_slots.upsert({
      where: {
        teacher_id_day_of_week_start_time: {
          teacher_id: parseInt(teacher_id),
          day_of_week: day_of_week,
          start_time: startTime,
        }
      },
      update: { end_time: endTime }, // ถ้าเจอตัวเดิม ให้เปลี่ยนแค่เวลาเลิก
      create: {
        teacher_id: parseInt(teacher_id),
        day_of_week: day_of_week,
        start_time: startTime,
        end_time: endTime,
      },
    });

    return NextResponse.json(newSlot);
  } catch (error: any) {
    console.error("POST Error:", error);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 500 });
  }
}

// --- 3. DELETE: ลบเงื่อนไขเวลา (ใช้ Composite Key) ---
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const teacher_id = searchParams.get('teacher_id');
    const day_of_week = searchParams.get('day_of_week');
    const start_time = searchParams.get('start_time');

    if (!teacher_id || !day_of_week || !start_time) {
      return NextResponse.json({ error: "ข้อมูลไม่ครบถ้วน" }, { status: 400 });
    }

    await prisma.teacher_preferred_slots.delete({
      where: {
        teacher_id_day_of_week_start_time: {
          teacher_id: parseInt(teacher_id),
          day_of_week: day_of_week as any,
          start_time: new Date(start_time),
        }
      }
    });

    return NextResponse.json({ message: "ลบเงื่อนไขเวลาสำเร็จ" });
  } catch (error) {
    console.error("DELETE Error:", error);
    return NextResponse.json({ error: "ลบข้อมูลไม่สำเร็จ" }, { status: 500 });
  }
}