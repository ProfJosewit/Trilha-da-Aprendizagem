import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { useAuth, Student } from '../App';
import { Users, GraduationCap, Award, ChevronRight } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export default function Home() {
  const { user } = useAuth();
  const [helpers, setHelpers] = useState<Student[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'students'), where('isHelper', '==', true));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setHelpers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student)));
    });
    return unsubscribe;
  }, []);

  const helpersByGrade = helpers.reduce((acc, curr) => {
    const grade = curr.grade || 'Outros';
    if (!acc[grade]) acc[grade] = [];
    acc[grade].push(curr);
    return acc;
  }, {} as Record<string, Student[]>);

  // Sort helpers within each grade using helperOrder
  Object.values(helpersByGrade).forEach(list => {
    (list as Student[]).sort((a, b) => (a.helperOrder ?? 0) - (b.helperOrder ?? 0));
  });

  const sortedGrades = Object.keys(helpersByGrade).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] text-center relative py-12">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-tech-cyan/10 rounded-full blur-[120px] -z-10 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-tech-magenta/10 rounded-full blur-[120px] -z-10 animate-pulse" style={{ animationDelay: '1s' }} />
      
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl px-4"
      >
        <div className="inline-block px-6 py-2 bg-gradient-to-r from-tech-cyan/10 to-tech-magenta/10 border border-white/10 rounded-full text-white text-xs font-black tracking-[0.3em] uppercase mb-8 backdrop-blur-md">
          Plataforma Educacional WIT
        </div>
        
        <h1 className="text-7xl md:text-8xl font-black text-white mb-8 leading-none font-display uppercase tracking-tighter">
          TRILHA DA <span className="text-transparent bg-clip-text bg-gradient-to-r from-tech-cyan via-white to-tech-magenta">APRENDIZAGEM</span>
        </h1>
        
        <p className="text-2xl text-slate-300 mb-16 max-w-2xl mx-auto font-medium leading-relaxed italic">
          "Quem ensina aprende ao ensinar e quem aprende ensina ao aprender."
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <Link
            to="/teacher"
            className="group relative p-12 glass-card rounded-[3rem] transition-all hover:-translate-y-3 hover:shadow-[0_30px_60px_rgba(34,211,238,0.2)] border-tech-cyan/20"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-tech-cyan/10 to-transparent rounded-[3rem] opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-24 h-24 bg-tech-cyan/10 rounded-[2rem] flex items-center justify-center text-tech-cyan mb-8 mx-auto group-hover:scale-110 group-hover:rotate-6 transition-transform shadow-[0_0_30px_rgba(34,211,238,0.2)]">
              <Users className="w-12 h-12" />
            </div>
            <h2 className="text-4xl font-black text-white mb-4 font-display uppercase tracking-tight">PROFESSOR</h2>
            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Gestão & Mentoria</p>
          </Link>

          <Link
            to="/student"
            className="group relative p-12 glass-card rounded-[3rem] transition-all hover:-translate-y-3 hover:shadow-[0_30px_60px_rgba(244,114,182,0.2)] border-tech-magenta/20"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-tech-magenta/10 to-transparent rounded-[3rem] opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-24 h-24 bg-tech-magenta/10 rounded-[2rem] flex items-center justify-center text-tech-magenta mb-8 mx-auto group-hover:scale-110 group-hover:-rotate-6 transition-transform shadow-[0_0_30px_rgba(244,114,182,0.2)]">
              <GraduationCap className="w-12 h-12" />
            </div>
            <h2 className="text-4xl font-black text-white mb-4 font-display uppercase tracking-tight">ALUNOS</h2>
            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Jornada do Conhecimento</p>
          </Link>
        </div>

        {/* Alunos Ajudantes Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-24 w-full text-left"
        >
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-tech-magenta/10 rounded-2xl flex items-center justify-center text-tech-magenta shadow-[0_0_20px_rgba(244,114,182,0.2)] border border-tech-magenta/20">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-white font-display uppercase tracking-tight">Alunos Ajudantes</h2>
                <p className="text-slate-500 text-xs font-black uppercase tracking-widest">Lideranças que transformam a trilha</p>
              </div>
            </div>
            <Link 
              to="/ajudantes" 
              className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-tech-magenta hover:border-tech-magenta/30 hover:bg-tech-magenta/5 transition-all flex items-center gap-2 group"
            >
              Ver Lista Completa
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {helpers.length === 0 ? (
            <div className="glass-card p-12 rounded-[2.5rem] border-2 border-dashed border-white/5 text-center">
              <p className="text-slate-500 font-bold italic uppercase tracking-widest text-[10px]">Novos ajudantes serão escalados em breve pela trilha...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedGrades.map(grade => (
                <div key={grade} className="glass-card p-8 rounded-[2.5rem] border-white/5 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-tech-cyan/5 rounded-full blur-3xl -z-10 group-hover:bg-tech-cyan/10 transition-all" />
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-xs font-black text-tech-cyan uppercase tracking-[0.2em]">{grade}</span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{helpersByGrade[grade].length} {helpersByGrade[grade].length === 1 ? 'Ajudante' : 'Ajudantes'}</span>
                  </div>
                  
                  <div className="space-y-4">
                    {helpersByGrade[grade].map(helper => (
                      <div key={helper.id} className="flex items-center justify-between group/item">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-tech-bg/50 rounded-xl flex items-center justify-center text-xl border border-white/5 shadow-inner group-hover/item:border-tech-cyan/30 transition-all">
                            {helper.avatar}
                          </div>
                          <span className="font-black text-white text-sm tracking-tight group-hover/item:text-tech-cyan transition-colors truncate max-w-[150px]">
                            {helper.name}
                          </span>
                        </div>
                        <div className="w-6 h-6 rounded-lg bg-tech-cyan/10 flex items-center justify-center text-tech-cyan border border-tech-cyan/20">
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
