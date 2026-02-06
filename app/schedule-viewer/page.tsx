'use client'
import { useState, useEffect, Suspense, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Printer, ArrowLeft, Loader2, Save, CheckCircle2, Sparkles, AlertCircle, LayoutGrid, User, Home, Zap, Clock, Check, ListChecks, ShieldAlert } from 'lucide-react'

function ViewerContent() {
  const [allSchedules, setAllSchedules] = useState<any[]>([]) 
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [rooms, setRooms] = useState<any[]>([]) 
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false) 
  const [isGenerating, setIsGenerating] = useState(false) 
  
  const searchParams = useSearchParams()
  const urlGroupId = searchParams.get('groupId')
  const [activeGroupId, setActiveGroupId] = useState<number | null>(urlGroupId ? Number(urlGroupId) : null)
  const [availableGroups, setAvailableGroups] = useState<any[]>([])

  const router = useRouter()
  const major = searchParams.get('major') || 'N/A'
  const level = searchParams.get('level') || ''
  const year = searchParams.get('year') || ''

  const getSlotNum = (val: any) => {
    if (val === undefined || val === null || val === "" || isNaN(Number(val))) {
      if (typeof val === 'string' && val.includes('T')) {
        const date = new Date(val);
        return date.getUTCHours() - 7;
      }
      return -999;
    }
    const res = Number(val);
    return (res >= 1 && res <= 10) ? res : -999;
  };

 const handleGenerateAI = async () => {
    if (!activeGroupId) return alert("กรุณาเลือกกลุ่มเรียน");
    
    // 🚩 [ADDED] ถามความสมัครใจก่อน เพราะการเจนใหม่จะล้างหน้าจอเดิม
    const confirmGen = confirm("ระบบจะสร้างตารางใหม่เพื่อแสดงเป็นตัวอย่าง (ข้อมูลเดิมในฐานข้อมูลจะยังไม่ถูกลบจนกว่าคุณจะกด 'บันทึกข้อมูล') ตกลงหรือไม่?");
    if (!confirmGen) return;

    setIsGenerating(true);
    
    // 🚩 [ADDED] ล้างหน้าจอรอของใหม่ เพื่อให้มึงเห็นชัดๆ ว่าข้อมูลใหม่กำลังมา
    setAllSchedules([]); 

    try {
      localStorage.removeItem('last_generated_batch');
      localStorage.removeItem('last_generated_schedule');
      
      const res = await fetch(`/api/generate-schedule?groupId=${activeGroupId}`, { method: 'POST' });
      const data = await res.json();
      
      if (data.error) throw new Error(data.error);

      // 🚩 [ADDED] เช็คเผื่อ AI ส่งตารางว่างกลับมา (กรณีหาที่ลงไม่ได้)
      if (!data || data.length === 0) {
        alert("⚠️ AI ไม่สามารถจัดตารางให้ลงตัวได้ในขณะนี้ กรุณาลองกดใหม่อีกครั้ง");
        return;
      }

      const cleanData = data.map((s: any) => ({
        ...s,
        group_id: Number(s.group_id)
      }));

      setAllSchedules(cleanData); 
      localStorage.setItem('last_generated_batch', JSON.stringify(cleanData));
      
      // 🚩 [ADDED] ย้ำเตือนมึงว่านี่คือแค่ Preview
      alert("✨ สร้างตารางสำเร็จ! นี่คือตัวอย่างที่ AI จัดให้ \n⚠️ ข้อมูลนี้ยังไม่ได้บันทึก หากพอใจกรุณากดปุ่ม 'บันทึกข้อมูล' ด้านล่าง");
      
    } catch (err: any) { 
      alert("AI คำนวณผิดพลาด: " + err.message); 
    } finally { 
      setIsGenerating(false); 
    }
  };

  const renderSlot = (slotData: any) => {
    if (!slotData) return null;

    let detail = enrollments.find(e => Number(e.enrollment_id) === Number(slotData.enrollment_id));
    const isOurGroup = Number(slotData.group_id) === Number(activeGroupId);
    
    const subjectName = detail?.courses?.subject_name || slotData.subject_name || "วิชาเรียนร่วม";
    const courseCode = detail?.courses?.course_code || slotData.course_code || "N/A";
    const teacherName = detail?.teachers?.name || slotData.teacher_name || "ไม่ระบุอาจารย์";
    const roomName = rooms.find(r => Number(r.room_id) === Number(slotData.room_id))?.room_number || slotData.room_number || "RM " + slotData.room_id;

    return (
      <div className={`flex flex-col text-[6.5px] leading-tight gap-0.5 h-full justify-center animate-in fade-in zoom-in duration-300 text-left ${!isOurGroup ? 'opacity-40 grayscale' : ''}`}>
        <div className="flex justify-between items-center">
          <span className="font-black text-blue-700 leading-none">{courseCode}</span>
          {!isOurGroup && <ShieldAlert size={7} className="text-amber-500" name="กลุ่มอื่นสอน/เรียนอยู่" />}
        </div>
        <span className="font-bold line-clamp-2 text-slate-800 tracking-tighter leading-tight uppercase">
          {subjectName}
        </span>
        <div className="flex items-center justify-center gap-0.5 text-slate-500 font-bold mt-0.5 text-left">
          <User size={6} className="text-blue-500" />
          <span className="truncate">{teacherName}</span>
        </div>
        <div className={`mt-1 py-0.5 rounded-sm font-black text-white text-[5.5px] uppercase flex items-center justify-center gap-0.5 text-left ${isOurGroup ? 'bg-blue-600' : 'bg-slate-400'}`}>
          <Home size={6} />
          <span>{roomName}</span>
        </div>
      </div>
    );
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/enrollments')
        const data = await res.json()
        setEnrollments(data.enrollments || [])
        setRooms(data.rooms || []) 
        setAvailableGroups(data.groups || [])

        const targetId = activeGroupId || (urlGroupId ? Number(urlGroupId) : (data.groups?.[0]?.group_id ? Number(data.groups[0].group_id) : null));
        
        if (targetId) {
          setActiveGroupId(targetId);
          const dbRes = await fetch(`/api/save-schedule?groupId=${targetId}`)
          const dbData = await dbRes.json()
          setAllSchedules(Array.isArray(dbData) ? dbData : [])
        }
      } catch (err) { console.error("Fetch error:", err) } 
      finally { setLoading(false) }
    }
    fetchData()
  }, [activeGroupId, urlGroupId])

  const relatedGroupIds = useMemo(() => {
    if (!activeGroupId || availableGroups.length === 0) return [];
    const currentGroup = availableGroups.find(g => Number(g.group_id) === Number(activeGroupId));
    if (!currentGroup) return [Number(activeGroupId)];
    const cluster = new Set<number>([Number(activeGroupId)]);
    const isSameGang = (target: any) => (
      target && target.major === currentGroup.major &&
      target.level === currentGroup.level &&
      target.academic_year === currentGroup.academic_year
    );
    currentGroup.mapping_as_main?.forEach((m: any) => { if (isSameGang(m.sub_group)) cluster.add(Number(m.sub_group_id)); });
    currentGroup.mapping_as_sub?.forEach((m: any) => { if (isSameGang(m.main_group)) cluster.add(Number(m.main_group_id)); });
    return Array.from(cluster);
  }, [activeGroupId, availableGroups]);

