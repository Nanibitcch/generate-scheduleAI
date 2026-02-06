import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// --- 🚩 1. GET: ดึงรายการการจับคู่เรียนรวมทั้งหมด ---
export async function GET() {
  try {
    const mappings = await prisma.combined_group_mappings.findMany({
      include: {
        // ดึงข้อมูลกลุ่มหลักมาโชว์
        main_group: {
          select: { group_name: true, major: true, level: true, academic_year: true }
        },
        // ดึงข้อมูลกลุ่มรองที่มาเชื่อม
        sub_group: {
          select: { group_name: true, major: true, level: true, academic_year: true }
        }
      },
      orderBy: { mapping_id: 'desc' }
    });
    return NextResponse.json(mappings);
  } catch (error) {
    console.error("GET Mapping Error:", error);
    return NextResponse.json({ error: "ดึงข้อมูลการจับคู่ล้มเหลว" }, { status: 500 });
  }
}

// --- 🚩 2. POST: สร้างการจับคู่ใหม่ (Mapping) ---
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { main_group_id, sub_group_id, combined_name } = body;

    // ตรวจสอบเบื้องต้น
    if (main_group_id === sub_group_id) {
      return NextResponse.json({ error: "ห้ามเลือกห้องหลักและห้องรองเป็นห้องเดียวกัน" }, { status: 400 });
    }

    // ตรวจสอบว่ากลุ่มรองนี้เคยไปผูกกับใครไว้หรือยัง (เพราะ 1 ห้องเรียนร่วมได้แค่ 1 ที่)
    const existingSub = await prisma.combined_group_mappings.findUnique({
      where: { sub_group_id: parseInt(sub_group_id) }
    });

    if (existingSub) {
      return NextResponse.json({ error: "ห้องรองนี้มีการตั้งค่าเรียนรวมไว้แล้ว" }, { status: 400 });
    }

    const newMapping = await prisma.combined_group_mappings.create({
      data: {
        main_group_id: parseInt(main_group_id),
        sub_group_id: parseInt(sub_group_id),
        combined_name: combined_name || "Combined Group"
      },
    });

    return NextResponse.json(newMapping, { status: 201 });
  } catch (error: any) {
    console.error("POST Mapping Error:", error);
    return NextResponse.json({ error: "ไม่สามารถบันทึกการจับคู่ได้" }, { status: 500 });
  }
}

// --- 🚩 3. DELETE: ยกเลิกการจับคู่ (ลบเฉพาะ Mapping) ---
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    await prisma.combined_group_mappings.delete({
      where: { mapping_id: parseInt(id) }
    });

    return NextResponse.json({ message: "ยกเลิกการเรียนรวมสำเร็จ" });
  } catch (error) {
    return NextResponse.json({ error: "ไม่สามารถลบข้อมูลได้" }, { status: 500 });
  }
}