import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// --- 1. GET: ดึงข้อมูลทั้งหมด ---
export async function GET() {
  try {
    const groups = await prisma.student_groups.findMany({
      orderBy: [
        { level: 'asc' },
        { academic_year: 'asc' },
        { major: 'asc' },
        { group_name: 'asc' }
      ]
    });
    return NextResponse.json(groups);
  } catch (error) {
    console.error("🔴 GET Error:", error);
    return NextResponse.json({ error: "ไม่สามารถดึงข้อมูลได้" }, { status: 500 });
  }
}

// --- 2. POST: บันทึกข้อมูลใหม่ (พร้อมระบบกันข้อมูลซ้ำ) ---
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { level, academic_year, major, group_name, student_count } = body;

    if (!level || !academic_year || !major || !group_name) {
      return NextResponse.json({ error: "ข้อมูลไม่ครบถ้วน" }, { status: 400 });
    }

    // 🔍 1. เช็คข้อมูลซ้ำ: ระดับ/ปี/สาขา/ห้อง ต้องไม่ซ้ำกันเป๊ะๆ
    const existingGroup = await prisma.student_groups.findFirst({
      where: {
        level: level,
        academic_year: academic_year,
        major: major.trim(),
        group_name: group_name.trim()
      }
    });

    if (existingGroup) {
      return NextResponse.json({ 
        error: `ข้อมูลกลุ่มเรียน ${level}${academic_year} ${major} ห้อง ${group_name} มีอยู่ในระบบแล้ว` 
      }, { status: 400 });
    }

    // 2. ถ้าไม่ซ้ำ ถึงจะทำการสร้างใหม่
    const newGroup = await prisma.student_groups.create({
      data: {
        level,
        academic_year,
        major: major.trim(),
        group_name: group_name.trim(),
        student_count: student_count ? Number(student_count) : 0,
      }
    });

    return NextResponse.json(newGroup);
  } catch (error) {
    console.error("🔴 POST Error:", error);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 500 });
  }
}

// --- 3. DELETE: ลบข้อมูล ---
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) return NextResponse.json({ error: "ต้องระบุ ID" }, { status: 400 });

    await prisma.student_groups.delete({
      where: { group_id: Number(id) }
    });

    return NextResponse.json({ message: "ลบสำเร็จ" });
  } catch (error) {
    console.error("🔴 DELETE Error:", error);
    return NextResponse.json({ error: "ลบไม่สำเร็จ" }, { status: 500 });
  }
}

// --- 4. PUT: แก้ไขข้อมูล (พร้อมระบบกันข้อมูลซ้ำ) ---
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { group_id, level, academic_year, major, group_name, student_count } = body;

    if (!group_id) return NextResponse.json({ error: "ต้องระบุ ID" }, { status: 400 });

    // 🔍 1. เช็คว่าชื่อใหม่ที่แก้ไปซ้ำกับกลุ่มอื่นไหม (ที่ไม่ใช่ ID ตัวเอง)
    const duplicate = await prisma.student_groups.findFirst({
      where: {
        level: level,
        academic_year: academic_year,
        major: major.trim(),
        group_name: group_name.trim(),
        NOT: { group_id: Number(group_id) }
      }
    });

    if (duplicate) {
      return NextResponse.json({ error: "ข้อมูลที่แก้ไขไปซ้ำกับกลุ่มเรียนอื่นที่มีอยู่แล้ว" }, { status: 400 });
    }

    const updated = await prisma.student_groups.update({
      where: { group_id: Number(group_id) },
      data: {
        level,
        academic_year,
        major: major.trim(),
        group_name: group_name.trim(),
        student_count: student_count ? Number(student_count) : 0,
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("🔴 PUT Error:", error);
    return NextResponse.json({ error: "แก้ไขไม่สำเร็จ" }, { status: 500 });
  }
}