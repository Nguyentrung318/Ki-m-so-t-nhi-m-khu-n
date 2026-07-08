/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Trophy, 
  Settings, 
  Award, 
  HeartHandshake, 
  HelpCircle, 
  Sparkles,
  Zap,
  BookOpen,
  LayoutDashboard
} from "lucide-react";
import { Quiz } from "./types";
import EmulationDashboard from "./components/EmulationDashboard";
import QuizTest from "./components/QuizTest";
import AdminPanel from "./components/AdminPanel";

export default function App() {
  // Navigation states: 'dashboard', 'test', 'admin'
  const [view, setView] = useState<"dashboard" | "test" | "admin">("dashboard");
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loadingQuiz, setLoadingQuiz] = useState(true);

  // Fetch all quizzes
  const fetchQuizzes = async () => {
    try {
      const res = await fetch("/api/quizzes");
      if (res.ok) {
        const data = await res.json();
        setQuizzes(data);
      }
    } catch (err) {
      console.error("Error fetching quizzes list:", err);
    }
  };

  // Fetch currently active quiz from Express backend
  const fetchActiveQuiz = async () => {
    try {
      const res = await fetch("/api/active-quiz");
      if (res.ok) {
        const quizData = await res.json();
        setActiveQuiz(quizData);
      }
    } catch (err) {
      console.error("Error fetching active quiz:", err);
    } finally {
      setLoadingQuiz(false);
    }
  };

  useEffect(() => {
    fetchActiveQuiz();
    fetchQuizzes();

    // Deep-linking from QR Code scans: e.g., ?view=test&quiz=week2
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get("view");
    if (viewParam === "test") {
      setView("test");
    } else if (viewParam === "admin") {
      setView("admin");
    }
  }, []);

  const handleActiveQuizChange = (quizId: string) => {
    fetchActiveQuiz();
    fetchQuizzes();
  };

  return (
    <div className="min-h-screen bg-slate-50/50 text-gray-800 flex flex-col font-sans antialiased">
      
      {/* 1. TOP MAIN BRAND HEADER */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-xs" id="app-main-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          {/* Logo brand & Name */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setView("dashboard")}>
            {/* Custom stylized medical cross & mountain graphic representing the Bao Thang logo */}
            <div className="w-12 h-12 bg-[#0F8245] rounded-full flex items-center justify-center text-white shadow-md shadow-emerald-700/10 shrink-0 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-[#0F8245] to-[#0c6c39]"></div>
              {/* Mountain-slope lines */}
              <div className="absolute bottom-0 inset-x-0 h-4 bg-white/20 rotate-12 translate-y-2 transform origin-bottom-left"></div>
              {/* Medical Caduceus / Cross in red */}
              <div className="relative z-10 flex items-center justify-center">
                <span className="font-serif text-lg font-black tracking-tighter text-[#E2231A] bg-white w-7 h-7 rounded-full flex items-center justify-center border border-emerald-100">
                  B
                </span>
              </div>
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <h1 className="font-black text-xs sm:text-sm tracking-wider text-[#0F8245] uppercase">
                  Trung Tâm Y Tế Khu Vực Bảo Thắng
                </h1>
                <span className="bg-[#E2231A]/10 text-[#E2231A] text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase shrink-0">
                  Lào Cai
                </span>
              </div>
              <p className="font-extrabold text-sm sm:text-base text-gray-900 leading-tight">
                Hệ Thống Đánh Giá & Xếp Hạng Thi Đua KSNK Tức Thì
              </p>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center space-x-2 sm:space-x-3 self-end sm:self-center">
            {/* Dashboard button */}
            <button
              onClick={() => setView("dashboard")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                view === "dashboard"
                  ? "bg-[#0F8245] text-white shadow-xs"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Bảng Thi Đua</span>
            </button>

            {/* Test button */}
            <button
              onClick={() => setView("test")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                view === "test"
                  ? "bg-[#0F8245] text-white shadow-xs"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>Làm Bài Thi</span>
            </button>

            {/* Admin button */}
            <button
              onClick={() => setView("admin")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                view === "admin"
                  ? "bg-[#0F8245] text-white shadow-xs"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Cấu Hình</span>
            </button>
          </div>

        </div>
      </header>

      {/* 2. MAIN AREA CONTENT */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6" id="app-main-content">
        {loadingQuiz ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
            <div className="w-8 h-8 border-4 border-t-[#0F8245] border-gray-200 rounded-full animate-spin"></div>
            <p className="text-xs text-gray-500 font-semibold">Đang chuẩn bị hệ thống đề thi...</p>
          </div>
        ) : view === "dashboard" ? (
          <EmulationDashboard 
            activeQuiz={activeQuiz} 
            onNavigateToTest={() => setView("test")}
            onNavigateToAdmin={() => setView("admin")}
          />
        ) : view === "test" ? (
          <QuizTest 
            activeQuiz={activeQuiz} 
            quizzes={quizzes}
            onNavigateBack={() => setView("dashboard")} 
          />
        ) : (
          <AdminPanel 
            activeQuiz={activeQuiz} 
            quizzes={quizzes}
            onActiveQuizChange={handleActiveQuizChange}
            onQuizAdded={fetchQuizzes}
            onNavigateBack={() => setView("dashboard")}
          />
        )}
      </main>

      {/* 3. FOOTER */}
      <footer className="bg-white border-t border-gray-100 py-6 text-center text-xs text-gray-400 mt-auto" id="app-main-footer">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="font-bold text-gray-500">
            © 2026 Trung tâm Y tế khu vực Bảo Thắng, tỉnh Lào Cai
          </p>
          <p className="text-gray-400">
            Sáng kiến: <strong className="text-gray-500 font-semibold">"Giải pháp nâng cao năng lực và ý thức tuân thủ phân loại, thu gom chất thải y tế của nhân viên y tế tại Trung tâm Y tế khu vực Bảo Thắng, tỉnh Lào Cai"</strong>
          </p>
          <p className="text-[11px] text-gray-400">
            Tác giả: <strong className="text-gray-500 font-semibold">Nguyễn Thị Hồng Hạnh</strong> (Điều dưỡng trưởng khoa Kiểm soát nhiễm khuẩn) • Đồng tác giả: <strong className="text-gray-500 font-semibold">Nguyễn Thị Thêm</strong> (Khoa Truyền nhiễm)
          </p>
          <div className="flex justify-center space-x-4 pt-1 text-[10px] text-gray-400 font-mono">
            <span>Server Cổng: 3000</span>
            <span>•</span>
            <span>Đồng bộ: Tức thì (Real-time polling)</span>
            <span>•</span>
            <span>HĐ KSNK Bảo Thắng</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
