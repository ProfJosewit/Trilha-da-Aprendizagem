import { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User } from 'firebase/auth';
import { auth, db } from './firebase';
import { collection, onSnapshot, query, orderBy, doc, getDoc, setDoc, getDocs, where } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { Star, Trophy, Users, LayoutDashboard, LogIn, LogOut, Trophy as TrophyIcon, User as UserIcon, MessageSquare, Send, CheckCircle, XCircle, Trash2, Plus, ChevronRight, ChevronLeft, Award } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utils ---
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
export interface Student {
  id: string;
  name: string;
  email: string;
  avatar: string;
  stars: number;
  trophies: string[];
}

export interface Suggestion {
  id: string;
  studentEmail: string;
  studentName: string;
  text: string;
  feedback: string;
  status: 'pending' | 'answered';
  createdAt: any;
}

// --- Constants ---
export const TROPHIES = [
  { id: 'amigo', name: 'Aluno Amigo', description: 'Ajuda os colegas com respeito e gentileza.' },
  { id: 'respeitoso', name: 'Aluno Respeitoso', description: 'Respeita a vez de falar e escuta os outros com atenção.' },
  { id: 'regras', name: 'Aluno Cumpridor de Regras', description: 'Respeita os combinados da sala e segue as orientações do professor.' },
  { id: 'master', name: 'Aluno Master', description: 'Tem bom comportamento dentro e fora da sala WIT.' },
  { id: 'organizado', name: 'Aluno Organizado', description: 'Cuida dos materiais (mouse, teclado e fone) e mantém tudo em ordem.' },
  { id: 'fila', name: 'Aluno Bom de Fila', description: 'Sobe e desce na fila com organização e silêncio.' },
  { id: 'ajudante', name: 'Aluno Ajudante', description: 'Auxilia o professor e os colegas sempre que necessário.' },
  { id: 'focado', name: 'Aluno Focado', description: 'Presta atenção nas explicações e realiza as atividades sem se distrair.' },
  { id: 'participativo', name: 'Aluno Participativo', description: 'Participa das aulas e se envolve nas atividades.' },
  { id: 'criativo', name: 'Aluno Criativo', description: 'Apresenta ideias diferentes e capricha nas atividades.' },
  { id: 'superacao', name: 'Aluno Superação', description: 'Se esforça para melhorar e não desiste diante das dificuldades.' },
  { id: 'google', name: 'Mestre do Google Sala de Aula', description: 'Acessa o Google Sala de Aula sozinho e realiza as atividades.' },
];

export const AVATARS = ["🌊", "✨", "🌱", "🌿", "☘️", "🍀", "🌵", "🌺", "🌻", "😺", "😸", "😹", "😻", "😼", "😽", "🙀", "😿", "😾", "⭐", "☄️", "🌌", "🚀", "🛸", "🌎", "🙂", "😊", "😄", "😁", "😃", "🤓", "😎", "🥳", "😇", "🤔", "😍", "😋", "😜", "😐"];

// --- Context ---
interface AuthState {
  user: { email: string; name: string; role: 'teacher' | 'student' } | null;
  loading: boolean;
  isTeacher: boolean;
  loginTeacher: (user: string, pass: string) => boolean;
  loginStudent: (email: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  isTeacher: false,
  loginTeacher: () => false,
  loginStudent: async () => false,
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

// --- Components ---
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import Ranking from './pages/Ranking';
import Home from './pages/Home';

export default function App() {
  const [authState, setAuthState] = useState<{
    user: { email: string; name: string; role: 'teacher' | 'student' } | null;
    loading: boolean;
  }>({ user: null, loading: true });

  useEffect(() => {
    const saved = localStorage.getItem('wit_session');
    if (saved) {
      setAuthState({ user: JSON.parse(saved), loading: false });
    } else {
      setAuthState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  const loginTeacher = (username: string, pass: string) => {
    if (username === 'profjosewit' && pass === '159632wit') {
      const user = { email: 'teacher@wit.com', name: 'Professor José', role: 'teacher' as const };
      setAuthState({ user, loading: false });
      localStorage.setItem('wit_session', JSON.stringify(user));
      return true;
    }
    return false;
  };

  const loginStudent = async (email: string) => {
    // Check if student exists in DB
    const q = query(collection(db, 'students'), where('email', '==', email));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const studentData = snapshot.docs[0].data();
      const user = { email, name: studentData.name, role: 'student' as const };
      setAuthState({ user, loading: false });
      localStorage.setItem('wit_session', JSON.stringify(user));
      return true;
    }
    return false;
  };

  const logout = () => {
    setAuthState({ user: null, loading: false });
    localStorage.removeItem('wit_session');
  };

  if (authState.loading) {
    return (
      <div className="min-h-screen bg-tech-bg flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360, scale: [1, 1.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="w-16 h-16 border-4 border-tech-cyan border-t-transparent rounded-full shadow-[0_0_20px_rgba(34,211,238,0.4)]"
        />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ 
      user: authState.user, 
      loading: authState.loading, 
      isTeacher: authState.user?.role === 'teacher',
      loginTeacher,
      loginStudent,
      logout 
    }}>
      <Router>
        <div className="min-h-screen bg-tech-bg font-sans text-slate-100 selection:bg-tech-cyan selection:text-tech-bg">
          <Navbar />
          <div className="max-w-7xl mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/teacher/*" element={<TeacherDashboard />} />
              <Route path="/student" element={<StudentDashboard />} />
              <Route path="/ranking" element={<Ranking />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </div>
      </Router>
    </AuthContext.Provider>
  );
}

function Navbar() {
  const { user, logout, isTeacher } = useAuth();
  const location = useLocation();

  return (
    <nav className="bg-tech-card/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-12 h-12 bg-gradient-to-br from-tech-cyan to-tech-magenta rounded-2xl flex items-center justify-center text-tech-bg shadow-[0_0_20px_rgba(34,211,238,0.3)] group-hover:scale-110 group-hover:rotate-6 transition-all">
            <Star className="w-7 h-7 fill-current" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-2xl tracking-tighter text-white font-display uppercase">Trilha da Aprendizagem</span>
            <span className="text-[10px] font-bold text-tech-cyan tracking-[0.2em] uppercase">Educação & Tecnologia</span>
          </div>
        </Link>

        <div className="flex items-center gap-8">
          <Link 
            to="/ranking" 
            className={cn(
              "flex items-center gap-2 font-bold uppercase tracking-widest text-xs transition-all",
              location.pathname === '/ranking' ? "text-tech-cyan" : "text-slate-400 hover:text-tech-cyan"
            )}
          >
            <TrophyIcon className="w-5 h-5" />
            <span className="hidden sm:inline">Ranking</span>
          </Link>

          {user && (
            <div className="flex items-center gap-4 pl-6 border-l border-white/10">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-black text-white">{user.name}</span>
                <span className="text-[10px] font-bold text-tech-magenta uppercase tracking-wider">{isTeacher ? 'Professor' : 'Aluno'}</span>
              </div>
              <button
                onClick={logout}
                className="p-3 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all border border-transparent hover:border-red-400/20"
                title="Sair"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
