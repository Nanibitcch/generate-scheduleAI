import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 1. ดึงข้อมูลห้องเรียนทั้งหมด (GET)
export async function GET() {
  try {
    const rooms = await prisma.rooms.findMany({
      orderBy: { room_id: 'desc' }
    });
    return NextResponse.json(rooms);
  } catch (error) {
    return NextResponse.json({ error: "ดึงข้อมูลไม่สำเร็จ" }, { status: 500 });
  }
}

// 2. เพิ่มข้อมูลห้องเรียน (POST) - พร้อมระบบกันเลขห้องซ้ำ
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { room_name, room_number, capacity } = body;
    const trimmedNumber = room_number?.trim();

    if (!room_name || !trimmedNumber) {
      return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" }, { status: 400 });
    }

    // 🔍 เช็คว่ามีเลขห้องนี้อยู่ในระบบหรือยัง
    const existingRoom = await prisma.rooms.findFirst({
      where: { room_number: trimmedNumber }
    });

    if (existingRoom) {
      return NextResponse.json(
        { error: `เลขห้อง "${trimmedNumber}" มีอยู่ในระบบแล้ว` }, 
        { status: 400 }
      );
    }

    const newRoom = await prisma.rooms.create({
      data: {
        room_name: room_name,
        room_number: trimmedNumber,
        capacity: capacity ? parseInt(capacity.toString()) : null,
      },
    });

    return NextResponse.json(newRoom, { status: 201 });
  } catch (error) {
    console.error("POST Error:", error);
    return NextResponse.json({ error: "บันทึกข้อมูลไม่สำเร็จ" }, { status: 500 });
  }
}

// 3. แก้ไขข้อมูลห้องเรียน (PUT) - เพิ่มฟังก์ชันแก้ไข
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { room_id, room_name, room_number, capacity } = body;
    const trimmedNumber = room_number?.trim();

    if (!room_id) return NextResponse.json({ error: "ไม่พบ ID ที่ต้องการแก้ไข" }, { status: 400 });

    // 🔍 เช็คว่าเลขห้องใหม่ไปซ้ำกับห้องอื่นไหม (ที่ไม่ใช่ ID ตัวเอง)
    const duplicate = await prisma.rooms.findFirst({
      where: {
        room_number: trimmedNumber,
        NOT: { room_id: parseInt(room_id) }
      }
    });

    if (duplicate) {
      return NextResponse.json({ error: `เลขห้อง "${trimmedNumber}" ถูกใช้โดยห้องอื่นแล้ว` }, { status: 400 });
    }

    const updatedRoom = await prisma.rooms.update({
      where: { room_id: parseInt(room_id) },
      data: {
        room_name: room_name,
        room_number: trimmedNumber,
        capacity: capacity ? parseInt(capacity.toString()) : null,
      },
    });

    return NextResponse.json(updatedRoom);
  } catch (error) {
    console.error("PUT Error:", error);
    return NextResponse.json({ error: "แก้ไขข้อมูลไม่สำเร็จ" }, { status: 500 });
  }
}

// 4. ลบข้อมูลห้องเรียน (DELETE)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: "ระบุ ID ที่ต้องการลบ" }, { status: 400 });

    await prisma.rooms.delete({
      where: { room_id: parseInt(id) },
    });

    return NextResponse.json({ message: "ลบห้องเรียนสำเร็จ" });
  } catch (error) {
    console.error("DELETE Error:", error);
    return NextResponse.json({ error: "ลบไม่ได้ (ห้องนี้อาจถูกใช้ในตารางสอนอยู่)" }, { status: 500 });
  }
}