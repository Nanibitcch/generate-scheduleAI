// เปลี่ยนจาก '@prisma/client' เป็น path ที่เราสั่ง output ไว้
const { PrismaClient } = require('./generated/client'); 
const prisma = new PrismaClient();

async function test() {
  try {
    const teachers = await prisma.teachers.findMany();
    console.log("--- เชื่อมต่อสำเร็จ! ---");
    console.log(teachers);
  } catch (e) {
    console.error(" Error:", e);
  } finally {
    await prisma.$disconnect();
  }
}
test();