import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

// ป้องกันการสร้าง Prisma Instance ซ้ำซ้อนหลายตัว (Best Practice สำหรับ Next.js Dev)
const prismaGlobal = global as unknown as { prisma: PrismaClient }
const prisma = prismaGlobal.prisma || new PrismaClient()
if (process.env.NODE_ENV !== 'production') prismaGlobal.prisma = prisma

export async function POST(req: Request) {
  try {
    // 🚩 เช็คว่ามีข้อมูลส่งมาจริงมั้ย
    const body = await req.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบ" }, { status: 400 })
    }

    // 🚩 ค้นหา User ในตาราง users
    const user = await prisma.users.findUnique({
      where: { username: String(username) }
    })

    // ตรวจสอบ User และ Password (Plain Text ตามที่มึงขอไว้ก่อน)
    if (!user || user.password !== password) {
      return NextResponse.json({ error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 })
    }

    // 🚩 ล็อคอินสำเร็จ ส่งข้อมูลจำเป็นกลับไป
    return NextResponse.json({ 
      message: "Login success", 
      user: { 
        id: user.user_id, 
        name: user.name,
        role: user.role // ส่ง Role กลับไปด้วยเผื่อหน้าบ้านต้องใช้
      } 
    })

  } catch (err: any) {
    console.error("❌ Login API Error:", err)
    return NextResponse.json({ error: "Database error: " + err.message }, { status: 500 })
  }
}

// 🚩 ป้องกัน 405 โดยการดักบอกว่าถ้ามาท่าอื่นกูไม่คุยด้วย
export async function GET() {
  return NextResponse.json({ error: "Method GET not allowed. Use POST instead." }, { status: 405 })
}