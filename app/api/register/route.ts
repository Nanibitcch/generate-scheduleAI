import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(req: Request) {
  try {
    const { name, username, password } = await req.json()

    // 🚩 1. เช็คว่ามี Username นี้หรือยัง
    const existingUser = await prisma.users.findUnique({
      where: { username }
    })

    if (existingUser) {
      return NextResponse.json({ error: "Username นี้มีคนใช้แล้วนะไอ้สอง!" }, { status: 400 })
    }

    // 🚩 2. สร้าง User ใหม่ (มึงอย่าลืมไปลง bcrypt เพื่อ hash password ในอนาคตนะ)
    const newUser = await prisma.users.create({
      data: {
        name,
        username,
        password, // ใส่ตรงๆ ไปก่อนเดี๋ยวค่อยมาใส่ bcrypt
        role: 'staff' // ค่าเริ่มต้นเป็น staff
      }
    })

    return NextResponse.json({ message: "Registered successfully", user: newUser }, { status: 201 })
  } catch (err: any) {
    console.error("Register Error:", err)
    return NextResponse.json({ error: "DB พังว่ะ หรือลืมรัน prisma generate?" }, { status: 500 })
  }
}