// 🚩 [FIXED] กรองวิชาซ้อนทับกัน และ ตัดจบชั่วโมงที่เกินโควตาหลักสูตร
  const currentSchedule = useMemo(() => {
    const occupiedTimeSlots = new Set(); 
    const finalData = [];
    const usedHoursMap = new Map<number, number>(); // เก็บจำนวนชั่วโมงที่วาดลงตารางไปแล้วของแต่ละวิชา 

    // เรียงลำดับเอาวิชาของกลุ่มที่เรากำลังดู (Active Group) ขึ้นก่อน เพื่อให้ได้สิทธิ์จองที่ว่างก่อนกลุ่มอื่น
    const sortedSchedules = [...allSchedules].sort((a, b) => 
      Number(a.group_id) === activeGroupId ? -1 : 1
    );

    for (const s of sortedSchedules) {
      // 1. กรองเฉพาะกลุ่มที่เกี่ยวข้อง (กลุ่มตัวเอง + เครือญาติ)
      if (!relatedGroupIds.includes(Number(s.group_id)) && Number(s.group_id) !== activeGroupId) continue;

      const enrollmentId = Number(s.enrollment_id);
      const start = getSlotNum(s.slot_start ?? s.start_slot ?? s.start_time);
      let end = getSlotNum(s.slot_end ?? s.end_slot ?? s.end_time);
      const day = (s.day || s.day_of_week || "").toLowerCase();

      if (start === -999 || end === -999) continue;

      // 🚩 [STRATEGIC CHECK] ดึงจำนวนชั่วโมงสูงสุดที่อนุญาตจาก Enrollments (Theory + Lab)
      const enrollmentInfo = enrollments.find(e => Number(e.enrollment_id) === enrollmentId);
      const maxAllowedHours = enrollmentInfo ? (enrollmentInfo.courses?.theory_hours || 0) + (enrollmentInfo.courses?.lab_hours || 0) : 99;
      
      const currentUsedHours = usedHoursMap.get(enrollmentId) || 0;
      
      // ถ้าวิชานี้ใช้วาดลงตารางครบชั่วโมงตามแผนการเรียนแล้ว... ให้ข้ามการวาดส่วนเกินทิ้งทันที
      if (currentUsedHours >= maxAllowedHours) continue;

      // 🚩 [AUTO-TRUNCATE] ถ้าคาบที่ส่งมาลากยาวเกินชั่วโมงที่เหลือ... ให้ "หักคอ" ตัดจบแค่เท่าที่มีสิทธิ์เรียน
      const requestedDuration = end - start + 1;
      if (currentUsedHours + requestedDuration > maxAllowedHours) {
        end = start + (maxAllowedHours - currentUsedHours - 1);
      }

     // 2. เช็คการซ้อนกันของพื้นที่หน้าจอ (Conflict Check)
      let conflictIds: string[] = []; 
      let isOverlap = false;

      for (let i = start; i <= end; i++) {
        const slotKey = `${day}-${i}`;
        if (occupiedTimeSlots.has(slotKey)) {
          // 💡 [FIXED LOGIC] ถ้ากลุ่มหลักมาทับกลุ่มอื่น เราจะไม่แค่ปล่อยผ่าน 
          // แต่เราต้องจำไว้ว่า "ทับที่ช่องไหน" เพื่อไปจัดการออก
          if (Number(s.group_id) === activeGroupId) {
            conflictIds.push(slotKey); 
          } else {
            isOverlap = true;
            break;
          }
        }
      }

      // 3. ถ้าผ่านทุุกเงื่อนไข (ไม่ซ้อนเด็ดขาด หรือ เป็นกลุ่มหลักที่มีสิทธิไล่ที่)
      if (!isOverlap && end >= start) {
        // 🚩 [CRITICAL] ถ้าเป็นกลุ่มหลักและไปทับที่ใคร ให้ลบข้อมูลเก่าที่ซ้อนกันออกจาก finalData ก่อน
        if (Number(s.group_id) === activeGroupId && conflictIds.length > 0) {
          // วนลูปเช็คว่าช่องที่ทับกัน มีใครเคยจองไว้มั้ย ถ้ามีให้เอาวิชานั้นออกจากตารางพรีวิว
          for (let i = finalData.length - 1; i >= 0; i--) {
            const item = finalData[i];
            const itemStart = getSlotNum(item.slot_start);
            const itemEnd = getSlotNum(item.slot_end);
            const itemDay = (item.day || item.day_of_week || "").toLowerCase();

            // เช็คว่าวิชาเก่าใน finalData ครอบคลุมช่องที่เกิด Conflict หรือไม่
            const hasConflict = conflictIds.some(cKey => {
              const [cDay, cSlot] = cKey.split('-');
              return itemDay === cDay && Number(cSlot) >= itemStart && Number(cSlot) <= itemEnd;
            });

            if (hasConflict) {
              finalData.splice(i, 1); // เตะวิชาที่ซ้อนออกไป!
            }
          }
        }

        finalData.push({ ...s, slot_start: start, slot_end: end });
        
        // บันทึกการจองที่นั่งในตาราง
        for (let i = start; i <= end; i++) {
          occupiedTimeSlots.add(`${day}-${i}`);
        }
        // อัปเดตชั่วโมงสะสม
        usedHoursMap.set(enrollmentId, currentUsedHours + (end - start + 1));
      }
    }
    return finalData;
  }, [allSchedules, relatedGroupIds, activeGroupId, enrollments]);
 
  const currentEnrollments = useMemo(() => {
    return enrollments.filter(e => relatedGroupIds.includes(Number(e.group_id)))
  }, [enrollments, relatedGroupIds])

  const subjectStatus = useMemo(() => {
    return currentEnrollments.map(en => {
      const targetHours = (en.courses?.theory_hours || 0) + (en.courses?.lab_hours || 0);
      const assignedItems = currentSchedule.filter(s => Number(s.enrollment_id) === Number(en.enrollment_id));
      const currentHours = assignedItems.reduce((sum, s) => {
        const start = getSlotNum(s.slot_start ?? s.start_slot ?? s.start_time);
        const end = getSlotNum(s.slot_end ?? s.end_slot ?? s.end_time);
        if (start < 1 || end < 1) return sum;
        return sum + (end - start + 1);
      }, 0);
      return {
        id: en.enrollment_id,
        name: en.courses?.subject_name,
        group_name: en.student_groups?.group_name, 
        target: targetHours,
        current: currentHours,
        isComplete: currentHours >= targetHours,
        assignedSlots: assignedItems 
      };
    });
  }, [currentEnrollments, currentSchedule]);

  const totalStats = useMemo(() => {
    return currentEnrollments.reduce((acc, curr) => {
      const t = curr.courses?.theory_hours || 0;
      const p = curr.courses?.lab_hours || 0;
      return { theory: acc.theory + t, lab: acc.lab + p, credits: acc.credits + (t + (p / 2)), hours: acc.hours + (t + p) };
    }, { theory: 0, lab: 0, credits: 0, hours: 0 });
  }, [currentEnrollments]);

  const handleSaveToDB = async () => {
    if (!allSchedules.length) return alert("ไม่มีข้อมูลตารางให้บันทึก");
    setIsSaving(true);
    try {
      const res = await fetch('/api/save-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId: activeGroupId, schedule: allSchedules })
      });
      if (res.ok) {
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
        alert("💾 บันทึกตารางลงฐานข้อมูลเรียบร้อย!");
      }
    } catch (err) { alert("เกิดข้อผิดพลาดในการบันทึก"); } 
    finally { setIsSaving(false); }
  };

  const days = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสฯ', 'ศุกร์']
  const dayKeys = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
  const timeLabels = ['07:30-08:10', '08:10-09:10', '09:10-10:10', '10:10-11:10', '11:10-12:10', '12:10-13:10', '13:10-14:10', '14:10-15:10', '15:10-16:10', '16:10-17:10', '17:10-18:10']

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 font-bold tracking-widest animate-pulse text-black uppercase">Loading...</div>

  return (
    <div className="min-h-screen bg-slate-100 p-4 font-sans text-black overflow-x-hidden text-left">
      <style jsx global>{`
        table { 
          border-collapse: separate !important; 
          border-spacing: 0 !important;
          width: 100% !important;
          table-layout: fixed !important;
          border: 1px solid black !important;
        }
        th, td { 
          border-right: 1px solid black !important;
          border-bottom: 1px solid black !important;
          border-left: 1px solid black !important; 
          border-top: 1px solid black !important;
          padding: 2px !important;
        }
        @media print {
          @page { size: A4 landscape; margin: 0.5cm; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body { background: white !important; }
          .no-print { display: none !important; }
          table, thead, tbody, tr, th, td { border-color: black !important; visibility: visible !important; opacity: 1 !important; }
          td { background-clip: padding-box !important; }
          .bg-blue-50\/50, .bg-blue-50 { background-color: #eff6ff !important; }
          .bg-slate-100 { background-color: #f1f5f9 !important; }
          .bg-red-50 { background-color: #fef2f2 !important; }
          .text-[6.5px] { font-size: 7.5px !important; }
          .text-[10px] { font-size: 11px !important; }
        }
      `}</style>

      <div className="max-w-[1400px] mx-auto mb-4 no-print bg-white p-4 rounded-[2rem] shadow-sm border border-slate-200 flex flex-wrap gap-2 items-center">
        <div className="text-[10px] font-black uppercase text-slate-400 mr-2 flex items-center gap-1">
          <LayoutGrid size={14}/> Groups in Network:
        </div>
        {availableGroups.filter(g => relatedGroupIds.includes(Number(g.group_id))).map((group) => (
          <button
            key={group.group_id}
            onClick={() => setActiveGroupId(Number(group.group_id))}
            className={`px-5 py-2 rounded-xl font-black text-xs transition-all border-2 ${
              Number(activeGroupId) === Number(group.group_id) ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-400 hover:border-blue-300'
            }`}
          >
            {group.group_name}
          </button>
        ))}
      </div>

      <div className="max-w-[1400px] mx-auto flex flex-col lg:flex-row gap-6">
        <div className="lg:w-72 no-print space-y-4 text-left">
          <div className="bg-white p-5 rounded-[2.5rem] shadow-sm border border-slate-200 sticky top-4 text-left">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
              <Clock size={14} className="text-blue-600" /> Cluster Audit
            </h3>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar text-left">
              {subjectStatus.map((status) => (
                <div key={status.id} className={`p-3 rounded-2xl border transition-all ${status.isComplete ? 'bg-emerald-50/50 border-emerald-100' : 'bg-red-50/50 border-red-100'}`}>
                  <div className="flex justify-between items-start mb-1 gap-2 text-left">
                    <div>
                      <p className="text-[10px] font-bold text-slate-800 line-clamp-1 leading-tight">{status.name}</p>
                      {relatedGroupIds.length > 1 && (
                        <span className="text-[7px] font-black text-blue-500 uppercase tracking-tighter">Room: {status.group_name}</span>
                      )}
                    </div>
                    {status.isComplete ? <CheckCircle2 size={14} className="text-emerald-500 shrink-0" /> : <AlertCircle size={14} className="text-red-500 animate-pulse shrink-0" />}
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-2 text-left">
                    <div 
                      className={`h-full transition-all duration-700 ${status.isComplete ? 'bg-emerald-500' : 'bg-red-500'}`}
                      style={{ width: `${Math.min((status.current / status.target) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-6 text-left">
          <div className="print-area border-2 border-black p-6 bg-white shadow-2xl rounded-sm text-left">
            <div className="grid grid-cols-4 border-2 border-black mb-2 p-2 items-center bg-slate-50/50 text-left">
              <div className="col-span-1 flex items-center justify-center border-r-2 border-black font-black text-xl italic text-blue-600 pr-2 text-left">
                 <div className="w-10 h-10 bg-blue-600 rounded flex items-center justify-center text-white mr-2 font-black">AITC</div>
                 <span className="text-[7px] uppercase text-slate-400 not-italic leading-none font-bold">Relational<br/>Scheduler</span>
              </div>
              <div className="col-span-3 pl-4 text-left">
                <h1 className="text-lg font-black uppercase leading-none mb-1 tracking-tighter">
                  {availableGroups.find(g => Number(g.group_id) === Number(activeGroupId))?.major || major} | {level}{year}
                </h1>
                <div className="grid grid-cols-3 text-[10px] font-bold text-slate-700 text-left">
                  <p>กลุ่มเรียน: <span className="text-blue-700 font-black">{availableGroups.find(g => Number(g.group_id) === Number(activeGroupId))?.group_name || '-'}</span></p>
                  <p>สาขาวิชา: {availableGroups.find(g => Number(g.group_id) === Number(activeGroupId))?.major || major}</p>
                  <p>ปีการศึกษา: 2/2568</p>
                </div>
              </div>
            </div>

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
                  {currentEnrollments.map((en, i) => (
                    <tr key={i} className="font-bold border-x border-b border-black h-5 text-left">
                      <td className="p-0.5 text-center font-mono border-r border-black">{en.courses?.course_code}</td>
                      <td className="p-0.5 px-2 truncate font-bold text-slate-800 uppercase border-r border-black text-left">{en.courses?.subject_name}</td>
                      <td className="p-0.5 text-center border-r border-black">{en.courses?.theory_hours}</td>
                      <td className="p-0.5 text-center border-r border-black">{en.courses?.lab_hours}</td>
                      <td className="p-0.5 text-center border-r border-black">{en.courses?.theory_hours + (en.courses?.lab_hours / 2)}</td>
                      <td className="p-0.5 text-center font-black bg-blue-50/30 text-blue-700">{en.courses?.theory_hours + en.courses?.lab_hours}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="overflow-hidden border-2 border-black text-left">
              <table className="w-full text-center table-fixed border border-black border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-black text-[8px] font-black uppercase text-center">
                    <th className="border-r border-black w-14 font-black">Day / Slot</th>
                    {timeLabels.map((time, i) => (
                      <th key={i} className="border-r border-black last:border-r-0 p-1 text-[7px] font-bold text-center">{time}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dayKeys.map((dayKey, dIdx) => (
                    <tr key={dayKey} className="h-16 border-b border-black last:border-b-0 text-left">
                      <td className="border-r border-black font-black p-1 bg-slate-50 text-[8px] uppercase text-center">{days[dIdx]}</td>
                      {timeLabels.map((_, labelIdx) => {
                        if (labelIdx === 0) return <td key="act" className="border-r border-black bg-slate-100 text-[6px] font-bold text-slate-500 [writing-mode:vertical-rl] rotate-180 py-1 text-center">กิจกรรมหน้าเสาธง</td>
                        if (labelIdx === 5) return <td key="lunch" className="border-r border-black bg-red-50 text-[7px] font-black text-red-600 italic text-center">พักกลางวัน</td>

                        const currentSlotNumber = labelIdx <= 4 ? labelIdx : labelIdx - 1;
                        const slotData = currentSchedule.find(s => {
                          const d = String(s.day || s.day_of_week || "").toLowerCase();
                          if (!d.startsWith(dayKey.toLowerCase())) return false;
                          const start = getSlotNum(s.slot_start ?? s.start_slot ?? s.start_time);
                          const end = getSlotNum(s.slot_end ?? s.end_slot ?? s.end_time);
                          if (start < 1 || end < 1) return false;
                          return currentSlotNumber >= start && currentSlotNumber <= end;
                        });
                        
                        return (
                          <td key={labelIdx} className={`border-r border-black last:border-r-0 p-0.5 relative ${slotData ? 'bg-blue-50/50' : 'bg-white'} text-left`}>
                            {renderSlot(slotData)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border-4 border-blue-600/10 no-print shadow-sm text-left">
            <div className="flex items-center gap-2 mb-4 text-blue-600 text-left">
              <ListChecks size={20} />
              <h3 className="font-black uppercase tracking-widest text-sm italic underline text-left">AI Assignment Inspector</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
              {subjectStatus.map((status) => (
                <div key={status.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-left">
                  <div className="flex items-center gap-2 mb-2 text-left">
                    <span className={`w-2 h-2 rounded-full ${status.isComplete ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`} />
                    <p className="text-[10px] font-black text-slate-800 truncate">{status.name} ({status.group_name})</p>
                  </div>
                  <div className="flex flex-wrap gap-1 text-left">
                    {status.assignedSlots.length > 0 ? (
                      status.assignedSlots.map((slot, idx) => {
                        const sNum = getSlotNum(slot.slot_start ?? slot.start_slot ?? slot.start_time);
                        const eNum = getSlotNum(slot.slot_end ?? slot.end_slot ?? slot.end_time);
                        if (sNum < 1) return null; 
                        return (
                          <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 text-[8px] font-bold rounded-lg border border-blue-200">
                            {slot.day || slot.day_of_week} | คาบ: {sNum}-{eNum}
                          </span>
                        );
                      })
                    ) : (
                      <span className="text-[8px] font-bold text-red-500 italic">⚠️ ไม่พบในตารางเครือข่าย</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-center gap-4 no-print pb-10 text-left">
          <button onClick={() => router.push('/')} className="px-5 py-2.5 bg-white border-2 border-slate-200 rounded-xl font-bold text-slate-600 text-sm hover:bg-slate-50 transition-all shadow-sm">Dashboard</button>
          <button 
            onClick={handleGenerateAI} 
            disabled={isGenerating} 
            className="px-8 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-black shadow-lg text-sm transition-all active:scale-95 flex items-center gap-2"
          >
            {isGenerating ? (
              <><Loader2 className="animate-spin" size={16} /> กำลังสร้างตารางใหม่...</>
            ) : (
              <><Sparkles size={16} /> สร้างตารางสอนใหม่ (AI)</>
            )}
          </button>
          <button onClick={handleSaveToDB} disabled={isSaving} className="px-8 py-2.5 bg-slate-900 text-white rounded-xl font-black text-sm shadow-lg transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50">
            {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} บันทึกข้อมูล
          </button>
          <button onClick={() => window.print()} className="px-8 py-2.5 bg-blue-600 text-white rounded-xl font-black text-sm shadow-lg transition-all active:scale-95 flex items-center gap-2">
            <Printer size={16} /> พิมพ์ PDF
          </button>
      </div>
    </div>
  )
}

export default function ScheduleViewer() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-bold text-black uppercase animate-pulse">Loading Intelligent Scheduler...</div>}>
      <ViewerContent />
    </Suspense>
  )
}