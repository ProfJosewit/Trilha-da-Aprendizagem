import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { useAuth } from '../App';
import { Users, GraduationCap } from 'lucide-react';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] text-center relative overflow-hidden">
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
      </motion.div>
    </div>
  );
}
