'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, School, Hash, Users, Trash2, Loader2 } from 'lucide-react'

export default function ManageRoomsPage() {
  const [rooms, setRooms] = useState<any[]>([])
  const [roomName, setRoomName] = useState('')
  const [roomNumber, setRoomNumber] = useState('')
  const [capacity, setCapacity] = useState(30)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const router = useRouter()

  // 1. ดึงข้อมูลห้องเรียนทั้งหมด
  const fetchRooms = async () => {
    try {
      const res = await fetch('/api/rooms')
      const data = await res.json()
      if (Array.isArray(data)) {
        setRooms(data)
      }
    } catch (err) {
      console.error("Fetch error:", err)
    } finally {
      setFetching(false)
    }
  }

  useEffect(() => {
    fetchRooms()
  }, [])

  // 2. บันทึกข้อมูลห้องเรียน
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          room_name: roomName, 
          room_number: roomNumber,
          capacity 
        }),
      })
      if (res.ok) {
        alert('บันทึกข้อมูลห้องเรียนสำเร็จ!')
        setRoomName('')
        setRoomNumber('')
        setCapacity(30)
        fetchRooms() // รีเฟรชตารางหลังบันทึก
      } else {
        const errorData = await res.json()
        alert(`เกิดข้อผิดพลาด: ${errorData.error}`)
      }
    } catch (err) {
      alert('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้')
    } finally {
      setLoading(false)
    }
  }

  // 3. ลบข้อมูลห้องเรียน
  const handleDelete = async (id: number) => {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบห้องเรียนนี้?')) return
    try {
      const res = await fetch(`/api/rooms?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchRooms()
      } else {
        alert('ไม่สามารถลบข้อมูลได้ เนื่องจากห้องนี้อาจถูกใช้งานในตารางสอนแล้ว')
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการลบข้อมูล')
    }
  }

  return (
    <div className="min-h-screen p-8 bg-slate-50 animate-fade-in text-black">
      {/* ปุ่มย้อนกลับ */}
      <button 
        onClick={() => router.push('/')} 
        className="flex items-center text-slate-500 mb-8 hover:text-blue-600 transition-colors font-medium"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> กลับหน้าหลัก
      </button>

      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* ส่วนฟอร์มกรอกข้อมูล (ซ้าย) */}
        <div className="lg:col-span-1">
          <header className="mb-6">
            <div className="flex items-center gap-4 mb-2">
              <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-200">
                <School className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900">เพิ่มห้องเรียน</h1>
            </div>
            <p className="text-slate-500 text-sm">จัดการทรัพยากรห้องเรียนของคุณ</p>
          </header>

          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
            <div>
              <label className="block text-sm font-semibold mb-2 flex items-center gap-2 text-slate-700">
                <School className="w-4 h-4 text-blue-500" /> ชื่อห้องเรียน
              </label>
              <input 
                required type="text" placeholder="เช่น ห้องแล็บคอม" 
                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={roomName} onChange={(e) => setRoomName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 flex items-center gap-2 text-slate-700">
                <Hash className="w-4 h-4 text-blue-500" /> เลขห้อง
              </label>
              <input 
                required type="text" placeholder="เช่น 401" 
                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 flex items-center gap-2 text-slate-700">
                <Users className="w-4 h-4 text-blue-500" /> ความจุ (คน)
              </label>
              <input 
                required type="number" 
                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={capacity} onChange={(e) => setCapacity(Number(e.target.value))}
              />
            </div>

            <button 
              type="submit" disabled={loading}
              className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:bg-slate-300"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              บันทึกข้อมูล
            </button>
          </form>
        </div>

        {/* ส่วนตารางแสดงข้อมูล (ขวา) */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="font-bold text-slate-800">รายการห้องเรียนทั้งหมด</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-slate-400 text-xs uppercase tracking-wider border-b border-slate-100">
                    <th className="p-4 font-bold">เลขห้อง</th>
                    <th className="p-4 font-bold">ชื่อห้อง</th>
                    <th className="p-4 font-bold">ความจุ</th>
                    <th className="p-4 font-bold text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {fetching ? (
                    <tr><td colSpan={4} className="p-10 text-center text-slate-400">กำลังโหลดข้อมูล...</td></tr>
                  ) : rooms.length === 0 ? (
                    <tr><td colSpan={4} className="p-10 text-center text-slate-400">ยังไม่มีข้อมูลห้องเรียน</td></tr>
                  ) : (
                    rooms.map((room) => (
                      <tr key={room.room_id} className="hover:bg-slate-50 transition-colors group">
                        <td className="p-4 font-mono font-bold text-blue-600">{room.room_number}</td>
                        <td className="p-4 text-slate-600 font-medium">{room.room_name}</td>
                        <td className="p-4 text-slate-500">{room.capacity} ที่นั่ง</td>
                        <td className="p-4 text-center">
                          <button 
                            onClick={() => handleDelete(room.room_id)}
                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}