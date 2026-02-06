'use client'
import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, CheckCircle2, AlertCircle, Sparkles, BookOpen, Link2, Zap } from 'lucide-react'

function GenerateContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const groupId = searchParams.get('groupId')
  const groupName = searchParams.get('groupName')
  
  const [status, setStatus] = useState('กำลังเตรียมระบบจัดตารางรายห้อง...')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(false)
  const [combinedGroups, setCombinedGroups] = useState<string[]>([])
  const [aiResult, setAiResult] = useState<any[]>([]) // 🚩 เก็บผลลัพธ์เพื่อตรวจสอบ

  useEffect(() => {
    if (!groupId) {
      setStatus('ไม่พบข้อมูลกลุ่มเรียน กำลังกลับไปหน้าหลัก...')
      setTimeout(() => router.push('/'), 2000)
      return
    }

    const startGenerating = async () => {
      try {
        // 🚩 ล้างค่าเก่าทิ้งทุกครั้งที่เริ่มรัน ป้องกันข้อมูลค้างจากห้องอื่น
        setAiResult([])
        setCombinedGroups([])
        setError(false)

        // Step 1: Mapping Check
        setProgress(15)
        setStatus(`กำลังตรวจสอบกฎการเรียนร่วมสำหรับห้อง ${groupName}...`)
        const checkMapping = await fetch(`/api/student-groups?id=${groupId}`)
        const groupData = await checkMapping.json()
        
        if (groupData.mapping_as_main?.length > 0) {
          const names = groupData.mapping_as_main.map((m: any) => m.sub_group.group_name)
          setCombinedGroups(names)
          setStatus(`พบกลุ่มเรียนร่วม: ${names.join(', ')}`)
        }
        await new Promise(r => setTimeout(r, 800))

        // Step 2: AI Call
        setProgress(50)
        setStatus(`Gemini AI กำลังจัดตารางเฉพาะวิชาของห้อง ${groupName}...`)
        
        const res = await fetch(`/api/generate-schedule?groupId=${groupId}`, { 
          method: 'POST' 
        })
        
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'AI คำนวณขัดข้อง')

        // 🚩 [FILTER] กรองชั้นสุดท้าย! 
        // ถ้าข้อมูลที่ AI ส่งมามี group_id ไม่ตรงกับที่เราเลือก (หรือกลุ่มที่พ่วงอยู่) ให้ตัดทิ้ง
        const validGroupIds = [parseInt(groupId), ...(groupData.mapping_as_main?.map((m: any) => m.sub_group_id) || [])]
        const cleanData = data.filter((item: any) => validGroupIds.includes(item.group_id))

        // ตรวจสอบว่ามีข้อมูลเหลืออยู่ไหมหลังจากกรอง
        if (cleanData.length === 0) {
          throw new Error('ไม่พบข้อมูลการมอบหมายงานสอนของกลุ่มนี้ในระบบ')
        }

        setAiResult(cleanData)
        setProgress(100)
        setStatus(`จัดตารางห้อง ${groupName} สำเร็จ!`)
        
        // 🚩 เก็บลง LocalStorage เฉพาะข้อมูลที่สะอาดแล้ว
        localStorage.setItem('last_generated_batch', JSON.stringify(cleanData))

        // หน่วงเวลาให้ดูผลลัพธ์นิดนึงก่อนไปหน้าถัดไป
        setTimeout(() => {
          router.push(`/schedule-viewer?groupId=${groupId}`)
        }, 1500)

      } catch (error: any) {
        console.error("Client Error:", error)
        setError(true)
        setStatus(`การจัดตารางล้มเหลว: ${error.message}`)
      }
    }

    startGenerating()
  }, [router, groupId, groupName])

  return (
    <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border border-slate-100 max-w-lg w-full relative overflow-hidden transition-all text-black">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-teal-500 via-blue-600 to-indigo-600"></div>
        
        <div className="mb-8 flex justify-center">
            <div className="relative">
                {error ? (
                    <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center border-2 border-red-100">
                        <AlertCircle className="w-12 h-12 text-red-500" />
                    </div>
                ) : progress === 100 ? (
                    <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center animate-bounce border-2 border-emerald-100">
                        <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                    </div>
                ) : (
                    <div className="relative">
                        <Loader2 className="w-24 h-24 text-blue-600 animate-spin opacity-20" />
                        <div className="absolute top-0 left-0">
                            <Sparkles className="w-24 h-24 text-blue-400 animate-pulse" />
                        </div>
                        <BookOpen className="w-10 h-10 text-blue-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                )}
            </div>
        </div>

        <div className="space-y-4 text-center">
            <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">
                {error ? 'System Error' : progress === 100 ? 'Process Success!' : 'AI Single Engine'}
            </h2>
            
            <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Target Group</p>
                <div className="flex flex-col items-center gap-2">
                    <p className="bg-slate-900 text-white text-xs font-bold px-5 py-2 rounded-xl inline-block shadow-lg uppercase">
                        ROOM {groupName}
                    </p>
                    {combinedGroups.length > 0 && (
                        <div className="flex items-center gap-1 text-amber-600 bg-amber-50 px-3 py-1 rounded-lg border border-amber-100 text-[10px] font-black uppercase">
                            <Link2 size={12} className="rotate-45" /> Joined with: {combinedGroups.join(', ')}
                        </div>
                    )}
                </div>
            </div>

            <p className="text-sm font-bold text-blue-600 mt-4 h-5 leading-none">{status}</p>

            {!error && (
                <div className="w-full bg-slate-100 h-2.5 rounded-full mt-6 overflow-hidden border border-slate-200">
                    <div 
                      className="h-full bg-blue-600 transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(37,99,235,0.4)]" 
                      style={{ width: `${progress}%` }}
                    ></div>
                </div>
            )}

            {error && (
                <button 
                  onClick={() => router.push('/')} 
                  className="mt-6 w-full py-4 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-all shadow-lg"
                >
                  กลับไปหน้า Dashboard
                </button>
            )}
        </div>
    </div>
  )
}

export default function GeneratePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <Suspense fallback={<Loader2 className="w-10 h-10 animate-spin text-blue-600" />}>
        <GenerateContent />
      </Suspense>
    </div>
  )
}