import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { Student, cn } from '../App';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Star, Award, Medal } from 'lucide-react';

export default function Ranking() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'students'), limit(100));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const studentList = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Student));
      // Sort by stars (desc) then by trophies count (desc)
      const sortedList = [...studentList].sort((a, b) => {
        if (b.stars !== a.stars) {
          return b.stars - a.stars;
        }
        return (b.trophies?.length || 0) - (a.trophies?.length || 0);
      });
      setStudents(sortedList);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) return <div className="text-center py-20">Carregando ranking...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="text-center space-y-4">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="w-24 h-24 bg-tech-cyan/20 text-tech-cyan rounded-[2rem] flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(34,211,238,0.2)] border border-tech-cyan/30"
        >
          <Trophy className="w-12 h-12" />
        </motion.div>
        <h1 className="text-6xl font-black text-white tracking-tighter font-display uppercase">Alunos Dedicados</h1>
        <p className="text-xl text-tech-magenta font-bold tracking-wide italic">"Quem ensina aprende ao ensinar e quem aprende ensina ao aprender."</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <AnimatePresence>
          {students.map((student, index) => {
            const isTop3 = index < 3;
            const rankColors = [
              "bg-gradient-to-br from-amber-300 to-amber-600 text-tech-bg shadow-[0_0_25px_rgba(251,191,36,0.5)]",
              "bg-gradient-to-br from-slate-200 to-slate-400 text-tech-bg shadow-[0_0_25px_rgba(226,232,240,0.5)]",
              "bg-gradient-to-br from-orange-400 to-orange-700 text-tech-bg shadow-[0_0_25px_rgba(249,115,22,0.5)]"
            ];

            return (
              <motion.div
                key={student.id}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "glass-card p-8 rounded-[2.5rem] flex items-center gap-8 group hover:border-tech-cyan/50 transition-all",
                  isTop3 && "border-white/20 bg-white/5"
                )}
              >
                {/* Rank Number */}
                <div className={cn(
                  "w-20 h-20 rounded-3xl flex items-center justify-center font-black text-4xl shadow-lg font-display",
                  isTop3 ? rankColors[index] : "bg-tech-bg/50 text-slate-500 border border-white/5"
                )}>
                  {index + 1}
                </div>

                {/* Avatar */}
                <div className="text-6xl w-24 h-24 bg-tech-bg/30 rounded-3xl flex items-center justify-center shadow-inner border border-white/5 group-hover:scale-110 transition-transform">
                  {student.avatar}
                </div>

                {/* Name & Info */}
                <div className="flex-1">
                  <h3 className="text-3xl font-black text-white flex items-center gap-4 font-display tracking-tight">
                    {student.name}
                    {isTop3 && <Medal className={cn("w-8 h-8", index === 0 ? "text-amber-400" : index === 1 ? "text-slate-200" : "text-orange-400")} />}
                  </h3>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4">
                  {/* Trophies Count */}
                  <div className="flex items-center gap-4 bg-tech-magenta/10 px-8 py-5 rounded-3xl border border-tech-magenta/20 shadow-inner group-hover:bg-tech-magenta/20 transition-all">
                    <Trophy className="w-8 h-8 text-tech-magenta drop-shadow-[0_0_10px_rgba(244,114,182,0.6)]" />
                    <span className="text-3xl font-black text-white font-display">{student.trophies?.length || 0}</span>
                  </div>
                  
                  {/* Stars Count */}
                  <div className="flex items-center gap-4 bg-tech-cyan/10 px-8 py-5 rounded-3xl border border-tech-cyan/20 shadow-inner group-hover:bg-tech-cyan/20 transition-all">
                    <Star className="w-8 h-8 text-tech-cyan fill-current drop-shadow-[0_0_10px_rgba(34,211,238,0.6)]" />
                    <span className="text-3xl font-black text-white font-display">{student.stars}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {students.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-indigo-100">
            <p className="text-slate-400 font-medium">Nenhum aluno no ranking ainda.</p>
          </div>
        )}
      </div>
    </div>
  );
}
