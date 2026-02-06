import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 1. GET: ดึงข้อมูลรายวิชา
export async function GET() {
  try {
    const courses = await prisma.courses.findMany({ 
      orderBy: { course_id: 'desc' } 
    });
    return NextResponse.json(courses);
  } catch (error) {
    return NextResponse.json({ error: "ไม่สามารถดึงข้อมูลได้" }, { status: 500 });
  }
}

// 2. POST: เพิ่มรายวิชาใหม่ (🚩 เพิ่ม Logic ล้างช่องว่างข้อมูล)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { course_code, subject_name, theory_hours, lab_hours } = body;

    if (!course_code || !subject_name) {
      return NextResponse.json({ error: "กรุณากรอกรหัสวิชาและชื่อวิชา" }, { status: 400 });
    }

    const newCourse = await prisma.courses.create({
      data: {
        course_code: course_code.trim(),
        subject_name: subject_name.trim(),
        theory_hours: parseInt(theory_hours) || 0,
        lab_hours: parseInt(lab_hours) || 0,
      },
    });

    return NextResponse.json(newCourse, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "รหัสวิชานี้มีอยู่ในระบบแล้ว" }, { status: 400 });
    }
    return NextResponse.json({ error: "บันทึกข้อมูลไม่สำเร็จ" }, { status: 500 });
  }
}

// 3. PUT: แก้ไขข้อมูลรายวิชา (🚩 ฉลาดขึ้น: เช็คความซ้ำซ้อนแบบละเอียด)
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { course_id, course_code, subject_name, theory_hours, lab_hours } = body;

    if (!course_id) {
      return NextResponse.json({ error: "ไม่พบ ID ที่ต้องการแก้ไข" }, { status: 400 });
    }

    const duplicate = await prisma.courses.findFirst({
      where: {
        course_code: course_code.trim(),
        NOT: { course_id: parseInt(course_id) }
      }
    });

    if (duplicate) {
      return NextResponse.json({ error: "รหัสวิชานี้ถูกใช้โดยรายวิชาอื่นแล้ว" }, { status: 400 });
    }

    const updatedCourse = await prisma.courses.update({
      where: { course_id: parseInt(course_id) },
      data: {
        course_code: course_code.trim(),
        subject_name: subject_name.trim(),
        theory_hours: parseInt(theory_hours) || 0,
        lab_hours: parseInt(lab_hours) || 0,
      },
    });

    return NextResponse.json(updatedCourse);
  } catch (error) {
    console.error("PUT Error:", error);
    return NextResponse.json({ error: "แก้ไขข้อมูลไม่สำเร็จ" }, { status: 500 });
  }
}

// 4. DELETE: ลบรายวิชา (🚩 ป้องกันข้อมูลกำพร้าในระบบ)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: "กรุณาระบุ ID ที่ต้องการลบ" }, { status: 400 });
    }

    // 💡 ก่อนลบ: เช็คว่าวิชานี้ถูก "มอบหมายงานสอน" (Enrollments) ไว้หรือยัง
    const inUse = await prisma.course_enrollments.findFirst({
      where: { course_id: parseInt(id) }
    });

    if (inUse) {
      return NextResponse.json({ 
        error: "ลบไม่ได้: วิชานี้ถูกมอบหมายงานสอนไว้แล้ว กรุณาไปยกเลิกการมอบหมายก่อน" 
      }, { status: 400 });
    }

    await prisma.courses.delete({
      where: { course_id: parseInt(id) },
    });

    return NextResponse.json({ message: "ลบรายวิชาสำเร็จ" });
  } catch (error) {
    console.error("DELETE Error:", error);
    return NextResponse.json({ error: "เซิร์ฟเวอร์ขัดข้อง ไม่สามารถลบได้" }, { status: 500 });
  }
}