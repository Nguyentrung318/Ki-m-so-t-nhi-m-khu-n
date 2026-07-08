/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Settings, 
  Trash2, 
  Zap, 
  RotateCcw, 
  CheckCircle, 
  Search, 
  Sliders, 
  BookOpen, 
  Plus, 
  Sparkles,
  Award,
  Download,
  Database,
  Palette,
  Edit2,
  X,
  Building2
} from "lucide-react";
import { Quiz, QUIZZES } from "../types";

interface AdminPanelProps {
  activeQuiz: Quiz | null;
  quizzes?: Quiz[];
  onActiveQuizChange: (quizId: string) => void;
  onQuizAdded?: () => void;
  onNavigateBack: () => void;
}

interface RawSubmission {
  id: string;
  employeeName: string;
  department: string;
  quizId: string;
  score: number;
  correctAnswersCount: number;
  timestamp: string;
}

export default function AdminPanel({ 
  activeQuiz, 
  quizzes = [],
  onActiveQuizChange, 
  onQuizAdded,
  onNavigateBack 
}: AdminPanelProps) {
  const availableQuizzes = quizzes.length > 0 ? quizzes : QUIZZES;

  const [submissions, setSubmissions] = useState<RawSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDeptFilter, setSelectedDeptFilter] = useState("");
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedCount, setSeedCount] = useState(0);

  // New quiz state
  const [newQuizTitle, setNewQuizTitle] = useState("");
  const [newQuizWeek, setNewQuizWeek] = useState(availableQuizzes.length + 1);
  const [newQuizObjective, setNewQuizObjective] = useState("");
  const [newQuizQuestions, setNewQuizQuestions] = useState<Array<{
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
  }>>([
    { question: "", options: ["A. ", "B. ", "C. ", "D. "], correctAnswer: "A", explanation: "" }
  ]);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [quizFormError, setQuizFormError] = useState<string | null>(null);
  const [quizFormSuccess, setQuizFormSuccess] = useState<string | null>(null);

  // Department Management state
  const [adminDepartments, setAdminDepartments] = useState<string[]>([]);
  const [newDeptName, setNewDeptName] = useState("");
  const [editingDeptIndex, setEditingDeptIndex] = useState<number | null>(null);
  const [editingDeptName, setEditingDeptName] = useState("");
  const [deptToDelete, setDeptToDelete] = useState<string | null>(null);

  // Custom visual state confirmation and system alerts to prevent Iframe Blocked alerts
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [adminNotification, setAdminNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Auto-clear admin notifications after 4 seconds
  useEffect(() => {
    if (adminNotification) {
      const timer = setTimeout(() => {
        setAdminNotification(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [adminNotification]);

  // Sync new quiz week on load/update
  useEffect(() => {
    setNewQuizWeek(availableQuizzes.length + 1);
  }, [quizzes]);

  // Quiz form helper functions
  const handleAddQuestion = () => {
    setNewQuizQuestions([
      ...newQuizQuestions,
      { question: "", options: ["A. ", "B. ", "C. ", "D. "], correctAnswer: "A", explanation: "" }
    ]);
  };

  const handleRemoveQuestion = (idx: number) => {
    if (newQuizQuestions.length <= 1) return;
    setNewQuizQuestions(newQuizQuestions.filter((_, i) => i !== idx));
  };

  const handleQuestionChange = (idx: number, field: string, value: any) => {
    const updated = [...newQuizQuestions];
    updated[idx] = { ...updated[idx], [field]: value };
    setNewQuizQuestions(updated);
  };

  const handleOptionChange = (qIdx: number, optIdx: number, value: string) => {
    const updated = [...newQuizQuestions];
    const updatedOptions = [...updated[qIdx].options];
    updatedOptions[optIdx] = value;
    updated[qIdx] = { ...updated[qIdx], options: updatedOptions };
    setNewQuizQuestions(updated);
  };

  const handleSubmitNewQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingQuiz(true);
    setQuizFormError(null);
    setQuizFormSuccess(null);

    try {
      if (!newQuizTitle.trim()) {
        throw new Error("Tiêu đề đề thi không được để trống.");
      }
      if (newQuizQuestions.some(q => !q.question.trim())) {
        throw new Error("Vui lòng điền đầy đủ nội dung câu hỏi.");
      }

      const response = await fetch("/api/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newQuizTitle,
          week: Number(newQuizWeek),
          objective: newQuizObjective,
          questions: newQuizQuestions
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Không thể nạp đề thi mới.");
      }

      setQuizFormSuccess("Nạp đề thi mới lên hệ thống thành công!");
      setNewQuizTitle("");
      setNewQuizObjective("");
      setNewQuizQuestions([
        { question: "", options: ["A. ", "B. ", "C. ", "D. "], correctAnswer: "A", explanation: "" }
      ]);
      
      if (onQuizAdded) {
        onQuizAdded();
      }
    } catch (err: any) {
      setQuizFormError(err.message || "Đã xảy ra lỗi khi nạp đề.");
    } finally {
      setSubmittingQuiz(false);
    }
  };

  // Fetch all raw submissions
  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/submissions");
      if (!res.ok) throw new Error("Không thể tải lịch sử nộp bài.");
      const data = await res.json();
      setSubmissions(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi khi tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch departments list
  const fetchAdminDepartments = async () => {
    try {
      const res = await fetch("/api/departments");
      if (!res.ok) throw new Error("Không thể tải danh sách khoa/phòng.");
      const data = await res.json();
      setAdminDepartments(data);
    } catch (err: any) {
      console.error(err);
    }
  };

  // Add department
  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;
    const name = newDeptName.trim();
    try {
      const res = await fetch("/api/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Không thể thêm khoa/phòng.");
      }
      const data = await res.json();
      setAdminDepartments(data.departments);
      setNewDeptName("");
      setAdminNotification({ type: "success", message: `Đã thêm khoa/phòng "${name}" thành công!` });
    } catch (err: any) {
      setAdminNotification({ type: "error", message: err.message });
    }
  };

  // Edit department
  const handleEditDepartment = async (oldName: string, newName: string) => {
    if (!newName.trim() || oldName === newName.trim()) {
      setEditingDeptIndex(null);
      return;
    }
    const cleanNewName = newName.trim();
    try {
      const res = await fetch("/api/departments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldName, newName: cleanNewName })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Không thể sửa khoa/phòng.");
      }
      const data = await res.json();
      setAdminDepartments(data.departments);
      setEditingDeptIndex(null);
      setAdminNotification({ type: "success", message: `Đã đổi tên khoa/phòng thành "${cleanNewName}" thành công!` });
      // Refetch submissions because names might have changed
      await fetchSubmissions();
    } catch (err: any) {
      setAdminNotification({ type: "error", message: err.message });
    }
  };

  // Delete department
  const handleDeleteDepartment = async (name: string) => {
    try {
      const res = await fetch("/api/departments", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Không thể xóa khoa/phòng.");
      }
      const data = await res.json();
      setAdminDepartments(data.departments);
      setDeptToDelete(null);
      setAdminNotification({ type: "success", message: `Đã xóa khoa/phòng "${name}" thành công!` });
    } catch (err: any) {
      setAdminNotification({ type: "error", message: err.message });
    }
  };

  useEffect(() => {
    fetchSubmissions();
    fetchAdminDepartments();
  }, [activeQuiz]);

  // Handle active quiz week change
  const handleWeekChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const quizId = e.target.value;
    try {
      const res = await fetch("/api/active-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId })
      });
      if (!res.ok) throw new Error("Không thể thay đổi đề thi kích hoạt.");
      onActiveQuizChange(quizId);
      setAdminNotification({ type: "success", message: "Đã đổi đề thi kích hoạt sang tuần mới thành công!" });
    } catch (err: any) {
      setAdminNotification({ type: "error", message: err.message || "Lỗi khi đổi đề thi." });
    }
  };

  // Simulate a random submission
  const handleSeedSubmission = async () => {
    setIsSeeding(true);
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      if (!res.ok) throw new Error("Không thể mô phỏng nộp bài.");
      setSeedCount((prev) => prev + 1);
      setAdminNotification({ type: "success", message: "Đã mô phỏng 1 lượt thi ngẫu nhiên thành công!" });
      // Refresh submissions
      await fetchSubmissions();
    } catch (err: any) {
      setAdminNotification({ type: "error", message: err.message || "Lỗi mô phỏng." });
    } finally {
      setIsSeeding(false);
    }
  };

  // Reset all data completely - show confirmation state modal first
  const handleResetData = () => {
    setShowResetConfirm(true);
  };

  const executeResetData = async () => {
    setShowResetConfirm(false);
    try {
      const res = await fetch("/api/reset", { method: "POST" });
      if (!res.ok) throw new Error("Không thể đặt lại dữ liệu.");
      onActiveQuizChange("week1");
      setSeedCount(0);
      setAdminNotification({ type: "success", message: "Hệ thống đã được reset toàn bộ dữ liệu thành công!" });
      await fetchSubmissions();
      await fetchAdminDepartments();
    } catch (err: any) {
      setAdminNotification({ type: "error", message: err.message || "Lỗi reset dữ liệu." });
    }
  };

  // Extract unique departments from submissions for filter dropdown
  const uniqueDepts = Array.from(new Set(submissions.map((s) => s.department))).sort();
  const filterDepts = Array.from(new Set([...adminDepartments, ...uniqueDepts])).sort();

  // Filter submissions
  const filteredSubmissions = submissions.filter((sub) => {
    const matchesSearch = 
      sub.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = selectedDeptFilter ? sub.department === selectedDeptFilter : true;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-6 relative">
      
      {/* CUSTOM ADMIN NOTIFICATION BANNER */}
      {adminNotification && (
        <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3.5 rounded-2xl shadow-xl border transition-all animate-bounce ${
          adminNotification.type === "success" 
            ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
            : "bg-red-50 border-red-200 text-red-800"
        }`}>
          {adminNotification.type === "success" ? (
            <CheckCircle className="w-5 h-5 text-[#0F8245] shrink-0" />
          ) : (
            <div className="w-5 h-5 bg-red-600 rounded-full text-white flex items-center justify-center font-bold text-xs shrink-0">!</div>
          )}
          <span className="font-extrabold text-xs">{adminNotification.message}</span>
        </div>
      )}

      {/* CUSTOM SYSTEM RESET CONFIRMATION MODAL OVERLAY */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-600">
                <Trash2 className="w-8 h-8 animate-pulse" />
              </div>
              <h3 className="font-black text-gray-900 text-lg md:text-xl">
                Xác Nhận Reset Toàn Bộ Dữ Liệu?
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed font-medium">
                Hành động này sẽ <strong className="text-red-600 font-bold">XÓA SẠCH TOÀN BỘ</strong> lịch sử thi và kết quả nộp bài của các khoa/phòng, đồng thời khôi phục trạng thái cuộc thi về Tuần 1. Bạn có chắc chắn muốn thực hiện?
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-extrabold text-xs py-3.5 rounded-xl transition-all cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={executeResetData}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs py-3.5 rounded-xl transition-all cursor-pointer shadow-lg shadow-red-500/10"
              >
                Xác nhận xóa sạch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM DEPARTMENT DELETE CONFIRMATION MODAL OVERLAY */}
      {deptToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-600">
                <Trash2 className="w-8 h-8 animate-pulse" />
              </div>
              <h3 className="font-black text-gray-900 text-lg md:text-xl">
                Xác Nhận Xóa Khoa / Phòng?
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed font-medium">
                Bạn có chắc chắn muốn xóa khoa/phòng <strong className="text-red-600 font-bold">"{deptToDelete}"</strong> khỏi danh sách?
              </p>
              <p className="text-[10px] text-gray-400 leading-relaxed">
                * Lưu ý: Thao tác này chỉ xóa khoa/phòng khỏi danh sách đăng ký thi mới. Lịch sử làm bài trước đây (nếu có) vẫn được lưu giữ để đảm bảo tính khách quan của bảng xếp hạng.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeptToDelete(null)}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-extrabold text-xs py-3.5 rounded-xl transition-all cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => handleDeleteDepartment(deptToDelete)}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs py-3.5 rounded-xl transition-all cursor-pointer shadow-lg shadow-red-500/10"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. TOP CONTROL SETTING BAR */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* A. ACTIVE QUIZ CONTROLS */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4">
          <div className="flex items-center space-x-2 text-[#0F8245] border-b border-gray-50 pb-3">
            <Settings className="w-5 h-5" />
            <h3 className="font-extrabold text-gray-900 text-sm md:text-base">Thiết Lập Đề Thi Tuần</h3>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
              Chọn Đề Thi Kích Hoạt
            </label>
            <select
              value={activeQuiz?.id || "week1"}
              onChange={handleWeekChange}
              className="w-full bg-gray-50 border border-gray-200 focus:border-[#0F8245] rounded-xl px-3.5 py-2.5 text-sm font-semibold focus:outline-hidden"
            >
              {availableQuizzes.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.title}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-gray-400 italic">
              * Thay đổi đề thi kích hoạt sẽ làm mới Bảng xếp hạng thi đua sang tuần đó lập tức.
            </p>
          </div>
        </div>

        {/* B. SIMULATION & TESTING ENGINE */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4">
          <div className="flex items-center space-x-2 text-[#00A3E0] border-b border-gray-50 pb-3">
            <Zap className="w-5 h-5 text-yellow-500 fill-yellow-400 animate-pulse" />
            <h3 className="font-extrabold text-gray-900 text-sm md:text-base">Mô Phỏng Tức Thì</h3>
          </div>

          <div className="space-y-3">
            <p className="text-xs text-gray-600">
              Thêm một bài thi ngẫu nhiên để kiểm tra hiệu ứng cập nhật bảng xếp hạng trong thời gian thực!
            </p>
            <button
              onClick={handleSeedSubmission}
              disabled={isSeeding}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold py-3 px-4 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              {isSeeding ? "Đang tạo bài thi..." : "Giả lập 1 lượt nộp bài"}
            </button>
            {seedCount > 0 && (
              <p className="text-[10px] text-emerald-600 font-semibold text-center">
                Đã giả lập thành công {seedCount} lượt thi đua mới!
              </p>
            )}
          </div>
        </div>

        {/* C. SYSTEM RESET & BLUEPRINTS */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4">
          <div className="flex items-center space-x-2 text-red-600 border-b border-gray-50 pb-3">
            <Trash2 className="w-5 h-5" />
            <h3 className="font-extrabold text-gray-900 text-sm md:text-base">Dọn Dẹp & Khôi Phục</h3>
          </div>

          <div className="space-y-3">
            <p className="text-xs text-gray-600">
              Đặt lại hệ thống về trạng thái ban đầu để tổ chức cuộc thi tuần mới từ đầu.
            </p>
            <button
              onClick={handleResetData}
              className="w-full bg-red-50 hover:bg-red-100 text-red-600 text-xs font-extrabold py-3 px-4 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-red-200"
            >
              <RotateCcw className="w-4 h-4" />
              Reset toàn bộ dữ liệu
            </button>
          </div>
        </div>

      </div>

      {/* 2. SPECIFIC BRAND IDENTITY OVERVIEW CARD */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
        <div className="flex items-center gap-2 border-b border-gray-50 pb-3 text-[#0F8245]">
          <Palette className="w-6 h-6" />
          <h3 className="font-black text-gray-900 text-base">
            Cẩm Nang Phối Màu Logo Thương Hiệu Bệnh Viện
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-3 p-4 bg-[#0F8245]/5 rounded-2xl border border-[#0F8245]/10">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#0F8245] shadow-inner border border-white"></span>
              <span className="font-extrabold text-gray-900 text-sm">Xanh Lục Bảo Thắng</span>
            </div>
            <p className="text-[11px] text-gray-400 font-bold font-mono">Hex Code: #0F8245</p>
            <p className="text-xs text-gray-700 leading-relaxed">
              Màu chủ đạo trong logo của Trung tâm Y tế khu vực Bảo Thắng. Đại diện cho sự sống, an toàn y tế, môi trường bệnh viện xanh - sạch - đẹp, và tính chuyên nghiệp của Khoa Kiểm soát nhiễm khuẩn.
            </p>
          </div>

          <div className="space-y-3 p-4 bg-[#E2231A]/5 rounded-2xl border border-[#E2231A]/10">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#E2231A] shadow-inner border border-white"></span>
              <span className="font-extrabold text-gray-900 text-sm">Đỏ Y Khoa Tâm Huyết</span>
            </div>
            <p className="text-[11px] text-gray-400 font-bold font-mono">Hex Code: #E2231A</p>
            <p className="text-xs text-gray-700 leading-relaxed">
              Màu của biểu tượng gậy thần chữ B nổi bật ở trung tâm. Tượng trưng cho sự tận hiến, lòng nhân ái của y bác sĩ, tính chính xác và tinh thần khẩn trương trong cứu chữa người bệnh.
            </p>
          </div>

          <div className="space-y-3 p-4 bg-[#00A3E0]/5 rounded-2xl border border-[#00A3E0]/10">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#00A3E0] shadow-inner border border-white"></span>
              <span className="font-extrabold text-gray-900 text-sm">Xanh Sông Hồng</span>
            </div>
            <p className="text-[11px] text-gray-400 font-bold font-mono">Hex Code: #00A3E0</p>
            <p className="text-xs text-gray-700 leading-relaxed">
              Màu dòng nước uốn lượn dưới chân núi trong logo. Thể hiện sự mát lành, tính tuần hoàn liên tục, sự minh bạch khách quan trong chấm điểm thi đua và khát vọng số hóa không ngừng.
            </p>
          </div>
        </div>
      </div>

      {/* NEW SECTION: QUIZ CREATION / UPLOAD FORM (Nạp đề) */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-6">
        <div className="flex items-center gap-2 border-b border-gray-50 pb-3 text-[#0F8245]">
          <BookOpen className="w-6 h-6" />
          <h3 className="font-black text-gray-900 text-base">
            Nạp Đề Thi Trắc Nghiệm Mới
          </h3>
        </div>

        <form onSubmit={handleSubmitNewQuiz} className="space-y-6">
          {quizFormSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-3 rounded-xl flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-[#0F8245] shrink-0" />
              <span className="font-semibold">{quizFormSuccess}</span>
            </div>
          )}

          {quizFormError && (
            <div className="bg-red-50 border border-red-200 text-red-800 text-xs px-4 py-3 rounded-xl flex items-center gap-2">
              <span className="font-semibold">{quizFormError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-1.5">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                Tiêu đề đề thi <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={newQuizTitle}
                onChange={(e) => setNewQuizTitle(e.target.value)}
                placeholder="Ví dụ: ĐỀ THI TUẦN 5: QUY TRÌNH THU GOM CHẤT THẢI Y TẾ"
                className="w-full bg-gray-50 border border-gray-200 focus:border-[#0F8245] rounded-xl px-4 py-2.5 text-xs text-gray-800 focus:outline-hidden font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                Tuần thi đấu <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="1"
                value={newQuizWeek}
                onChange={(e) => setNewQuizWeek(Number(e.target.value))}
                className="w-full bg-gray-50 border border-gray-200 focus:border-[#0F8245] rounded-xl px-4 py-2.5 text-xs text-gray-800 focus:outline-hidden font-medium"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
              Mục tiêu / Sứ mệnh tuyên truyền
            </label>
            <input
              type="text"
              value={newQuizObjective}
              onChange={(e) => setNewQuizObjective(e.target.value)}
              placeholder="Ví dụ: Nâng cao ý thức phân biệt màu sắc túi đựng rác thải tại các phòng bệnh nhân..."
              className="w-full bg-gray-50 border border-gray-200 focus:border-[#0F8245] rounded-xl px-4 py-2.5 text-xs text-gray-800 focus:outline-hidden font-medium"
            />
          </div>

          {/* QUESTION LIST BUILDER */}
          <div className="space-y-4 border-t border-gray-50 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-gray-800 uppercase tracking-wider">
                Danh sách câu hỏi ({newQuizQuestions.length})
              </span>
              <button
                type="button"
                onClick={handleAddQuestion}
                className="bg-emerald-50 hover:bg-emerald-100 text-[#0F8245] text-xs font-bold px-3 py-1.5 rounded-lg border border-emerald-100 flex items-center gap-1 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm câu hỏi
              </button>
            </div>

            <div className="space-y-6">
              {newQuizQuestions.map((q, qIdx) => (
                <div key={qIdx} className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 space-y-4 relative">
                  <div className="flex items-center justify-between border-b border-gray-100/60 pb-2">
                    <span className="text-xs font-black text-[#0F8245]">
                      Câu hỏi {qIdx + 1}
                    </span>
                    {newQuizQuestions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion(qIdx)}
                        className="text-red-500 hover:text-red-700 transition-colors p-1"
                        title="Xóa câu hỏi này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider">
                      Nội dung câu hỏi <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={2}
                      value={q.question}
                      onChange={(e) => handleQuestionChange(qIdx, "question", e.target.value)}
                      placeholder="Nhập câu hỏi..."
                      className="w-full bg-white border border-gray-200 focus:border-[#0F8245] rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-hidden font-medium"
                    />
                  </div>

                  {/* Options A, B, C, D */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {q.options.map((opt, oIdx) => {
                      const prefix = String.fromCharCode(65 + oIdx); // A, B, C, D
                      return (
                        <div key={oIdx} className="space-y-1">
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider">
                            Đáp án {prefix}
                          </label>
                          <input
                            type="text"
                            required
                            value={opt}
                            onChange={(e) => handleOptionChange(qIdx, oIdx, e.target.value)}
                            placeholder={`Nội dung phương án ${prefix}`}
                            className="w-full bg-white border border-gray-200 focus:border-[#0F8245] rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-hidden font-medium"
                          />
                        </div>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Correct answer */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider">
                        Đáp án đúng <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={q.correctAnswer}
                        onChange={(e) => handleQuestionChange(qIdx, "correctAnswer", e.target.value)}
                        className="w-full bg-white border border-gray-200 focus:border-[#0F8245] rounded-xl px-3 py-2 text-xs font-semibold focus:outline-hidden"
                      >
                        <option value="A">Phương án A</option>
                        <option value="B">Phương án B</option>
                        <option value="C">Phương án C</option>
                        <option value="D">Phương án D</option>
                      </select>
                    </div>

                    {/* Explanation */}
                    <div className="md:col-span-2 space-y-1.5">
                      <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider">
                        Giải thích đáp án đúng
                      </label>
                      <input
                        type="text"
                        value={q.explanation}
                        onChange={(e) => handleQuestionChange(qIdx, "explanation", e.target.value)}
                        placeholder="Giải thích chi tiết vì sao đáp án này đúng..."
                        className="w-full bg-white border border-gray-200 focus:border-[#0F8245] rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-hidden font-medium"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-50 pt-4 flex justify-end">
            <button
              type="submit"
              disabled={submittingQuiz}
              className="bg-[#0F8245] hover:bg-[#0c6b39] disabled:bg-gray-400 text-white font-extrabold text-xs px-6 py-3 rounded-xl transition-all cursor-pointer flex items-center gap-2"
            >
              {submittingQuiz ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                  Đang tải lên hệ thống...
                </>
              ) : (
                <>Nạp Đề & Đăng Tải Hệ Thống</>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* 2.5 DEPARTMENT LIST MANAGEMENT SECTION */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-6">
        <div className="flex items-center gap-2 border-b border-gray-50 pb-3 text-[#0F8245]">
          <Building2 className="w-6 h-6" />
          <h3 className="font-black text-gray-900 text-base">
            Quản Lý Danh Sách Khoa / Phòng Công Tác
          </h3>
        </div>

        {/* Form to add a department */}
        <form onSubmit={handleAddDepartment} className="flex gap-2 max-w-md">
          <input
            type="text"
            required
            value={newDeptName}
            onChange={(e) => setNewDeptName(e.target.value)}
            placeholder="Nhập tên khoa/phòng mới..."
            className="flex-1 bg-gray-50 border border-gray-200 focus:border-[#0F8245] rounded-xl px-4 py-2.5 text-xs text-gray-800 focus:outline-hidden font-medium"
          />
          <button
            type="submit"
            className="bg-[#0F8245] hover:bg-[#0c6b39] text-white text-xs font-extrabold px-5 py-2.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" /> Thêm Khoa/Phòng
          </button>
        </form>

        {/* List of departments in a responsive grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {adminDepartments.map((dept, idx) => {
            const isEditing = editingDeptIndex === idx;

            return (
              <div
                key={idx}
                className={`p-3 rounded-2xl border transition-all flex items-center justify-between ${
                  isEditing
                    ? "bg-emerald-50/50 border-emerald-200"
                    : "bg-gray-50/40 border-gray-100 hover:border-gray-200"
                }`}
              >
                {isEditing ? (
                  <div className="flex items-center gap-1.5 w-full">
                    <input
                      type="text"
                      value={editingDeptName}
                      onChange={(e) => setEditingDeptName(e.target.value)}
                      className="flex-1 bg-white border border-emerald-300 focus:border-[#0F8245] rounded-lg px-2.5 py-1.5 text-xs text-gray-800 focus:outline-hidden font-medium"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => handleEditDepartment(dept, editingDeptName)}
                      className="px-2 py-1.5 bg-[#0F8245] text-white rounded-lg hover:bg-[#0c6b39] transition-all cursor-pointer text-[10px] font-bold"
                      title="Lưu"
                    >
                      Lưu
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingDeptIndex(null)}
                      className="px-2 py-1.5 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition-all cursor-pointer text-[10px] font-bold"
                      title="Hủy"
                    >
                      Hủy
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="text-xs font-bold text-gray-700 truncate mr-2" title={dept}>
                      {dept}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingDeptIndex(idx);
                          setEditingDeptName(dept);
                        }}
                        className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-all cursor-pointer"
                        title="Sửa tên khoa/phòng"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeptToDelete(dept)}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                        title="Xóa khoa/phòng"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. LOG OF ALL SUBMISSIONS TABLE */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 space-y-4">
        
        {/* Table header and filtering */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div className="space-y-0.5">
            <h3 className="font-black text-gray-900 text-base flex items-center gap-1.5">
              <Database className="w-5 h-5 text-gray-500" />
              Lịch Sử Nhân Viên Nộp Bài & Chi Tiết Điểm Số
            </h3>
            <p className="text-xs text-gray-400">
              Tổng số {filteredSubmissions.length} lượt thi đua phù hợp với bộ lọc
            </p>
          </div>

          {/* Search inputs */}
          <div className="flex flex-wrap gap-2.5">
            {/* Search input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm họ tên, khoa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-hidden focus:border-[#0F8245] w-48"
              />
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
            </div>

            {/* Department dropdown filter */}
            <select
              value={selectedDeptFilter}
              onChange={(e) => setSelectedDeptFilter(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-[#0F8245]"
            >
              <option value="">Tất cả các Khoa</option>
              {filterDepts.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* SUBMISSIONS TABLE DISPLAY */}
        {loading ? (
          <div className="text-center py-10 text-xs text-gray-500">Đang đồng bộ cơ sở dữ liệu...</div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="text-center py-16 text-xs text-gray-500 space-y-1">
            <p className="font-bold">Không tìm thấy lượt nộp bài nào phù hợp.</p>
            <p>Hãy click "Giả lập" ở trên hoặc quét mã QR để gửi bài kiểm tra mới!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-500 uppercase font-bold tracking-wider">
                  <th className="py-3 px-4">Nhân viên</th>
                  <th className="py-3 px-4">Khoa/Phòng công tác</th>
                  <th className="py-3 px-4 text-center">Mã Đề</th>
                  <th className="py-3 px-4 text-center">Số câu đúng</th>
                  <th className="py-3 px-4 text-center">Điểm số</th>
                  <th className="py-3 px-4 text-right">Thời gian nộp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredSubmissions.map((sub) => {
                  const scoreColor = sub.score >= 8 
                    ? "bg-emerald-100 text-emerald-800" 
                    : sub.score >= 5 
                      ? "bg-blue-100 text-blue-800" 
                      : "bg-red-100 text-red-800";

                  return (
                    <tr key={sub.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 px-4 font-bold text-gray-800">{sub.employeeName}</td>
                      <td className="py-3 px-4 text-gray-600">{sub.department}</td>
                      <td className="py-3 px-4 text-center text-gray-500 font-semibold">{sub.quizId}</td>
                      <td className="py-3 px-4 text-center font-bold text-gray-600">{sub.correctAnswersCount} / 5</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full font-extrabold text-[11px] ${scoreColor}`}>
                          {sub.score}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-gray-400">
                        {new Date(sub.timestamp).toLocaleString("vi-VN", {
                          month: "numeric",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit"
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
