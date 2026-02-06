'use client'
import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Calendar, School, Users, Printer, BookOpen, Clock, Loader2, ArrowLeft, MapPin, User, Home, Trash2, Tag } from 'lucide-react'

export default function PublicSchedules() {
  const router = useRouter()
  const [groups, setGroups] = useState([])
  const [selectedGroup, setSelectedGroup] = useState('')
  const [scheduleData, setScheduleData] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // 🚩 ดึงรายชื่อกลุ่มเรียน (ที่มีข้อมูลสาขาพ่วงมาด้วย)
    fetch('/api/student-groups').then(res => res.json()).then(data => setGroups(data))
  }, [])

  useEffect(() => {
    if (selectedGroup) {
      setLoading(true)
      // 🚩 เปลี่ยนไปเรียกใช้ API save-schedule (GET) ที่กูแก้ให้รอบที่แล้ว 
      // เพราะมันจะดึงข้อมูลห้องพี่น้องที่เรียนร่วมกันมาให้ครบถ้วน
      fetch(`/api/save-schedule?groupId=${selectedGroup}`)
        .then(res => res.json())
        .then(data => {
          setScheduleData(Array.isArray(data) ? data : [])
          setLoading(false)
        })
    }
  }, [selectedGroup])

  const handleDeleteSchedule = async () => {
    if (!selectedGroup) return;
    if (!confirm("มึงแน่ใจนะว่าจะลบตารางของกลุ่มนี้? ข้อมูลจะหายเกลี้ยงเลยนะไอ้สอง!")) return;

    try {
      const res = await fetch(`/api/save-schedule?groupId=${selectedGroup}`, { method: 'DELETE' });
      if (res.ok) {
        alert("ลบตารางสอนเรียบร้อยแล้ว!");
        setScheduleData([]);
      } else {
        alert("เกิดข้อผิดพลาดในการลบ");
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("ลบไม่สำเร็จว่ะ");
    }
  };

  const days = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสฯ', 'ศุกร์']
  const dayKeys = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
  const slots = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] 
  const timeLabels = ['07:30-08:10', '08:10-09:10', '09:10-10:10', '10:10-11:10', '11:10-12:10', '12:10-13:10', '13:10-14:10', '14:10-15:10', '15:10-16:10', '16:10-17:10', '17:10-18:10']

  const timeToSlot = (timeStr: string) => {
    const date = new Date(timeStr);
    const hours = date.getUTCHours();
    return hours - 7; 
  }

  const scheduleMatrix = useMemo(() => {
    const matrix: Record<string, any> = {};
    scheduleData.forEach(item => {
      const start = timeToSlot(item.start_time);
      const end = timeToSlot(item.end_time) - 1; 
      const duration = end - start + 1;
      matrix[`${item.day_of_week}-${start}`] = { ...item, duration };
      for (let s = start + 1; s <= end; s++) {
        matrix[`${item.day_of_week}-${s}`] = 'OCCUPIED';
      }
    });
    return matrix;
  }, [scheduleData]);

  // ค้นหาข้อมูลกลุ่มที่เลือกเพื่อเอามาโชว์ชื่อสาขา
  const selectedGroupData = groups.find((g: any) => g.group_id === parseInt(selectedGroup)) as any;

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 text-black font-sans">
      <style jsx global>{`
        /* 🚩 ส่วนตั้งค่าตารางปกติ (Web View) */
        table { 
          border-collapse: collapse !important; /* เปลี่ยนจาก separate เป็น collapse เพื่อให้เส้นขอบไม่ซ้อนกัน */
          width: 100% !important;
          table-layout: fixed !important;
          border: 1px solid black !important;
        }
        th, td { 
          border: 1px solid black !important; /* รวมคำสั่งให้สั้นลงแต่แรงขึ้น */
          padding: 2px !important;
          word-wrap: break-word !important;
          overflow: hidden !important;
        }
          
        /* 🚩 ส่วนตั้งค่าตอนสั่งปริ้น (Print Mode) - ฉบับรวมร่าง ไม่ตัดอะไรออก */
        @media print {
          @page { 
            size: A4 landscape; 
            margin: 0.5cm; /* ใช้ระยะจากชุดที่สองที่มึงให้มา */
          }
          
          /* 🚀 หัวใจสำคัญ: บังคับให้บราวเซอร์ดึงสีออกมาทุุกจุด */
          * { 
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important; 
            color-adjust: exact !important;
          }
          
          body { 
            background: white !important; 
            -webkit-print-color-adjust: exact !important;
          }

          .no-print { display: none !important; }
          
          /* 🚀 ล็อคขอบเส้นตารางให้ชัดเจนที่สุด */
          table { 
            border-collapse: collapse !important;
            width: 100% !important;
            -webkit-print-color-adjust: exact !important;
          }

          /* รวมความแกร่ง: ทั้ง border-color black และ 0.5pt solid เพื่อความคม */
          table, thead, tbody, tr, th, td { 
            border: 0.5pt solid black !important; 
            border-color: black !important;
            visibility: visible !important; 
            opacity: 1 !important; 
          }

          /* ป้องกันสีพื้นหลังทับเส้นขอบ ตามที่มึงเพิ่มมา */
          td { background-clip: padding-box !important; }

          /* 🚀 ป้องกันตารางขาดครึ่งหน้า (สำคัญมาก!) */
          tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          /* 🚩 Hardcode สีพื้นหลัง (เน้นสีให้เข้มขึ้นเล็กน้อยเพื่อการพิมพ์) */
          .bg-blue-50\/50, .bg-blue-50 { background-color: #eff6ff !important; }
          .bg-slate-100 { background-color: #f1f5f9 !important; }
          .bg-red-50 { background-color: #fef2f2 !important; }
          .bg-gray-100 { background-color: #f3f4f6 !important; }
          .bg-yellow-50 { background-color: #fefce8 !important; }

          /* ปรับขนาดฟอนต์ (อ้างอิงตามค่าที่มึงให้มาล่าสุด) */
          .text-[6.5px] { font-size: 7.5px !important; }
          .text-[10px] { font-size: 11px !important; }
          
          .print-area { 
            border: none !important; 
            padding: 0 !important; 
            width: 100% !important; 
            box-shadow: none !important; 
            display: block !important;
          }
        }
      `}</style>

      <div className="max-w-[1400px] mx-auto space-y-4">
        {/* Header Board - No Print */}
        <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-6 no-print text-left">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/')} className="p-3 bg-slate-50 rounded-2xl hover:bg-blue-50 hover:text-blue-600 transition-all">
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-xl font-black tracking-tighter text-slate-900 uppercase italic">Public Timetable View</h1>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest leading-none">AITC Information System</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-1 max-w-xl">
            <div className="relative flex-1">
                <Tag size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <select 
                  className="w-full p-4 pl-12 bg-slate-50 rounded-2xl font-black text-slate-700 outline-none border-2 border-slate-100 focus:border-blue-500 transition-all appearance-none"
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                >
                  <option value="">-- เลือกกลุ่มเรียน / สาขา --</option>
                  {groups.map((g: any) => (
                    <option key={g.group_id} value={g.group_id}>
                      {g.group_name} — {g.major || 'ไม่ระบุสาขา'}
                    </option>
                  ))}
                </select>
            </div>
            
            {selectedGroup && (
              <div className="flex gap-2">
                <button onClick={() => window.print()} title="พิมพ์ตารางสอน" className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-blue-600 transition-all shadow-xl">
                  <Printer size={20} />
                </button>
                <button onClick={handleDeleteSchedule} title="ลบตารางสอน" className="p-4 bg-red-100 text-red-600 rounded-2xl hover:bg-red-600 hover:text-white transition-all shadow-sm">
                  <Trash2 size={20} />
                </button>
              </div>
            )}
          </div>
        </div>

        {selectedGroup ? (
          <div className="print-area bg-white border-2 border-black p-6 shadow-2xl rounded-sm">
            <div className="grid grid-cols-4 border-2 border-black mb-2 p-2 items-center bg-slate-50/50">
              <div className="col-span-1 flex items-center justify-center border-r-2 border-black font-black text-xl italic text-blue-600 pr-2">
                 <div className="w-10 h-10 bg-blue-600 rounded flex items-center justify-center text-white not-italic mr-2 font-black text-sm">AITC</div>
                 <span className="text-[7px] uppercase text-slate-400 not-italic leading-none font-bold text-left">Industrial<br/>College</span>
              </div>
              <div className="col-span-3 pl-4 text-left">
                <h1 className="text-lg font-black uppercase leading-none mb-1 tracking-tighter">Student Timetable | Online Board</h1>
                <div className="grid grid-cols-3 text-[10px] font-bold text-slate-700">
                  <p>กลุ่มเรียน: <span className="text-blue-700 font-black">{selectedGroupData?.group_name}</span></p>
                  <p>สาขาวิชา: <span className="text-slate-900 font-black">{selectedGroupData?.major || '-'}</span></p>
                  <p>ปีการศึกษา: 2/2568</p>
                </div>
              </div>
            </div>

            {/* 🚩 [INJECTED] ตารางสรุปรายวิชาด้านบน */}
            <div className="mb-4 text-left">
              <table className="w-full text-left text-[8px] border border-black border-collapse">
                <thead>
                  <tr className="bg-slate-100 font-black text-center uppercase border border-black">
                    <th className="p-1 w-[80px] border-r border-black">รหัสวิชา</th>
                    <th className="p-1 border-r border-black">ชื่อรายวิชา</th>
                    <th className="p-1 w-8 border-r border-black">ท.</th>
                    <th className="p-1 w-8 border-r border-black">ป.</th>
                    <th className="p-1 w-8 border-r border-black"> น.</th>
                    <th className="p-1 w-8 bg-blue-50 text-blue-600">ชม.</th>
                  </tr>
                </thead>
                <tbody>
                  {/* กรองเอาวิชาที่ไม่ซ้ำรหัสมาโชว์ */}
                  {Array.from(new Map(scheduleData.map(item => [
                    item.course_enrollments?.courses?.course_code, 
                    item.course_enrollments?.courses
                  ])).values()).map((course: any, idx) => (
                    course && (
                      <tr key={idx} className="border-b border-black">
                        <td className="p-1 border-r border-black text-center font-black text-blue-700">{course.course_code}</td>
                        <td className="p-1 border-r border-black font-bold uppercase px-2">{course.subject_name}</td>
                        <td className="p-1 border-r border-black text-center">{course.theory_hours || 0}</td>
                        <td className="p-1 border-r border-black text-center">{course.lab_hours || 0}</td>
                        <td className="p-1 border-r border-black text-center">{course.credits || 0}</td>
                        <td className="p-1 text-center font-black bg-blue-50 text-blue-600">
                          {(course.theory_hours || 0) + (course.lab_hours || 0)}
                        </td>
                      </tr>
                    )
                  ))}
                </tbody>
              </table>
            </div>

            <div className="overflow-x-auto border-2 border-black">
              <table className="w-full border-collapse min-w-[1200px] text-center table-fixed">
                <thead>
                  <tr className="bg-slate-100 border-b border-black text-[8px] font-black uppercase">
                    <th className="border-r border-black w-14">Day / Slot</th>
                    {timeLabels.map((time, i) => (
                      <th key={i} className="border-r border-black last:border-r-0 p-1 text-[7px] font-bold">
                        <span className="block text-slate-400">คาบ {i}</span>
                        {time}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-black">
                  {dayKeys.map((dayKey, dIdx) => (
                    <tr key={dayKey} className="h-16">
                      <td className="border-r border-black font-black p-1 bg-slate-50 text-[8px] uppercase">{days[dIdx]}</td>
                      {slots.map((slot, labelIdx) => {
                        if (labelIdx === 0) return <td key="act" className="border-r border-black bg-slate-100 text-[6px] font-bold text-slate-500 [writing-mode:vertical-rl] rotate-180 py-1 tracking-tighter">กิจกรรมหน้าเสาธง</td>
                        if (labelIdx === 5) return <td key="lunch" className="border-r border-black bg-red-50 text-[7px] font-black text-red-600 italic">พักกลางวัน</td>

                        const currentSlotNumber = labelIdx <= 4 ? labelIdx : labelIdx - 1;
                        const cell = scheduleMatrix[`${dayKey}-${currentSlotNumber}`];
                        
                        if (cell === 'OCCUPIED') return null;

                        if (cell) {
                          return (
                            <td 
                              key={labelIdx} 
                              colSpan={cell.duration} 
                              className="p-0.5 border border-black align-middle"
                            >
                              <div className="bg-blue-50/80 h-full p-1 flex flex-col justify-center text-[7px] leading-tight border-l-4 border-blue-600">
                                <span className="font-black text-blue-700 leading-none">
                                  {cell.course_enrollments?.courses?.course_code}
                                </span>
                                <span className="font-bold text-slate-800 uppercase my-0.5 line-clamp-2">
                                  {cell.course_enrollments?.courses?.subject_name}
                                </span>
                                <div className="flex flex-wrap items-center justify-center gap-1 text-slate-500 font-bold mt-0.5">
                                  <div className="flex items-center gap-0.5">
                                    <User size={8} className="text-blue-500" />
                                    <span className="truncate">{cell.course_enrollments?.teachers?.name}</span>
                                  </div>
                                  <div className="flex items-center gap-0.5 bg-blue-600 text-white px-1 rounded-sm">
                                    <Home size={8} />
                                    <span>{cell.rooms?.room_number}</span>
                                  </div>
                                </div>
                              </div>
                            </td>
                          );
                        }

                        return <td key={labelIdx} className="border-r border-black bg-white"></td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-2 text-[7px] font-bold text-slate-400 text-right uppercase tracking-widest">
              AITC Intelligent Scheduler Enterprise v2.0
            </div>
          </div>
        ) : (
          <div className="text-center p-32 bg-white rounded-[3rem] border-4 border-dashed border-slate-200 text-left">
             <div className="bg-blue-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                {loading ? <Loader2 className="animate-spin text-blue-600" size={40} /> : <Calendar className="text-blue-200" size={40} />}
             </div>
             <h3 className="text-2xl font-black text-slate-400 tracking-tighter uppercase italic text-center">กรุณาเลือกกลุ่มเรียนเพื่อแสดงตารางสอน</h3>
          </div>
        )}
      </div>
    </div>
  )
}