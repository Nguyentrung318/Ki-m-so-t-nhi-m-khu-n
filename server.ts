/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { QUIZZES as STATIC_QUIZZES, HOSPITAL_DEPARTMENTS, Submission, DepartmentStat } from "./src/types.js";

const PORT = 3000;
const SUBMISSIONS_FILE = path.join(process.cwd(), "submissions.json");
const QUIZZES_FILE = path.join(process.cwd(), "quizzes_store.json");

// Dynamic quizzes state
let currentQuizzes = [...STATIC_QUIZZES];

function loadQuizzes() {
  try {
    if (fs.existsSync(QUIZZES_FILE)) {
      const rawData = fs.readFileSync(QUIZZES_FILE, "utf-8");
      currentQuizzes = JSON.parse(rawData);
    } else {
      currentQuizzes = [...STATIC_QUIZZES];
      saveQuizzes();
    }
  } catch (error) {
    console.error("Error reading quizzes file, initializing with defaults:", error);
    currentQuizzes = [...STATIC_QUIZZES];
  }
}

function saveQuizzes() {
  try {
    fs.writeFileSync(QUIZZES_FILE, JSON.stringify(currentQuizzes, null, 2), "utf-8");
  } catch (error) {
    console.error("Error saving quizzes to file:", error);
  }
}

// Initial quizzes load
loadQuizzes();

const DEPARTMENTS_FILE = path.join(process.cwd(), "departments_store.json");
let currentDepartments: string[] = [...HOSPITAL_DEPARTMENTS];

function loadDepartments() {
  try {
    if (fs.existsSync(DEPARTMENTS_FILE)) {
      const rawData = fs.readFileSync(DEPARTMENTS_FILE, "utf-8");
      currentDepartments = JSON.parse(rawData);
    } else {
      currentDepartments = [...HOSPITAL_DEPARTMENTS];
      saveDepartments();
    }
  } catch (error) {
    console.error("Error reading departments file, initializing with defaults:", error);
    currentDepartments = [...HOSPITAL_DEPARTMENTS];
  }
}

function saveDepartments() {
  try {
    fs.writeFileSync(DEPARTMENTS_FILE, JSON.stringify(currentDepartments, null, 2), "utf-8");
  } catch (error) {
    console.error("Error saving departments to file:", error);
  }
}

// Initial departments load
loadDepartments();

// Define a type for our state store
interface ServerState {
  activeQuizId: string;
  submissions: Submission[];
}

