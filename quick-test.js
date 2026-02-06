const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log("กำลังเชื่อมต่อฐานข้อมูล...");
    const teachers = await prisma.teachers.findMany();
    console.log("✅ เชื่อมต่อสำเร็จ! ข้อมูลอาจารย์:");
    console.table(teachers); // แสดงผลเป็นตารางสวยงาม
  } catch (error) {
    console.error("❌ เกิดข้อผิดพลาดในการเชื่อมต่อ:");
    console.error(error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();