/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  Volume2, 
  Award, 
  HelpCircle,
  Building2,
  User,
  Activity,
  Heart,
  ChevronRight,
  ShieldCheck,
  Check
} from "lucide-react";
import { Quiz, HOSPITAL_DEPARTMENTS, QUIZZES } from "../types";

interface QuizTestProps {
  activeQuiz: Quiz | null;
  quizzes?: Quiz[];
  onNavigateBack: () => void;
}

export default function QuizTest({ activeQuiz, quizzes = [], onNavigateBack }: QuizTestProps) {
  const availableQuizzes = quizzes.length > 0 ? quizzes : QUIZZES;
  // Use active quiz or fallback to Week 1 if none loaded
  const defaultQuiz = activeQuiz || availableQuizzes[0] || QUIZZES[0];
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz>(defaultQuiz);
  
  // Registration state
  const [employeeName, setEmployeeName] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [isRegistered, setIsRegistered] = useState(false);
  
  // Quiz state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Result state
  const [resultScore, setResultScore] = useState<number>(0);
  const [correctAnswersCount, setCorrectAnswersCount] = useState<number>(0);
  const [corrections, setCorrections] = useState<Array<{
    id: number;
    isCorrect: boolean;
    userAnswer: string;
    correctAnswer: string;
    explanation: string;
  }>>([]);

  // Custom states for dialogs and inline messages to bypass iframe blocks
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showIncompleteConfirm, setShowIncompleteConfirm] = useState(false);
  const [departments, setDepartments] = useState<string[]>([]);

  // Fetch departments dynamically
  React.useEffect(() => {
    fetch("/api/departments")
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error("Failed to fetch departments");
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setDepartments(data);
        } else {
          setDepartments(HOSPITAL_DEPARTMENTS);
        }
      })
      .catch(() => {
        setDepartments(HOSPITAL_DEPARTMENTS);
      });
  }, []);

  // Sync selectedQuiz if activeQuiz changes and we haven't started or completed the test
  React.useEffect(() => {
    if (activeQuiz && !isRegistered && !isSubmitted) {
      setSelectedQuiz(activeQuiz);
    }
  }, [activeQuiz, isRegistered, isSubmitted]);

  const currentQuestion = selectedQuiz.questions[currentQuestionIndex];

  // Self-contained Web Audio API synthesizer for positive audio feedback
  const playVictorySound = (isPerfect: boolean) => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const audioCtx = new AudioContextClass();
      
      const playTone = (freq: number, start: number, duration: number, type: OscillatorType = "sine") => {
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + start);
        
        gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime + start);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + start + duration);
        
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        osc.start(audioCtx.currentTime + start);
        osc.stop(audioCtx.currentTime + start + duration);
      };

      if (isPerfect) {
        // Joyful perfect score fanfare
        playTone(261.63, 0.0, 0.15, "triangle"); // C4
        playTone(329.63, 0.12, 0.15, "triangle"); // E4
        playTone(392.00, 0.24, 0.15, "triangle"); // G4
        playTone(523.25, 0.36, 0.4, "sine");     // C5
      } else {
        // Standard pleasant completion chime
        playTone(329.63, 0.0, 0.2, "sine"); // E4
        playTone(392.00, 0.15, 0.3, "sine"); // G4
      }
    } catch (e) {
      console.warn("Chime playback bypassed due to browser policy:", e);
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeName.trim()) {
      setValidationError("Vui lòng nhập họ và tên của bạn.");
      return;
    }
    if (!selectedDept) {
      setValidationError("Vui lòng chọn Khoa/Phòng công tác của bạn.");
      return;
    }
    setValidationError(null);
    setIsRegistered(true);
  };

  const handleOptionSelect = (optionLetter: string) => {
    setUserAnswers({
      ...userAnswers,
      [currentQuestion.id]: optionLetter
    });
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < selectedQuiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleQuizChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const quizId = e.target.value;
    const foundQuiz = availableQuizzes.find((q) => q.id === quizId) || QUIZZES.find((q) => q.id === quizId);
    if (foundQuiz) {
      setSelectedQuiz(foundQuiz);
      // Reset state for new quiz
      setCurrentQuestionIndex(0);
      setUserAnswers({});
      setIsSubmitted(false);
      setValidationError(null);
    }
  };

  const handleSubmitQuiz = async () => {
    // Check if answered all questions
    const answeredCount = Object.keys(userAnswers).length;
    if (answeredCount < selectedQuiz.questions.length) {
      setShowIncompleteConfirm(true);
      return;
    }
    await executeSubmitQuiz();
  };

  const executeSubmitQuiz = async () => {
    setShowIncompleteConfirm(false);
    setSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeName: employeeName.trim(),
          department: selectedDept,
          quizId: selectedQuiz.id,
          answers: userAnswers
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Nộp bài không thành công.");
      }

      const data = await response.json();
      
      setResultScore(data.submission.score);
      setCorrectAnswersCount(data.submission.correctAnswersCount);
      setCorrections(data.corrections);
      setIsSubmitted(true);
      
      // Play delightful synthetic chime!
      playVictorySound(data.submission.score === 10);

    } catch (err: any) {
      console.error(err);
      setSubmitError(err.message || "Đã xảy ra lỗi khi kết nối máy chủ.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden min-h-[500px] flex flex-col relative">
      
      {/* CUSTOM INCOMPLETE CONFIRMATION MODAL OVERLAY */}
      {showIncompleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center text-amber-500">
                <HelpCircle className="w-8 h-8 animate-bounce" />
              </div>
              <h3 className="font-black text-gray-900 text-lg">
                Bạn Chưa Trả Lời Hết Câu Hỏi!
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed font-medium">
                Bạn vẫn còn câu hỏi chưa hoàn thành trong đề thi này. Bạn có chắc chắn muốn nộp bài thi ngay lập tức không? Điểm số sẽ được tính trên các câu hỏi đã chọn.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowIncompleteConfirm(false)}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-extrabold text-xs py-3.5 rounded-xl transition-all cursor-pointer"
              >
                Tiếp tục làm bài
              </button>
              <button
                type="button"
                onClick={executeSubmitQuiz}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs py-3.5 rounded-xl transition-all cursor-pointer shadow-lg shadow-amber-500/10"
              >
                Xác nhận nộp bài
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-[#0F8245] to-[#0c6c39] p-6 text-white relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full translate-x-12 -translate-y-8"></div>
        <button 
          onClick={onNavigateBack}
          className="flex items-center gap-1.5 text-xs text-emerald-100 hover:text-white mb-3 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại Bảng xếp hạng
        </button>

        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <span className="bg-[#E2231A] text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Hệ thống thi đua tức thì
            </span>
            <h1 className="text-xl font-black">
              Đánh Giá Kiến Thức Kiểm Soát Nhiễm Khuẩn
            </h1>
            <p className="text-xs text-emerald-100">
              Sáng kiến cải tiến KSNK - Trung tâm Y tế khu vực Bảo Thắng
            </p>
          </div>
          <Activity className="w-10 h-10 text-emerald-100/30 shrink-0" />
        </div>
      </div>

      {/* CASE 1: REGISTRATION AND QUIZ SELECT */}
      {!isRegistered && (
        <div className="p-6 md:p-8 space-y-6 flex-1 flex flex-col justify-center">
          <div className="space-y-2 text-center max-w-md mx-auto">
            <h2 className="text-lg font-extrabold text-gray-800">
              Nhập thông tin nhân viên tham gia
            </h2>
            <p className="text-xs text-gray-500">
              Hệ thống sẽ ghi nhận điểm số và tự động cộng dồn điểm thi đua tức thì cho khoa phòng của bạn!
            </p>
          </div>

          <form onSubmit={handleRegisterSubmit} className="max-w-md mx-auto w-full space-y-4">
            {validationError && (
              <div className="bg-red-50 border border-red-200 text-red-800 text-xs px-4 py-3 rounded-xl font-bold flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-red-600 rounded-full"></div>
                <span>{validationError}</span>
              </div>
            )}
            {/* Week Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                Chọn Đề Thi (Tuần)
              </label>
              <select
                value={selectedQuiz.id}
                onChange={handleQuizChange}
                className="w-full bg-gray-50 border border-gray-200 focus:border-[#0F8245] rounded-xl px-4 py-3 text-sm text-gray-800 font-medium focus:outline-hidden"
              >
                {availableQuizzes.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.title} (Tuần {q.week})
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-gray-500 italic">
                🎯 Mục tiêu: {selectedQuiz.objective}
              </p>
            </div>

            {/* Employee Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-gray-400" />
                Họ và Tên
              </label>
              <input
                type="text"
                placeholder="Ví dụ: Nguyễn Thị Hồng Hạnh"
                value={employeeName}
                onChange={(e) => setEmployeeName(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 focus:border-[#0F8245] rounded-xl px-4 py-3 text-sm focus:outline-hidden"
                required
              />
            </div>

            {/* Department Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-gray-400" />
                Khoa / Phòng Công Tác
              </label>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 focus:border-[#0F8245] rounded-xl px-4 py-3 text-sm focus:outline-hidden"
                required
              >
                <option value="">-- Chọn Khoa/Phòng của bạn --</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-[#0F8245] hover:bg-[#0c6c39] text-white font-extrabold text-sm py-3.5 rounded-xl transition-all shadow-md shadow-emerald-700/10 cursor-pointer flex items-center justify-center gap-1.5"
            >
              Vào làm bài thi <ChevronRight className="w-4 h-4" />
            </button>
          </form>

          <div className="text-center pt-4 border-t border-gray-100">
            <p className="text-[10px] text-gray-400">
              ⚡ Điểm thi đua khoa = (Điểm trung bình các bài test * 10) + Điểm cộng tham gia (1.5đ/lượt, tối đa 20đ).
            </p>
          </div>
        </div>
      )}

      {/* CASE 2: ACTIVE TESTING QUESTIONS */}
      {isRegistered && !isSubmitted && (
        <div className="p-6 md:p-8 flex-1 flex flex-col justify-between">
          
          {/* Active Status Header */}
          <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4 text-xs font-medium text-gray-500">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
              <span>Đang thi: <strong className="text-gray-800">{employeeName}</strong></span>
              <span className="text-gray-300">|</span>
              <span>Khoa: <strong className="text-gray-800">{selectedDept}</strong></span>
            </div>
            <div>
              Câu <strong className="text-[#0F8245]">{currentQuestionIndex + 1}</strong> / {selectedQuiz.questions.length}
            </div>
          </div>

          {/* Question Box */}
          <div className="space-y-6 flex-1">
            {/* Step indicator bubbles */}
            <div className="flex items-center space-x-1.5 justify-center mb-4">
              {selectedQuiz.questions.map((_, i) => (
                <div 
                  key={i}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    i === currentQuestionIndex 
                      ? "w-8 bg-[#0F8245]" 
                      : userAnswers[QUIZZES[0].questions[i]?.id || i + 1]
                        ? "w-2.5 bg-emerald-200" 
                        : "w-2.5 bg-gray-200"
                  }`}
                />
              ))}
            </div>

            {/* Question Text */}
            <div className="space-y-2">
              <span className="bg-emerald-100 text-[#0F8245] text-[10px] font-extrabold px-2 py-1 rounded-md uppercase">
                Câu Hỏi {currentQuestionIndex + 1}
              </span>
              <h3 className="text-base sm:text-lg font-black text-gray-950 leading-relaxed">
                {currentQuestion.question}
              </h3>
            </div>

            {/* Options List */}
            <div className="space-y-3 pt-2">
              {currentQuestion.options.map((option, idx) => {
                const optionLetter = option.substring(0, 1); // Extract 'A', 'B', 'C'
                const isSelected = userAnswers[currentQuestion.id] === optionLetter;

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleOptionSelect(optionLetter)}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center justify-between group cursor-pointer ${
                      isSelected 
                        ? "bg-emerald-50 border-[#0F8245] text-[#0F8245]" 
                        : "bg-white hover:bg-gray-50 border-gray-100 hover:border-gray-200 text-gray-700"
                    }`}
                  >
                    <span className={`text-sm font-semibold leading-relaxed ${isSelected ? "font-bold text-[#0F8245]" : ""}`}>
                      {option}
                    </span>
                    <div className={`w-5.5 h-5.5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      isSelected 
                        ? "border-[#0F8245] bg-[#0F8245]" 
                        : "border-gray-200 group-hover:border-gray-400"
                    }`}>
                      {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3px]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Stepper Buttons and Submit */}
          <div className="flex items-center justify-between border-t border-gray-100 pt-6 mt-6">
            <button
              onClick={handlePrevQuestion}
              disabled={currentQuestionIndex === 0}
              className={`px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                currentQuestionIndex === 0 
                  ? "opacity-40 cursor-not-allowed text-gray-400" 
                  : "hover:bg-gray-50 text-gray-700"
              }`}
            >
              Quay lại
            </button>

            {currentQuestionIndex < selectedQuiz.questions.length - 1 ? (
              <button
                onClick={handleNextQuestion}
                className="bg-[#0F8245] hover:bg-[#0c6c39] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
              >
                Tiếp tục <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmitQuiz}
                disabled={submitting}
                className="bg-[#E2231A] hover:bg-[#c11c14] text-white px-6 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 cursor-pointer shadow-md shadow-red-700/10"
              >
                {submitting ? "Đang gửi..." : "Nộp Bài Thi 🎯"}
              </button>
            )}
          </div>

          {submitError && (
            <p className="text-red-600 text-xs text-center mt-3 font-semibold">
              {submitError}
            </p>
          )}
        </div>
      )}

      {/* CASE 3: RESULTS AND CORRECTION REVIEW */}
      {isSubmitted && (
        <div className="p-6 md:p-8 space-y-6 flex-1 overflow-y-auto max-h-[700px]">
          
          {/* Summary Score Card */}
          <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-6 text-center space-y-3 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-24 h-24 bg-emerald-100/40 rounded-full -translate-x-6 -translate-y-6"></div>
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-emerald-100/40 rounded-full translate-x-6 translate-y-6"></div>

            <div className="relative z-10 space-y-1">
              <Award className="w-12 h-12 text-[#0F8245] mx-auto animate-bounce" />
              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">KẾT QUẢ CỦA BẠN</p>
              <h2 className="text-3xl font-black text-[#0F8245]">
                {resultScore} / 10 Điểm
              </h2>
              <p className="text-sm font-semibold text-gray-800">
                Chúc mừng <span className="text-[#0F8245] font-extrabold">{employeeName}</span> từ <span className="text-[#0F8245] font-extrabold">{selectedDept}</span> đã hoàn thành bài thi!
              </p>
              
              {/* Feedback text */}
              <div className="text-xs text-gray-600 max-w-md mx-auto pt-1">
                {resultScore === 10 ? (
                  <span className="bg-yellow-100 text-yellow-800 px-3 py-1.5 rounded-full font-bold flex items-center justify-center gap-1 w-fit mx-auto mt-2">
                    🌟 Xuất sắc! Bạn xứng đáng là Đại sứ KSNK danh dự.
                  </span>
                ) : resultScore >= 8 ? (
                  <span className="bg-emerald-100 text-[#0F8245] px-3 py-1.5 rounded-full font-bold flex items-center justify-center gap-1 w-fit mx-auto mt-2">
                    👏 Rất tốt! Bạn hiểu rất sâu sắc quy trình KSNK.
                  </span>
                ) : (
                  <span className="bg-orange-100 text-orange-800 px-3 py-1.5 rounded-full font-bold flex items-center justify-center gap-1 w-fit mx-auto mt-2">
                    💪 Cố gắng thêm nhé! Xem lại hướng dẫn giải thích ở dưới nhé.
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onNavigateBack}
              className="flex-1 bg-[#0F8245] hover:bg-[#0c6c39] text-white text-xs font-bold py-3.5 rounded-xl transition-all shadow-md shadow-emerald-700/10 cursor-pointer flex items-center justify-center gap-1.5"
            >
              📊 Xem bảng xếp hạng thay đổi tức thì
            </button>
            <button
              onClick={() => {
                // Play again
                setIsRegistered(false);
                setIsSubmitted(false);
                setUserAnswers({});
                setCurrentQuestionIndex(0);
              }}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold py-3.5 px-6 rounded-xl transition-all cursor-pointer"
            >
              Thi lại / Người khác thi
            </button>
          </div>

          {/* Detailed corrections with Explanations */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <h3 className="font-extrabold text-gray-900 text-base flex items-center gap-1.5">
              <HelpCircle className="w-5 h-5 text-gray-400" />
              Chi Tiết Sửa Bài & Giải Thích Khoa Học
            </h3>

            <div className="space-y-4">
              {corrections.map((corr, idx) => {
                const questionObj = selectedQuiz.questions.find((q) => q.id === corr.id)!;
                
                return (
                  <div 
                    key={corr.id}
                    className={`p-5 rounded-2xl border transition-all ${
                      corr.isCorrect 
                        ? "bg-emerald-50/30 border-emerald-100" 
                        : "bg-red-50/20 border-red-100"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          corr.isCorrect ? "bg-emerald-100 text-[#0F8245]" : "bg-red-100 text-red-600"
                        }`}>
                          Câu {idx + 1}: {corr.isCorrect ? "Đúng" : "Sai"}
                        </span>
                        <h4 className="font-bold text-gray-900 text-sm leading-relaxed pt-1">
                          {questionObj.question}
                        </h4>
                      </div>
                      {corr.isCorrect ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-1" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-1" />
                      )}
                    </div>

                    {/* Options summary */}
                    <div className="mt-3 space-y-1.5 text-xs">
                      {questionObj.options.map((opt, oIdx) => {
                        const optLetter = opt.substring(0, 1);
                        const isUserAnswer = corr.userAnswer === optLetter;
                        const isCorrectAnswer = corr.correctAnswer === optLetter;

                        let optionStyle = "text-gray-600";
                        if (isCorrectAnswer) {
                          optionStyle = "text-emerald-700 font-bold bg-emerald-100/50 px-2 py-1 rounded-md";
                        } else if (isUserAnswer && !corr.isCorrect) {
                          optionStyle = "text-red-700 font-semibold bg-red-100/50 px-2 py-1 rounded-md";
                        }

                        return (
                          <div key={oIdx} className={`flex items-center space-x-1.5 ${optionStyle}`}>
                            <span>{opt}</span>
                            {isCorrectAnswer && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                            {isUserAnswer && !corr.isCorrect && <XCircle className="w-3.5 h-3.5 text-red-500" />}
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanations (MANDATORY REQUIREMENT) */}
                    <div className="mt-4 bg-white/95 rounded-xl p-3.5 border border-gray-100 space-y-1 text-xs">
                      <p className="font-bold text-gray-700 flex items-center gap-1 text-[11px] uppercase tracking-wider">
                        <ShieldCheck className="w-4 h-4 text-[#0F8245]" />
                        Giải thích từ tác giả (Đồng chí Hồng Hạnh KSNK):
                      </p>
                      <p className="text-gray-600 italic leading-relaxed">
                        {corr.explanation}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