// Generate some initial mock submissions to make the app look lively
const INITIAL_MOCK_SUBMISSIONS: Submission[] = [
  // Khoa Kiểm soát nhiễm khuẩn (Excellent performance)
  {
    id: "mock1",
    employeeName: "Nguyễn Thị Hồng Hạnh",
    department: "Khoa Kiểm soát nhiễm khuẩn",
    quizId: "week1",
    score: 10,
    correctAnswersCount: 5,
    answers: { 1: "B", 2: "B", 3: "B", 4: "B", 5: "B" },
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    id: "mock2",
    employeeName: "Trần Văn Kiểm",
    department: "Khoa Kiểm soát nhiễm khuẩn",
    quizId: "week1",
    score: 10,
    correctAnswersCount: 5,
    answers: { 1: "B", 2: "B", 3: "B", 4: "B", 5: "B" },
    timestamp: new Date(Date.now() - 3600000 * 20).toISOString()
  },
  // Khoa Truyền nhiễm (Very active)
  {
    id: "mock3",
    employeeName: "Nguyễn Thị Thêm",
    department: "Khoa Truyền nhiễm",
    quizId: "week1",
    score: 8,
    correctAnswersCount: 4,
    answers: { 1: "B", 2: "B", 3: "B", 4: "A", 5: "B" }, // Wrong on cost saving
    timestamp: new Date(Date.now() - 3600000 * 18).toISOString()
  },
  {
    id: "mock4",
    employeeName: "Lê Thị Lan",
    department: "Khoa Truyền nhiễm",
    quizId: "week1",
    score: 10,
    correctAnswersCount: 5,
    answers: { 1: "B", 2: "B", 3: "B", 4: "B", 5: "B" },
    timestamp: new Date(Date.now() - 3600000 * 15).toISOString()
  },
  {
    id: "mock5",
    employeeName: "Phạm Hồng Phúc",
    department: "Khoa Truyền nhiễm",
    quizId: "week1",
    score: 8,
    correctAnswersCount: 4,
    answers: { 1: "B", 2: "B", 3: "B", 4: "B", 5: "A" }, // Wrong on what to do if trash mixed
    timestamp: new Date(Date.now() - 3600000 * 12).toISOString()
  },
  // Khoa Sản (Very active, Good score)
  {
    id: "mock6",
    employeeName: "Hoàng Thị Mai",
    department: "Khoa Sản",
    quizId: "week1",
    score: 10,
    correctAnswersCount: 5,
    answers: { 1: "B", 2: "B", 3: "B", 4: "B", 5: "B" },
    timestamp: new Date(Date.now() - 3600000 * 8).toISOString()
  },
  {
    id: "mock7",
    employeeName: "Bùi Thị Tuyết",
    department: "Khoa Sản",
    quizId: "week1",
    score: 6,
    correctAnswersCount: 3,
    answers: { 1: "A", 2: "B", 3: "B", 4: "A", 5: "B" },
    timestamp: new Date(Date.now() - 3600000 * 6).toISOString()
  },
  // Khoa Ngoại tổng hợp
  {
    id: "mock8",
    employeeName: "Nguyễn Văn Đức",
    department: "Khoa Ngoại tổng hợp",
    quizId: "week1",
    score: 8,
    correctAnswersCount: 4,
    answers: { 1: "B", 2: "B", 3: "B", 4: "B", 5: "A" },
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString()
  },
  // Khoa Nhi
  {
    id: "mock9",
    employeeName: "Đỗ Hồng Ngọc",
    department: "Khoa Nhi",
    quizId: "week1",
    score: 10,
    correctAnswersCount: 5,
    answers: { 1: "B", 2: "B", 3: "B", 4: "B", 5: "B" },
    timestamp: new Date(Date.now() - 3600000 * 3).toISOString()
  },
  // Khoa Hồi sức cấp cứu
  {
    id: "mock10",
    employeeName: "Vũ Minh Trí",
    department: "Khoa Hồi sức cấp cứu - Chống độc",
    quizId: "week1",
    score: 8,
    correctAnswersCount: 4,
    answers: { 1: "C", 2: "B", 3: "B", 4: "B", 5: "B" }, // Wrong on glass vials
    timestamp: new Date(Date.now() - 3600000 * 1).toISOString()
  }
];

// Load or initialize state
let state: ServerState = {
  activeQuizId: "week1",
  submissions: []
};

function loadState() {
  try {
    if (fs.existsSync(SUBMISSIONS_FILE)) {
      const rawData = fs.readFileSync(SUBMISSIONS_FILE, "utf-8");
      state = JSON.parse(rawData);
    } else {
      state = {
        activeQuizId: "week1",
        submissions: [...INITIAL_MOCK_SUBMISSIONS]
      };
      saveState();
    }
  } catch (error) {
    console.error("Error reading submissions file, initializing with defaults:", error);
    state = {
      activeQuizId: "week1",
      submissions: [...INITIAL_MOCK_SUBMISSIONS]
    };
  }
}

function saveState() {
  try {
    fs.writeFileSync(SUBMISSIONS_FILE, JSON.stringify(state, null, 2), "utf-8");
  } catch (error) {
    console.error("Error saving state to file:", error);
  }
}

// Initial state load
loadState();

