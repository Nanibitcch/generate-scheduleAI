import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// --- 1. POST: สร้างกลุ่มเรียนใหม่ (แบบ Standalone) ---
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      group_name, 
      student_count, 
      level, 
      major, 
      academic_year 
    } = body;

    if (!group_name) {
      return NextResponse.json({ error: "กรุณากรอกชื่อกลุ่มเรียน" }, { status: 400 });
    }

    const newGroup = await prisma.student_groups.create({
      data: {
        group_name: group_name,
        student_count: student_count ? parseInt(String(student_count)) : 0,
        level: level || "",
        major: major || "",
        academic_year: academic_year || "2568",
        // 🚩 ลบ parent_group_id ออกแล้ว เพราะเราแยกตารางไปแล้ว
      },
    });

    return NextResponse.json(newGroup, { status: 201 });
  } catch (error: any) {
    console.error("POST Group Error:", error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "ชื่อกลุ่มเรียนนี้มีอยู่แล้วในระบบ" }, { status: 400 });
    }
    return NextResponse.json({ error: "บันทึกข้อมูลไม่สำเร็จ" }, { status: 500 });
  }
}

// --- 2. PUT: แก้ไขข้อมูลกลุ่ม ---
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { 
      group_id,
      group_name, 
      student_count, 
      level, 
      major, 
      academic_year
    } = body;

    if (!group_id) {
      return NextResponse.json({ error: "ไม่พบ Group ID ที่ต้องการแก้ไข" }, { status: 400 });
    }

    const updatedGroup = await prisma.student_groups.update({
      where: { group_id: parseInt(String(group_id)) },
      data: {
        group_name,
        student_count: student_count ? parseInt(String(student_count)) : 0,
        level,
        major,
        academic_year,
      },
    });

    return NextResponse.json(updatedGroup);
  } catch (error: any) {
    console.error("PUT Group Error:", error);
    return NextResponse.json({ error: "อัปเดตข้อมูลไม่สำเร็จ" }, { status: 500 });
  }
}

// --- 3. GET: ดึงข้อมูลทั้งหมด (พร้อมข้อมูลการ Mapping เรียนรวม) ---
export async function GET() {
  try {
    const groups = await prisma.student_groups.findMany({ 
      orderBy: { group_id: 'desc' },
      include: {
        // 🚩 เปลี่ยนจาก parent_group มาดึงจากตาราง Mapping แทน
        mapping_as_main: {
          include: { sub_group: true }
        },
        mapping_as_sub: {
          include: { main_group: true }
        }
      }
    });
    return NextResponse.json(groups);
  } catch (error: any) {
    console.error("GET Groups Error:", error);
    return NextResponse.json({ error: "ดึงข้อมูลล้มเหลว" }, { status: 500 });
  }
}

// --- 4. DELETE: ลบกลุ่มเรียน ---
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    await prisma.student_groups.delete({
      where: { group_id: parseInt(id) }
    });

    return NextResponse.json({ message: "ลบกลุ่มเรียนสำเร็จ" });
  } catch (error: any) {
    return NextResponse.json({ error: "ไม่สามารถลบได้ (กลุ่มนี้อาจมีการตั้งค่าเรียนร่วมอยู่)" }, { status: 500 });
  }
}