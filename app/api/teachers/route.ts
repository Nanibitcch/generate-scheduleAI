import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const teachers = await prisma.teachers.findMany({
      orderBy: { teacher_id: 'desc' },
    });
    return NextResponse.json(teachers);
  } catch (error) {
    return NextResponse.json({ error: "ดึงข้อมูลไม่สำเร็จ" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, first_name, last_name, max_hours } = body;

    const fName = first_name?.trim();
    const lName = last_name?.trim();

    // 🔍 เช็คชื่อ-นามสกุลซ้ำ (ตรวจสอบทั้งสองฟิลด์ควบคู่กัน)
    const existing = await prisma.teachers.findFirst({
      where: { 
        first_name: fName,
        last_name: lName 
      }
    });

    if (existing) {
      return NextResponse.json({ error: `อาจารย์ "${fName} ${lName}" มีอยู่ในระบบแล้ว` }, { status: 400 });
    }

    const newTeacher = await prisma.teachers.create({
      data: {
        title, // เช่น นาย, นางสาว, ดร.
        first_name: fName,
        last_name: lName,
        name: `${title}${fName} ${lName}`, // เก็บชื่อเต็มไว้เผื่อใช้แสดงผลไวๆ
        max_hours_per_week: parseInt(max_hours) || 20,
      },
    });

    return NextResponse.json(newTeacher, { status: 201 });
  } catch (error) {
    console.error("POST Error:", error);
    return NextResponse.json({ error: "บันทึกข้อมูลไม่สำเร็จ" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { teacher_id, title, first_name, last_name, max_hours } = body;

    if (!teacher_id) return NextResponse.json({ error: "ระบุ ID อาจารย์" }, { status: 400 });

    const fName = first_name?.trim();
    const lName = last_name?.trim();

    // 🔍 เช็คชื่อซ้ำกับคนอื่น
    const duplicate = await prisma.teachers.findFirst({
      where: {
        first_name: fName,
        last_name: lName,
        teacher_id: { not: parseInt(teacher_id) }
      }
    });

    if (duplicate) {
      return NextResponse.json({ error: `ชื่อ-นามสกุล "${fName} ${lName}" ถูกใช้โดยอาจารย์ท่านอื่นแล้ว` }, { status: 400 });
    }

    const updated = await prisma.teachers.update({
      where: { teacher_id: parseInt(teacher_id) },
      data: { 
        title,
        first_name: fName,
        last_name: lName,
        name: `${title}${fName} ${lName}`,
        max_hours_per_week: parseInt(max_hours)
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "แก้ไขไม่สำเร็จ" }, { status: 500 });
  }
}

// DELETE (เหมือนเดิม)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: "ระบุ ID" }, { status: 400 });

    await prisma.teachers.delete({ where: { teacher_id: parseInt(id) } });
    return NextResponse.json({ message: "ลบสำเร็จ" });
  } catch (error) {
    return NextResponse.json({ error: "ลบไม่สำเร็จ" }, { status: 500 });
  }
}