async function startServer() {
  const app = express();
  app.use(express.json());

  // --- API ROUTES ---

  // 1. Get hospital departments
  app.get("/api/departments", (req, res) => {
    res.json(currentDepartments);
  });

  // 1b. Add a new department
  app.post("/api/departments", (req, res) => {
    const { name } = req.body;
    if (!name || !name.trim()) {
      res.status(400).json({ error: "Tên khoa/phòng không được để trống." });
      return;
    }
    const cleanName = name.trim();
    if (currentDepartments.some(dept => dept.toLowerCase() === cleanName.toLowerCase())) {
      res.status(400).json({ error: "Khoa/Phòng này đã tồn tại trên hệ thống." });
      return;
    }
    currentDepartments.push(cleanName);
    saveDepartments();
    res.json({ success: true, departments: currentDepartments });
  });

  // 1c. Edit a department name
  app.put("/api/departments", (req, res) => {
    const { oldName, newName } = req.body;
    if (!oldName || !newName || !newName.trim()) {
      res.status(400).json({ error: "Tên khoa/phòng không hợp lệ." });
      return;
    }
    const cleanOldName = oldName.trim();
    const cleanNewName = newName.trim();

    const index = currentDepartments.findIndex(dept => dept === cleanOldName);
    if (index === -1) {
      res.status(400).json({ error: "Khoa/Phòng cần sửa không tồn tại." });
      return;
    }

    if (cleanOldName.toLowerCase() !== cleanNewName.toLowerCase() && 
        currentDepartments.some(dept => dept.toLowerCase() === cleanNewName.toLowerCase())) {
      res.status(400).json({ error: "Tên khoa/phòng mới đã tồn tại trên hệ thống." });
      return;
    }

    // Update the department name
    currentDepartments[index] = cleanNewName;
    saveDepartments();

    // Update submissions that belonged to old name
    let updatedCount = 0;
    state.submissions.forEach(sub => {
      if (sub.department === cleanOldName) {
        sub.department = cleanNewName;
        updatedCount++;
      }
    });

    if (updatedCount > 0) {
      saveState();
    }

    res.json({ success: true, departments: currentDepartments });
  });

  // 1d. Delete a department
  app.delete("/api/departments", (req, res) => {
    const { name } = req.body;
    if (!name) {
      res.status(400).json({ error: "Tên khoa/phòng không hợp lệ." });
      return;
    }
    const cleanName = name.trim();
    const index = currentDepartments.findIndex(dept => dept === cleanName);
    if (index === -1) {
      res.status(400).json({ error: "Khoa/Phòng cần xóa không tồn tại." });
      return;
    }

    // Remove the department
    currentDepartments.splice(index, 1);
    saveDepartments();

    res.json({ success: true, departments: currentDepartments });
  });

  // 2. Get active quiz
  app.get("/api/active-quiz", (req, res) => {
    const quiz = currentQuizzes.find((q) => q.id === state.activeQuizId) || currentQuizzes[0];
    res.json(quiz);
  });

  // 3. Set active quiz (Admin)
  app.post("/api/active-quiz", (req, res) => {
    const { quizId } = req.body;
    if (!quizId || !currentQuizzes.some((q) => q.id === quizId)) {
      res.status(400).json({ error: "Mã đề thi không hợp lệ." });
      return;
    }
    state.activeQuizId = quizId;
    saveState();
    res.json({ success: true, activeQuizId: state.activeQuizId });
  });

  // 4. Get all quizzes list (metadata & full)
  app.get("/api/quizzes", (req, res) => {
    res.json(currentQuizzes);
  });

  // 4b. Create/Upload new quiz (Nạp đề)
  app.post("/api/quizzes", (req, res) => {
    const { title, week, objective, questions } = req.body;

    if (!title?.trim()) {
      res.status(400).json({ error: "Tiêu đề đề thi không được để trống." });
      return;
    }

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      res.status(400).json({ error: "Đề thi phải chứa ít nhất 1 câu hỏi." });
      return;
    }

    // Validate each question
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question?.trim()) {
        res.status(400).json({ error: `Câu hỏi số ${i + 1} không được để trống.` });
        return;
      }
      if (!q.options || !Array.isArray(q.options) || q.options.length < 2) {
        res.status(400).json({ error: `Câu hỏi số ${i + 1} phải có ít nhất 2 đáp án.` });
        return;
      }
      if (!q.correctAnswer || !["A", "B", "C", "D"].includes(q.correctAnswer.toUpperCase())) {
        res.status(400).json({ error: `Câu hỏi số ${i + 1} phải chọn đáp án đúng là A, B, C hoặc D.` });
        return;
      }
    }

    const newQuizId = "quiz_" + Math.random().toString(36).substring(2, 11);
    const newQuiz = {
      id: newQuizId,
      title: title.trim(),
      week: Number(week) || (currentQuizzes.length + 1),
      objective: objective?.trim() || "",
      questions: questions.map((q, idx) => ({
        id: idx + 1,
        question: q.question.trim(),
        options: q.options.map((opt: string) => opt.trim()),
        correctAnswer: q.correctAnswer.toUpperCase(),
        explanation: q.explanation?.trim() || "Không có giải thích chi tiết."
      }))
    };

    currentQuizzes.push(newQuiz);
    saveQuizzes();

    res.json({ success: true, quiz: newQuiz });
  });

  // 5. Submit quiz answers
  app.post("/api/submit", (req, res) => {
    const { employeeName, department, quizId, answers } = req.body;

    // Validate request
    if (!employeeName?.trim()) {
      res.status(400).json({ error: "Vui lòng nhập họ và tên." });
      return;
    }
    if (!department || !currentDepartments.includes(department)) {
      res.status(400).json({ error: "Khoa/Phòng chọn không hợp lệ." });
      return;
    }
    if (!quizId || !currentQuizzes.some((q) => q.id === quizId)) {
      res.status(400).json({ error: "Đề thi không tồn tại." });
      return;
    }

    const quiz = currentQuizzes.find((q) => q.id === quizId)!;
    
    // Calculate score
    let correctAnswersCount = 0;
    const submissionAnswers: Record<number, string> = {};
    const corrections: Array<{
      id: number;
      isCorrect: boolean;
      userAnswer: string;
      correctAnswer: string;
      explanation: string;
    }> = [];

    quiz.questions.forEach((q) => {
      const userAnswer = (answers && answers[q.id]) || "";
      const isCorrect = userAnswer.toUpperCase() === q.correctAnswer.toUpperCase();
      
      if (isCorrect) {
        correctAnswersCount++;
      }
      
      submissionAnswers[q.id] = userAnswer;
      corrections.push({
        id: q.id,
        isCorrect,
        userAnswer,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation
      });
    });

    const score = (correctAnswersCount / quiz.questions.length) * 10;

    const newSubmission: Submission = {
      id: "sub_" + Math.random().toString(36).substring(2, 11),
      employeeName: employeeName.trim(),
      department,
      quizId,
      score,
      correctAnswersCount,
      answers: submissionAnswers,
      timestamp: new Date().toISOString()
    };

    state.submissions.unshift(newSubmission); // Add to beginning of list
    saveState();

    res.json({
      success: true,
      submission: newSubmission,
      corrections
    });
  });

  // 6. Get real-time stats and emulation rankings
  app.get("/api/stats", (req, res) => {
    const statsMap: Record<string, { submissionCount: number; totalScore: number }> = {};
    
    // Initialize stats for all departments
    currentDepartments.forEach((dept) => {
      statsMap[dept] = { submissionCount: 0, totalScore: 0 };
    });

    // Count submissions and scores for the currently active quiz
    const activeSubmissions = state.submissions.filter(
      (sub) => sub.quizId === state.activeQuizId
    );

    activeSubmissions.forEach((sub) => {
      if (statsMap[sub.department]) {
        statsMap[sub.department].submissionCount++;
        statsMap[sub.department].totalScore += sub.score;
      }
    });

    // Create DepartmentStat array and compute final emulation scores
    const stats: DepartmentStat[] = currentDepartments.map((dept) => {
      const { submissionCount, totalScore } = statsMap[dept];
      const averageScore = submissionCount > 0 ? parseFloat((totalScore / submissionCount).toFixed(2)) : 0;
      
      // Participation bonus points: 1.5 points per submission, max 20 points
      const participationBonus = parseFloat(Math.min(submissionCount * 1.5, 20).toFixed(2));
      
      // Total emulation score = (Average Score * 10) + Participation Bonus. Maximum possible is 120 points.
      const totalEmulationScore = parseFloat(Math.min((averageScore * 10) + participationBonus, 120).toFixed(2));

      return {
        department: dept,
        submissionCount,
        averageScore,
        participationBonus,
        totalEmulationScore,
        rank: 0 // Will be set after sorting
      };
    });

    // Sort by emulation score descending. If tied, sort by average score, then submission count
    stats.sort((a, b) => {
      if (b.totalEmulationScore !== a.totalEmulationScore) {
        return b.totalEmulationScore - a.totalEmulationScore;
      }
      if (b.averageScore !== a.averageScore) {
        return b.averageScore - a.averageScore;
      }
      return b.submissionCount - a.submissionCount;
    });

    // Assign ranks (handling ties elegantly)
    let currentRank = 1;
    for (let i = 0; i < stats.length; i++) {
      if (i > 0 && stats[i].totalEmulationScore < stats[i - 1].totalEmulationScore) {
        currentRank = i + 1;
      }
      stats[i].rank = currentRank;
    }

    // Also collect overall summary metrics
    const totalParticipation = activeSubmissions.length;
    const avgHospitalScore = totalParticipation > 0 
      ? parseFloat((activeSubmissions.reduce((sum, s) => sum + s.score, 0) / totalParticipation).toFixed(2))
      : 0;
    
    // Estimate cost saved based on reduction of 5kg/day of infection waste
    // If average compliance is high, we simulate proportional savings. Let's make it real-time based on actual stats.
    const averageScorePercent = avgHospitalScore / 10;
    // Maximum possible savings of 45,625,000 VND / year (approx 125,000 VND / day)
    const dailySavingRate = 125000;
    const totalSavingsEstimate = Math.round(totalParticipation * dailySavingRate * averageScorePercent);

    // Latest submissions feed (limit to 10)
    const latestSubmissions = state.submissions.slice(0, 10).map((sub) => ({
      id: sub.id,
      employeeName: sub.employeeName,
      department: sub.department,
      score: sub.score,
      timestamp: sub.timestamp,
      quizTitle: currentQuizzes.find((q) => q.id === sub.quizId)?.title || "Bài thi"
    }));

    res.json({
      activeQuizId: state.activeQuizId,
      departments: stats,
      totalParticipation,
      avgHospitalScore,
      totalSavingsEstimate,
      latestSubmissions
    });
  });

  // 7. Get raw submissions (Admin view)
  app.get("/api/submissions", (req, res) => {
    res.json(state.submissions);
  });

  // 8. Reset application data
  app.post("/api/reset", (req, res) => {
    state.activeQuizId = "week1";
    state.submissions = [];
    currentQuizzes = [...STATIC_QUIZZES];
    currentDepartments = [...HOSPITAL_DEPARTMENTS];
    saveQuizzes();
    saveDepartments();
    saveState();
    res.json({ success: true, message: "Hệ thống đã được đặt lại toàn bộ dữ liệu thành công." });
  });

  // 9. Seed a random submission (to show instant ranking changes)
  app.post("/api/seed", (req, res) => {
    const randomDept = currentDepartments[Math.floor(Math.random() * currentDepartments.length)];
    
    // Pick a typical Vietnamese name
    const firstNames = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Phan", "Vũ", "Võ", "Đặng"];
    const middleNames = ["Thị", "Văn", "Đức", "Hoài", "Minh", "Hồng", "Tuấn", "Thanh", "Ngọc", "Thu"];
    const lastNames = ["Hạnh", "Thêm", "Mai", "Lan", "Phúc", "Tuyết", "Đức", "Ngọc", "Trí", "An", "Bình", "Dương", "Trang", "Vy", "Sơn", "Hải"];
    
    const randomName = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${middleNames[Math.floor(Math.random() * middleNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
    
    const quiz = currentQuizzes.find((q) => q.id === state.activeQuizId) || currentQuizzes[0];
    
    // Pick answers (leaning correct, 70% chance of correct answers)
    const answers: Record<number, string> = {};
    let correctCount = 0;
    
    quiz.questions.forEach((q) => {
      const isCorrect = Math.random() < 0.75;
      if (isCorrect) {
        answers[q.id] = q.correctAnswer;
        correctCount++;
      } else {
        // Pick a wrong option
        const wrongOptions = q.options
          .map((opt) => opt.substring(0, 1))
          .filter((letter) => letter !== q.correctAnswer);
        answers[q.id] = wrongOptions[Math.floor(Math.random() * wrongOptions.length)] || "A";
      }
    });

    const score = (correctCount / quiz.questions.length) * 10;

    const newSubmission: Submission = {
      id: "sub_" + Math.random().toString(36).substring(2, 11),
      employeeName: randomName,
      department: randomDept,
      quizId: quiz.id,
      score,
      correctAnswersCount: correctCount,
      answers,
      timestamp: new Date().toISOString()
    };

    state.submissions.unshift(newSubmission);
    saveState();

    res.json({
      success: true,
      submission: newSubmission
    });
  });

  // --- VITE DEV SERVER / PRODUCTION STATIC FILES ASSETS SERVING ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });
}

startServer();
