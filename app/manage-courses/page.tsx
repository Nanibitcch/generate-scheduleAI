'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, BookOpen, Search, Hash, Clock, Plus } from 'lucide-react'

export default function ManageCoursesPage() {
  const [courses, setCourses] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      const res = await fetch('/api/enrollments') // ใช้ API เดิมที่ดึงข้อมูลรวมมาให้
      const data = await res.json()
      setCourses(data.courses || [])
    } catch (err) {
      console.error("Fetch error:", err)
    } finally {
      setLoading(false)
    }
  }

  // 🔍 กรองวิชาตามที่ค้นหา (รหัสวิชา หรือ ชื่อวิชา)
  const filteredCourses = courses.filter(c => 
    c.course_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.subject_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen p-8 bg-slate-50 text-black">
      <button onClick={() => router.push('/')} className="flex items-center text-slate-500 mb-8 hover:text-blue-600 transition-colors font-medium">
        <ArrowLeft className="w-4 h-4 mr-2" /> กลับหน้าหลัก
      </button>

      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-end mb-8">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <div className="bg-emerald-600 p-3 rounded-2xl shadow-lg shadow-emerald-200">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900">รายวิชาทั้งหมด</h1>
            </div>
            <p className="text-slate-500">ตรวจสอบและจัดการฐานข้อมูลรายวิชาในระบบ</p>
          </div>
          <div className="text-right text-slate-400 text-sm font-medium">
            ทั้งหมด {courses.length} รายวิชา
          </div>
        </header>

        {/* 🔍 Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="ค้นหาด้วยรหัสวิชา หรือ ชื่อวิชา..." 
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="p-5 font-bold text-sm uppercase tracking-wider">รหัสวิชา</th>
                <th className="p-5 font-bold text-sm uppercase tracking-wider">ชื่อรายวิชา</th>
                <th className="p-5 font-bold text-sm uppercase tracking-wider text-center">ทฤษฎี</th>
                <th className="p-5 font-bold text-sm uppercase tracking-wider text-center">ปฏิบัติ</th>
                <th className="p-5 font-bold text-sm uppercase tracking-wider text-center">รวมคาบ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="p-10 text-center text-slate-400">กำลังโหลดข้อมูล...</td></tr>
              ) : filteredCourses.length === 0 ? (
                <tr><td colSpan={5} className="p-10 text-center text-slate-400 italic">ไม่พบข้อมูลรายวิชา</td></tr>
              ) : (
                filteredCourses.map((course) => (
                  <tr key={course.course_id} className="hover:bg-emerald-50/30 transition-colors group">
                    <td className="p-5 font-mono font-bold text-emerald-600">{course.course_code}</td>
                    <td className="p-5">
                      <div className="font-semibold text-slate-800">{course.subject_name}</div>
                      {course.is_remedial && <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">วิชาปรับพื้นฐาน</span>}
                    </td>
                    <td className="p-5 text-center text-slate-600">{course.theory_hours}</td>
                    <td className="p-5 text-center text-slate-600">{course.lab_hours}</td>
                    <td className="p-5 text-center">
                      <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-lg font-bold text-sm">
                        {(course.theory_hours || 0) + (course.lab_hours || 0)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}