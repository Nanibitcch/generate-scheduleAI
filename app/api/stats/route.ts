import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const [teachers, courses, rooms, groups] = await Promise.all([
      prisma.teachers.count(),
      prisma.courses.count(),
      prisma.rooms.count(),
      prisma.student_groups.count(),
    ]);

    return NextResponse.json({
      teachers,
      courses,
      rooms,
      groups
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}