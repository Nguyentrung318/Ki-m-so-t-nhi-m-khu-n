/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Trophy, 
  Users, 
  TrendingUp, 
  DollarSign, 
  QrCode, 
  Sparkles, 
  Volume2, 
  RefreshCw,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Zap,
  Clock,
  HeartHandshake
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from "recharts";
import { motion, AnimatePresence } from "motion/react";
import { Quiz, DepartmentStat, HOSPITAL_DEPARTMENTS } from "../types";

interface EmulationDashboardProps {
  activeQuiz: Quiz | null;
  onNavigateToTest: () => void;
  onNavigateToAdmin: () => void;
}

interface StatsData {
  activeQuizId: string;
  departments: DepartmentStat[];
  totalParticipation: number;
  avgHospitalScore: number;
  totalSavingsEstimate: number;
  latestSubmissions: Array<{
    id: string;
    employeeName: string;
    department: string;
    score: number;
    timestamp: string;
    quizTitle: string;
  }>;
}

export default function EmulationDashboard({ 
  activeQuiz, 
  onNavigateToTest, 
  onNavigateToAdmin 
}: EmulationDashboardProps) {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isQrExpanded, setIsQrExpanded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const calculateLocalStats = (): StatsData => {
    // 1. Get departments
    let deptsList = HOSPITAL_DEPARTMENTS;
    try {
      const cachedDeptsStr = localStorage.getItem("hospital_quiz_departments");
      if (cachedDeptsStr) {
        const parsed = JSON.parse(cachedDeptsStr);
        if (Array.isArray(parsed) && parsed.length > 0) {
          deptsList = parsed;
        }
      }
    } catch (e) {
      console.error(e);
    }

    // 2. Get submissions
    let submissionsList: any[] = [];
    try {
      const cachedSubsStr = localStorage.getItem("hospital_quiz_submissions");
      if (cachedSubsStr) {
        submissionsList = JSON.parse(cachedSubsStr);
      }
    } catch (e) {
      console.error(e);
    }

    const currentQuizId = activeQuiz?.id || "week1";

    // 3. Filter for active quiz
    const activeSubmissions = submissionsList.filter(
      (sub) => sub.quizId === currentQuizId
    );

    // 4. Group by department
    const statsMap: Record<string, { submissionCount: number; totalScore: number }> = {};
    deptsList.forEach((dept) => {
      statsMap[dept] = { submissionCount: 0, totalScore: 0 };
    });

    activeSubmissions.forEach((sub) => {
      if (!statsMap[sub.department]) {
        statsMap[sub.department] = { submissionCount: 0, totalScore: 0 };
      }
      statsMap[sub.department].submissionCount++;
      statsMap[sub.department].totalScore += sub.score;
    });

    // 5. Create DepartmentStat array and compute emulation scores
    const deptStats: DepartmentStat[] = deptsList.map((dept) => {
      const { submissionCount, totalScore } = statsMap[dept] || { submissionCount: 0, totalScore: 0 };
      const averageScore = submissionCount > 0 ? parseFloat((totalScore / submissionCount).toFixed(2)) : 0;
      const participationBonus = parseFloat(Math.min(submissionCount * 1.5, 20).toFixed(2));
      const totalEmulationScore = parseFloat(Math.min((averageScore * 10) + participationBonus, 120).toFixed(2));

      return {
        department: dept,
        submissionCount,
        averageScore,
        participationBonus,
        totalEmulationScore,
        rank: 0
      };
    });

    // Sort by emulation score descending. If tied, sort by average score, then submission count
    deptStats.sort((a, b) => {
      if (b.totalEmulationScore !== a.totalEmulationScore) {
        return b.totalEmulationScore - a.totalEmulationScore;
      }
      if (b.averageScore !== a.averageScore) {
        return b.averageScore - a.averageScore;
      }
      return b.submissionCount - a.submissionCount;
    });

    // Assign ranks
    let currentRank = 1;
    for (let i = 0; i < deptStats.length; i++) {
      if (i > 0 && deptStats[i].totalEmulationScore < deptStats[i - 1].totalEmulationScore) {
        currentRank = i + 1;
      }
      deptStats[i].rank = currentRank;
    }

    // 6. Overall metrics
    const totalParticipation = activeSubmissions.length;
    const avgHospitalScore = totalParticipation > 0 
      ? parseFloat((activeSubmissions.reduce((sum, s) => sum + s.score, 0) / totalParticipation).toFixed(2))
      : 0;

    const averageScorePercent = avgHospitalScore / 10;
    const dailySavingRate = 125000;
    const totalSavingsEstimate = Math.round(totalParticipation * dailySavingRate * averageScorePercent);

    // 7. Latest submissions
    const latestSubmissions = submissionsList.slice(0, 10).map((sub) => {
      let qTitle = "Bài thi";
      if (sub.quizId === "week1") qTitle = "CHUYÊN GIA PHÂN LOẠI RÁC";
      else if (sub.quizId === "week2") qTitle = "CHIẾN BINH VỆ SĨ SỐ HÓA";
      else if (sub.quizId === "week3") qTitle = "PHẢN ỨNG NHANH SỰ CỐ";
      else if (sub.quizId === "week4") qTitle = "CÔNG DÂN SỐ Y TẾ";
      
      return {
        id: sub.id,
        employeeName: sub.employeeName,
        department: sub.department,
        score: sub.score,
        timestamp: sub.timestamp,
        quizTitle: qTitle
      };
    });

    return {
      activeQuizId: currentQuizId,
      departments: deptStats,
      totalParticipation,
      avgHospitalScore,
      totalSavingsEstimate,
      latestSubmissions
    };
  };

  // Fetch stats from server
  const fetchStats = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch("/api/stats");
      if (!res.ok) throw new Error("Không thể tải thông tin thi đua.");
      const data = await res.json();
      setStats(data);
      setError(null);
    } catch (err: any) {
      console.warn("API metrics fetch failed, using local calculations:", err);
      const localStats = calculateLocalStats();
      setStats(localStats);
      setError(null);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Poll statistics every 5 seconds for instant real-time ranking updates
  useEffect(() => {
    fetchStats();
    const interval = setInterval(() => {
      fetchStats(true);
    }, 5000);
    return () => clearInterval(interval);
  }, [activeQuiz]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    fetchStats();
  };

  if (loading && !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <RefreshCw className="w-12 h-12 text-[#0F8245] animate-spin" />
        <p className="text-gray-600 font-medium">Đang đồng bộ dữ liệu thi đua tức thì...</p>
      </div>
    );
  }

  const topDepartments = stats?.departments.slice(0, 3) || [];
  const allDepartments = stats?.departments || [];

  // Generate QR Code URL dynamically using global location or development URLs
  const testUrl = `${window.location.origin}?view=test&quiz=${activeQuiz?.id || 'week1'}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(testUrl)}`;

  // Formatter for Currency
  const formatVND = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND"
    }).format(value);
  };

  // Format relative time for Vietnam locale
  const getRelativeTimeText = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);

    if (diffSec < 10) return "Vài giây trước";
    if (diffSec < 60) return `${diffSec} giây trước`;
    if (diffMin < 60) return `${diffMin} phút trước`;
    if (diffHour < 24) return `${diffHour} giờ trước`;
    return date.toLocaleDateString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="space-y-6">
      {/* 2. TOP METRICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="metrics-grid">
        {/* Metric 1: Total submissions */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform duration-300"></div>
          <div className="space-y-1 relative z-10">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tổng lượt tham gia</p>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold text-gray-900">{stats?.totalParticipation || 0}</span>
              <span className="text-xs text-emerald-600 font-semibold flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" /> lượt
              </span>
            </div>
            <p className="text-xs text-gray-400">Đợt thi đua hiện tại</p>
          </div>
          <div className="w-12 h-12 bg-emerald-100 text-[#0F8245] rounded-xl flex items-center justify-center relative z-10">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 2: Average Score */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform duration-300"></div>
          <div className="space-y-1 relative z-10">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Điểm trung bình viện</p>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold text-[#0F8245]">{stats?.avgHospitalScore || 0}</span>
              <span className="text-xs text-gray-400 font-medium">/ 10 điểm</span>
            </div>
            <p className="text-xs text-gray-400">Độ chính xác toàn hệ thống</p>
          </div>
          <div className="w-12 h-12 bg-blue-100 text-[#00A3E0] rounded-xl flex items-center justify-center relative z-10">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 3: Total savings */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 rounded-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform duration-300"></div>
          <div className="space-y-1 relative z-10">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tiết kiệm ngân sách</p>
            <div className="flex items-baseline space-x-1">
              <span className="text-2xl font-extrabold text-orange-600">
                {stats?.totalSavingsEstimate ? formatVND(stats.totalSavingsEstimate) : "0 ₫"}
              </span>
            </div>
            <p className="text-xs text-gray-400">Nhờ giảm 5kg rác lây nhiễm/ngày</p>
          </div>
          <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center relative z-10">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 4: Lead Department */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 rounded-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform duration-300"></div>
          <div className="space-y-1 relative z-10">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Khoa Dẫn Đầu</p>
            <div className="text-lg font-extrabold text-gray-900 truncate max-w-[160px]">
              {topDepartments.length > 0 ? topDepartments[0].department : "Chưa cập nhật"}
            </div>
            <p className="text-xs text-gray-400">
              {topDepartments.length > 0 ? `${topDepartments[0].totalEmulationScore} điểm thi đua` : "Đang tính toán"}
            </p>
          </div>
          <div className="w-12 h-12 bg-red-100 text-[#E2231A] rounded-xl flex items-center justify-center relative z-10 animate-pulse">
            <Trophy className="w-6 h-6 fill-red-500" />
          </div>
        </div>
      </div>

      {/* 3. MAIN DASHBOARD CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="main-dashboard-grid">
        
        {/* LEFT COLUMN (8/12): INSTANT EMULATION LEADERBOARD */}
        <div className="lg:col-span-8 bg-white rounded-3xl shadow-sm border border-gray-100 p-6 space-y-4 flex flex-col">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div className="space-y-1">
              <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
                <Trophy className="w-6 h-6 text-yellow-500 fill-yellow-400" />
                Bảng Vàng Xếp Hạng Thi Đua Tức Thì giữa các Khoa
              </h2>
              <p className="text-xs text-gray-500">
                Tự động chấm điểm và cập nhật xếp hạng giây-sang-giây khi có nhân viên nộp bài
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={handleManualRefresh}
                className="p-2 text-gray-500 hover:text-[#0F8245] hover:bg-emerald-50 rounded-xl transition-all cursor-pointer"
                title="Đồng bộ ngay"
              >
                <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin text-[#0F8245]' : ''}`} />
              </button>
            </div>
          </div>

          {/* Sub-header showing active quiz info */}
          <div className="bg-emerald-50/50 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 border border-emerald-100/30">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="bg-[#0F8245] text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                  Đang diễn ra
                </span>
                <span className="text-xs text-gray-500 font-semibold">
                  Tuần {activeQuiz?.week || 1}
                </span>
              </div>
              <h3 className="font-extrabold text-[#0F8245] text-sm md:text-base">
                {activeQuiz?.title || "Đang tải bài thi tuần..."}
              </h3>
              <p className="text-xs text-gray-600 italic">
                Mục tiêu: {activeQuiz?.objective || "Chưa thiết lập"}
              </p>
            </div>

            <button
              onClick={onNavigateToTest}
              className="bg-[#0F8245] hover:bg-[#0c6c39] text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm shadow-emerald-700/10 cursor-pointer self-start md:self-center"
            >
              <Zap className="w-4 h-4 fill-white" />
              Làm bài thi ngay
            </button>
          </div>

          {/* LEADERBOARD LIST */}
          <div className="space-y-3 overflow-y-auto max-h-[600px] pr-1 scrollbar-thin">
            {allDepartments.map((dept, index) => {
              // Trophy or Icon based on rank
              const isTop3 = dept.rank <= 3 && dept.submissionCount > 0;
              let rankBadge = (
                <span className="w-7 h-7 rounded-full bg-gray-100 text-gray-600 font-bold text-xs flex items-center justify-center shadow-xs border border-gray-200">
                  {index + 1}
                </span>
              );

              if (isTop3) {
                if (dept.rank === 1) {
                  rankBadge = (
                    <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center shadow-md shadow-yellow-200 border border-yellow-300">
                      <Trophy className="w-5 h-5 text-yellow-600 fill-yellow-400" />
                    </div>
                  );
                } else if (dept.rank === 2) {
                  rankBadge = (
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shadow-md shadow-slate-200 border border-slate-300">
                      <Trophy className="w-5 h-5 text-slate-500 fill-slate-300" />
                    </div>
                  );
                } else if (dept.rank === 3) {
                  rankBadge = (
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shadow-md shadow-amber-200 border border-amber-300">
                      <Trophy className="w-5 h-5 text-amber-700 fill-amber-500" />
                    </div>
                  );
                }
              }

              // Highlight rows that have submissions
              const hasSubmissions = dept.submissionCount > 0;

              return (
                <div 
                  key={dept.department}
                  className={`p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 border transition-all ${
                    hasSubmissions 
                      ? index === 0 
                        ? 'bg-gradient-to-r from-yellow-50/40 to-emerald-50/20 border-yellow-100 shadow-xs' 
                        : 'bg-white border-gray-100 shadow-2xs hover:shadow-xs' 
                      : 'bg-gray-50/60 border-gray-200/50 opacity-70'
                  }`}
                  id={`leaderboard-row-${index}`}
                >
                  {/* Left: Rank, Dept Name, Participation bar */}
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="flex-shrink-0">{rankBadge}</div>
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`font-bold truncate text-sm sm:text-base ${hasSubmissions ? 'text-gray-900' : 'text-gray-500'}`}>
                          {dept.department}
                        </p>
                        {index === 0 && hasSubmissions && (
                          <span className="bg-yellow-100 text-yellow-800 text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                            <Sparkles className="w-2.5 h-2.5 fill-yellow-600" /> Top 1
                          </span>
                        )}
                        {dept.department === "Khoa Kiểm soát nhiễm khuẩn" && (
                          <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                            Tác giả
                          </span>
                        )}
                      </div>

                      {/* Visual progress bar of total Emulation Score */}
                      <div className="flex items-center space-x-2">
                        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${(dept.totalEmulationScore / 120) * 100}%` }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            className={`h-full rounded-full ${
                              index === 0 ? 'bg-[#0F8245]' : index < 3 ? 'bg-[#00A3E0]' : 'bg-[#0F8245]/70'
                            }`}
                          />
                        </div>
                        <span className="text-[10px] text-gray-500 font-bold whitespace-nowrap">
                          {dept.totalEmulationScore} / 120đ
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Score Breakdown info */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 border-t sm:border-t-0 pt-2 sm:pt-0 border-gray-100">
                    {/* Submissions count */}
                    <div className="text-center">
                      <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Lượt tham gia</p>
                      <p className="font-extrabold text-sm text-gray-800 flex items-center justify-center gap-1">
                        <Users className="w-3.5 h-3.5 text-gray-400" />
                        {dept.submissionCount}
                      </p>
                    </div>

                    {/* Average Test Score */}
                    <div className="text-center">
                      <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Điểm trung bình</p>
                      <p className={`font-extrabold text-sm text-center ${
                        dept.averageScore >= 8 ? 'text-emerald-600' : dept.averageScore >= 5 ? 'text-blue-600' : 'text-gray-500'
                      }`}>
                        {dept.averageScore}
                      </p>
                    </div>

                    {/* Bonus points */}
                    <div className="text-center">
                      <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Điểm cộng (+)</p>
                      <p className="font-extrabold text-sm text-[#00A3E0] text-center">
                        +{dept.participationBonus}
                      </p>
                    </div>

                    {/* Final Emulation Score Badge */}
                    <div className="bg-[#0F8245]/10 text-[#0F8245] px-3 py-1.5 rounded-xl text-center min-w-[70px]">
                      <p className="text-[8px] uppercase font-bold tracking-wider opacity-80">Tổng Điểm</p>
                      <p className="font-black text-sm">{dept.totalEmulationScore}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN (4/12): QR DISPLAY & LIVE SUBMISSION FEED */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* A. QR CODE SCANNING UNIT */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center text-center space-y-4">
            <div className="space-y-1 w-full border-b border-gray-100 pb-3">
              <h3 className="font-extrabold text-gray-900 text-base flex items-center justify-center gap-1.5">
                <QrCode className="w-5 h-5 text-[#0F8245]" />
                Quét Mã QR Trả Lời Câu Hỏi
              </h3>
              <p className="text-xs text-gray-500">
                Nhân viên dùng điện thoại quét mã dưới đây để vào thi đua ngay tức thì
              </p>
            </div>

            {/* QR display box */}
            <div 
              onClick={() => setIsQrExpanded(true)}
              className="bg-gray-50 p-4 rounded-2xl border-2 border-dashed border-gray-200 hover:border-[#0F8245]/40 transition-all cursor-zoom-in relative group"
            >
              <img 
                src={qrCodeUrl} 
                alt="QR Code for testing" 
                className="w-48 h-48 mix-blend-multiply group-hover:scale-102 transition-transform duration-200"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-[#0F8245]/5 opacity-0 group-hover:opacity-100 rounded-2xl flex items-center justify-center transition-opacity">
                <span className="bg-white/95 text-[#0F8245] text-xs font-extrabold px-3 py-1.5 rounded-xl shadow-md flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5" /> Phóng To QR
                </span>
              </div>
            </div>

            <div className="text-xs text-gray-600 font-medium">
              Cách chơi: 1s nhận diện rác thải ➡️ 3p trả lời ➡️ Tự động tính điểm thi đua!
            </div>

            {/* Quick Testing buttons */}
            <div className="w-full pt-1 space-y-2">
              <button
                onClick={onNavigateToTest}
                className="w-full bg-[#00A3E0]/10 hover:bg-[#00A3E0]/20 text-[#00A3E0] font-extrabold text-xs py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Zap className="w-4 h-4 fill-[#00A3E0]" />
                👉 Click làm bài test trực tiếp
              </button>
              
              <div className="text-[10px] text-gray-400 text-center italic">
                Sáng kiến của Khoa Kiểm soát nhiễm khuẩn - TTYT Bảo Thắng
              </div>
            </div>
          </div>

          {/* B. REVENUE CHART */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 space-y-4">
            <h3 className="font-extrabold text-gray-900 text-base flex items-center gap-1.5">
              <TrendingUp className="w-5 h-5 text-[#00A3E0]" />
              Top 5 Khoa Có Điểm Thi Đua Cao Nhất
            </h3>
            
            {topDepartments.length > 0 ? (
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topDepartments}>
                    <XAxis 
                      dataKey="department" 
                      tick={{ fill: "#6b7280", fontSize: 9 }} 
                      tickFormatter={(value) => value.substring(5, 15) + ".."}
                    />
                    <YAxis domain={[0, 120]} tick={{ fill: "#6b7280", fontSize: 10 }} />
                    <Tooltip 
                      contentStyle={{ background: "#1f2937", borderRadius: "12px", border: "none", color: "#fff" }}
                      itemStyle={{ color: "#fff", fontSize: "12px" }}
                      labelStyle={{ fontWeight: "bold", fontSize: "12px", color: "#10b981" }}
                      formatter={(value: any) => [`${value} Điểm thi đua`, "Tổng điểm"]}
                    />
                    <Bar dataKey="totalEmulationScore" radius={[6, 6, 0, 0]}>
                      {topDepartments.map((entry, index) => {
                        const colors = ["#0F8245", "#00A3E0", "#E2231A", "#f59e0b", "#8b5cf6"];
                        return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center text-gray-500 text-xs py-10">Chưa có dữ liệu thi đua</div>
            )}
          </div>

          {/* C. REAL-TIME SUBMISSION STREAM (LIVE BULLETIN FEED) */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 space-y-4 flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-extrabold text-gray-900 text-sm md:text-base flex items-center gap-1.5">
                <Clock className="w-5 h-5 text-[#E2231A] animate-pulse" />
                Dòng Hoạt Động Nộp Bài (Live Feed)
              </h3>
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" title="Trực tuyến" />
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
              <AnimatePresence initial={false}>
                {stats?.latestSubmissions && stats.latestSubmissions.length > 0 ? (
                  stats.latestSubmissions.map((sub, i) => {
                    const scoreColor = sub.score >= 8 
                      ? "bg-emerald-100 text-emerald-800 border-emerald-200" 
                      : sub.score >= 5 
                        ? "bg-blue-100 text-blue-800 border-blue-200" 
                        : "bg-gray-100 text-gray-700 border-gray-200";

                    return (
                      <motion.div 
                        key={sub.id}
                        initial={{ opacity: 0, x: 20, y: -10 }}
                        animate={{ opacity: 1, x: 0, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                        className="p-3 bg-gray-50 hover:bg-emerald-50/20 border border-gray-100 rounded-2xl flex items-start gap-2.5 transition-all text-xs"
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          <div className="w-8 h-8 rounded-full bg-[#0F8245]/10 text-[#0F8245] font-extrabold flex items-center justify-center">
                            {sub.employeeName.charAt(0)}
                          </div>
                        </div>

                        <div className="flex-1 min-w-0 space-y-0.5">
                          <p className="font-bold text-gray-800 truncate">
                            {sub.employeeName}
                          </p>
                          <p className="text-gray-500 text-[11px] font-medium truncate">
                            🏢 {sub.department}
                          </p>
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[10px] text-gray-400 font-semibold">
                              ⏱️ {getRelativeTimeText(sub.timestamp)}
                            </span>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${scoreColor}`}>
                              {sub.score}/10 Điểm
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="text-center text-gray-500 text-xs py-8">Chưa có lượt nộp bài nào</div>
                )}
              </AnimatePresence>
            </div>
          </div>

        </div>

      </div>

      {/* 4. EXPANDED QR MODAL */}
      <AnimatePresence>
        {isQrExpanded && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-md"
            id="qr-expanded-modal"
          >
            <motion.div 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full text-center space-y-6 relative border-4 border-[#0F8245] shadow-2xl"
            >
              <div className="space-y-2">
                <div className="flex justify-center">
                  <div className="w-14 h-14 bg-emerald-100 text-[#0F8245] rounded-full flex items-center justify-center">
                    <HeartHandshake className="w-8 h-8" />
                  </div>
                </div>
                <h3 className="text-xl font-black text-gray-900 leading-tight">
                  QUÉT QR ĐỂ TRẢ LỜI CÂU HỎI
                </h3>
                <p className="text-sm font-semibold text-[#0F8245] uppercase tracking-wider">
                  {activeQuiz?.title}
                </p>
                <p className="text-xs text-gray-500 font-medium">
                  Hội đồng kiểm soát nhiễm khuẩn • TTYT Bảo Thắng
                </p>
              </div>

              {/* Huge QR representation */}
              <div className="flex justify-center bg-gray-50 p-6 rounded-2xl border-2 border-dashed border-gray-200">
                <img 
                  src={qrCodeUrl} 
                  alt="QR Code Expanded" 
                  className="w-64 h-64 mix-blend-multiply"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="space-y-1">
                <p className="text-xs font-bold text-gray-700">
                  Hệ thống tự động xếp hạng & tính điểm tức thì giữa các khoa phòng!
                </p>
                <p className="text-[11px] text-gray-400 italic">
                  Quét bằng Zalo, Camera điện thoại hoặc Trình duyệt di động
                </p>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  onClick={() => setIsQrExpanded(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition-all cursor-pointer text-xs"
                >
                  Đóng lại
                </button>
                <button
                  onClick={() => {
                    setIsQrExpanded(false);
                    onNavigateToTest();
                  }}
                  className="flex-1 bg-[#0F8245] hover:bg-[#0c6c39] text-white font-bold py-3 rounded-xl transition-all shadow-md shadow-emerald-700/20 cursor-pointer text-xs flex items-center justify-center gap-1"
                >
                  <Zap className="w-4 h-4 fill-white" /> Làm trực tiếp
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
