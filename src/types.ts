/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[]; // e.g. ["A. ...", "B. ..."]
  correctAnswer: string; // e.g. "B"
  explanation: string;
}

export interface Quiz {
  id: string;
  title: string;
  week: number;
  objective: string;
  questions: QuizQuestion[];
}

export interface Submission {
  id: string;
  employeeName: string;
  department: string;
  quizId: string;
  score: number; // Max 10
  correctAnswersCount: number; // Max 5
  answers: Record<number, string>; // e.g. {1: "B", 2: "A"}
  timestamp: string;
}

export interface DepartmentStat {
  department: string;
  submissionCount: number;
  averageScore: number;
  participationBonus: number;
  totalEmulationScore: number;
  rank: number;
}

export const HOSPITAL_DEPARTMENTS = [
  "Khoa Kiểm soát nhiễm khuẩn",
  "Khoa Truyền nhiễm",
  "Khoa Sản",
  "Khoa Ngoại tổng hợp",
  "Khoa Khám bệnh",
  "Khoa Hồi sức cấp cứu - Chống độc",
  "Khoa Nội tổng hợp",
  "Khoa Nhi",
  "Khoa Y học cổ truyền & Phục hồi chức năng",
  "Khoa Dược - Trang thiết bị & Vật tư y tế",
  "Khoa Xét nghiệm & Chẩn đoán hình ảnh",
  "Khoa An toàn thực phẩm & Y tế công cộng",
  "Phòng Kế hoạch - Nghiệp vụ",
  "Phòng Điều dưỡng",
  "Phòng Tổ chức - Hành chính",
  "Phòng Tài chính - Kế toán"
];

export const QUIZZES: Quiz[] = [
  {
    id: "week1",
    title: "ĐỀ 01: CHUYÊN GIA PHÂN LOẠI RÁC (Tuần 1)",
    week: 1,
    objective: "Ghi nhớ mã màu và vị trí bỏ rác dựa trên hình ảnh 'Bản địa hóa'.",
    questions: [
      {
        id: 1,
        question: "Vỏ lọ thuốc thủy tinh sau khi dùng hết (không thuộc nhóm nguy hại) được bỏ vào đâu?",
        options: [
          "A. Thùng rác vàng (Lây nhiễm)",
          "B. Thùng rác trắng (Tái chế)",
          "C. Thùng rác xanh (Sinh hoạt)"
        ],
        correctAnswer: "B",
        explanation: "Theo Thông tư 20/2021/TT-BYT, vỏ lọ thuốc thủy tinh không chứa các thành phần nguy hại thuộc danh mục rác thải y tế tái chế thông thường, được phân loại vào thùng rác màu trắng."
      },
      {
        id: 2,
        question: "Theo sáng kiến, tại sao chúng ta dán ảnh 'Cuống rốn, nhau thai' ngay trên nắp thùng rác Khoa Sản?",
        options: [
          "A. Để trang trí khoa phòng",
          "B. Giúp nhân viên nhận diện đúng rác lây nhiễm cao trong 1 giây mà không cần đọc chữ",
          "C. Để quảng cáo cho khoa"
        ],
        correctAnswer: "B",
        explanation: "Sáng kiến 'Bản địa hóa' sử dụng hình ảnh thực tế giúp nhân viên y tế nhận diện và phân loại tức thì trong 1 giây, tránh sai sót khi bận rộn."
      },
      {
        id: 3,
        question: "Chất thải lây nhiễm sắc nhọn (kim tiêm, mảnh thủy tinh vỡ) phải đựng trong vật dụng gì?",
        options: [
          "A. Túi nilon vàng",
          "B. Thùng hoặc hộp kháng thủng màu vàng",
          "C. Thùng màu đen"
        ],
        correctAnswer: "B",
        explanation: "Chất thải sắc nhọn có nguy cơ đâm thấu rất cao, bắt buộc phải lưu giữ trong các hộp hoặc thùng kháng thủng, màu vàng để đảm bảo an toàn thu gom."
      },
      {
        id: 4,
        question: "Việc phân loại đúng rác thải tại nguồn giúp đơn vị tiết kiệm bao nhiêu chi phí mỗi năm?",
        options: [
          "A. Khoảng 10 triệu đồng",
          "B. Hơn 45 triệu đồng"
        ],
        correctAnswer: "B",
        explanation: "Theo số liệu thực tế trong báo cáo sáng kiến, việc phân loại đúng rác thải y tế tại nguồn giúp giảm 5kg chất thải lây nhiễm/ngày, tiết kiệm trực tiếp hơn 45 triệu đồng/năm cho ngân sách nhà nước (cụ thể là 45.625.000 VNĐ/năm)."
      },
      {
        id: 5,
        question: "Bạn phát hiện túi rác vàng bị bỏ lẫn vỏ hộp sữa (rác sinh hoạt), bạn sẽ làm gì?",
        options: [
          "A. Lờ đi vì không phải rác của mình",
          "B. Nhắc nhở đồng nghiệp hoặc tự tay phân loại lại ngay tại chỗ"
        ],
        correctAnswer: "B",
        explanation: "Đây là tinh thần 'Đại sứ KSNK' - tự giác giám sát, nhắc nhở đồng nghiệp hoặc trực tiếp phân loại lại tại nguồn để tránh làm tăng khối lượng chất thải lây nhiễm lãng phí."
      }
    ]
  },
  {
    id: "week2",
    title: "ĐỀ 02: CHIẾN BINH VỆ SINH TAY (Tuần 2)",
    week: 2,
    objective: "Củng cố quy trình kỹ thuật rửa tay thường quy và ngoại khoa.",
    questions: [
      {
        id: 1,
        question: "Thời gian chà sát tay tối thiểu cho quy trình rửa tay thường quy là bao lâu?",
        options: [
          "A. 15-20 giây",
          "B. 30-60 giây"
        ],
        correctAnswer: "B",
        explanation: "Thời gian chà sát tay tối thiểu cho toàn bộ quy trình rửa tay bằng xà phòng là 30-60 giây để đảm bảo diệt sạch vi khuẩn bám trên da."
      },
      {
        id: 2,
        question: "Bước 3 của quy trình rửa tay 6 bước là gì?",
        options: [
          "A. Chà lòng bàn tay này lên mu bàn tay kia",
          "B. Chà 2 lòng bàn tay vào nhau, miết mạnh các kẽ ngón tay",
          "C. Xoay ngón tay cái"
        ],
        correctAnswer: "B",
        explanation: "Bước 3 trong quy trình rửa tay thường quy là chà 2 lòng bàn tay vào nhau, miết mạnh các kẽ ngón tay."
      },
      {
        id: 3,
        question: "Có bao nhiêu thời điểm vệ sinh tay theo quy định của Bộ Y tế?",
        options: [
          "A. 3 thời điểm",
          "B. 5 thời điểm",
          "C. 6 thời điểm"
        ],
        correctAnswer: "B",
        explanation: "Bộ Y tế quy định có 5 thời điểm vệ sinh tay: 1. Trước khi tiếp xúc người bệnh; 2. Trước khi làm thủ thuật vô khuẩn; 3. Sau khi tiếp xúc với dịch cơ thể; 4. Sau khi tiếp xúc người bệnh; 5. Sau khi tiếp xúc với vật dụng xung quanh người bệnh."
      },
      {
        id: 4,
        question: "Khi tay KHÔNG nhìn thấy vết bẩn hữu cơ rõ rệt, bạn nên ưu tiên phương pháp nào?",
        options: [
          "A. Rửa tay bằng xà phòng dưới vòi nước",
          "B. Sát khuẩn tay nhanh bằng dung dịch chứa cồn"
        ],
        correctAnswer: "B",
        explanation: "Nếu tay không bẩn rõ rệt bằng mắt thường, sát khuẩn tay nhanh bằng dung dịch cồn là ưu tiên hàng đầu vì vừa nhanh gọn, vừa sát khuẩn hiệu quả và bảo vệ da tay tốt hơn."
      },
      {
        id: 5,
        question: "Trong quy trình vệ sinh tay ngoại khoa, bàn tay luôn phải hướng theo chiều nào?",
        options: [
          "A. Hướng xuống dưới đất",
          "B. Hướng lên trên"
        ],
        correctAnswer: "B",
        explanation: "Trong rửa tay ngoại khoa, bàn tay luôn phải hướng lên trên để nước và chất bẩn chảy từ phần sạch nhất (bàn tay) xuống phần ít sạch hơn (khuỷu tay)."
      }
    ]
  },
  {
    id: "week3",
    title: "ĐỀ 03: PHẢN ỨNG NHANH SỰ CỐ (Tuần 3)",
    week: 3,
    objective: "Xử lý các tình huống đổ tràn và phơi nhiễm nghề nghiệp.",
    questions: [
      {
        id: 1,
        question: "Khi bị đổ tràn thủy ngân (vỡ nhiệt kế), việc đầu tiên cần làm là gì?",
        options: [
          "A. Dùng chổi quét sạch ngay lập tức",
          "B. Sơ tán mọi người và đóng cửa sổ/tắt quạt để tránh tán phát hơi thủy ngân"
        ],
        correctAnswer: "B",
        explanation: "Sơ tán mọi người và tránh gió mạnh (tắt quạt/đóng cửa sổ tạm thời) để tránh thủy ngân phát tán hơi độc vào không khí, sau đó thu gom bằng dụng cụ chuyên dụng thích hợp."
      },
      {
        id: 2,
        question: "Sau khi xử lý sự cố đổ tràn thủy ngân, khu vực đó cần thông khí ít nhất bao lâu?",
        options: [
          "A. 2 giờ",
          "B. 24 giờ",
          "C. 48 giờ"
        ],
        correctAnswer: "C",
        explanation: "Khu vực có sự cố đổ tràn thủy ngân cần được mở hết cửa sổ, thông khí tích cực ít nhất 48 giờ sau khi thu dọn để đảm bảo nồng độ hơi thủy ngân trong không khí trở lại an toàn."
      },
      {
        id: 3,
        question: "Nếu bị máu của bệnh nhân bắn vào mắt, bạn cần xử lý thế nào?",
        options: [
          "A. Dụi mắt thật mạnh cho sạch",
          "B. Xả nước muối sinh lý 0.9% liên tục vào mắt trong ít nhất 15 phút"
        ],
        correctAnswer: "B",
        explanation: "Khi bị bắn máu vào mắt, tuyệt đối không dụi mắt (tránh trầy xước niêm mạc làm virus xâm nhập). Hãy xả nhẹ nước muối sinh lý 0.9% liên tục trong ít nhất 15 phút."
      },
      {
        id: 4,
        question: "Khi bị kim tiêm đâm vào tay (phơi nhiễm), bạn nên làm gì với vết thương?",
        options: [
          "A. Nặn bóp thật mạnh cho máu ra hết",
          "B. Để máu tự chảy dưới vòi nước sạch, không nặn bóp"
        ],
        correctAnswer: "B",
        explanation: "Không nặn bóp vết thương vì lực nặn có thể làm tổn thương sâu hơn, tạo lực hút ngược đưa máu nhiễm khuẩn vào sâu hơn. Hãy xả vết thương dưới vòi nước sạch để máu tự chảy tự nhiên."
      },
      {
        id: 5,
        question: "Mẫu thông báo tai nạn nghề nghiệp cần gửi cho bộ phận nào tại TTYT Bảo Thắng?",
        options: [
          "A. Phòng Kế hoạch tổng hợp",
          "B. Bộ phận Kiểm soát nhiễm khuẩn"
        ],
        correctAnswer: "B",
        explanation: "Tai nạn nghề nghiệp về phơi nhiễm y tế cần báo cáo ngay cho Bộ phận/Khoa Kiểm soát nhiễm khuẩn để được tư vấn xử trí chuyên môn và lập hồ sơ theo dõi kịp thời."
      }
    ]
  },
  {
    id: "week4",
    title: "ĐỀ 04: CÔNG DÂN SỐ Y TẾ (Tuần 4)",
    week: 4,
    objective: "Hiểu về giải pháp AppSheet và số hóa bảng kiểm.",
    questions: [
      {
        id: 1,
        question: "Việc số hóa bảng kiểm bằng AppSheet giúp rút ngắn thời gian báo cáo từ 3-5 ngày xuống còn bao lâu?",
        options: [
          "A. Dưới 1 tiếng",
          "B. Dưới 5 phút"
        ],
        correctAnswer: "B",
        explanation: "Ứng dụng công nghệ giúp việc gửi kết quả kiểm tra tự động hóa tức thì, báo cáo thống kê chỉ mất dưới 5 phút thay vì tổng hợp thủ công mất nhiều ngày."
      },
      {
        id: 2,
        question: "Ưu điểm vượt trội của 'Giám sát bằng hình ảnh' qua nhóm Zalo và AppSheet là gì?",
        options: [
          "A. Để cấp trên theo dõi nhân viên",
          "B. Minh bạch hóa bằng chứng, không gây tranh cãi giữa khoa lâm sàng và khoa KSNK"
        ],
        correctAnswer: "B",
        explanation: "Giám sát trực quan bằng hình ảnh giúp ghi nhận lỗi phân loại rác khách quan, minh bạch, có bằng chứng xác đáng giúp các khoa phòng nhận lỗi vui vẻ và sửa đổi nhanh chóng."
      },
      {
        id: 3,
        question: "Hệ thống AppSheet sẽ tự động gửi Email báo cáo PDF cho khoa khi nào?",
        options: [
          "A. Ngay khi kết thúc buổi giám sát và tỷ lệ tuân thủ dưới mức quy định",
          "B. Cuối tháng mới gửi"
        ],
        correctAnswer: "A",
        explanation: "Hệ thống số hóa được thiết lập gửi cảnh báo tự động ngay lập tức nếu tỷ lệ tuân thủ thấp, giúp khoa lâm sàng nhận diện vấn đề và khắc phục tức thì."
      },
      {
        id: 4,
        question: "Sáng kiến 'Ứng dụng AppSheet' có tốn chi phí mua bản quyền phần mềm không?",
        options: [
          "A. Có, rất đắt tiền",
          "B. Không, tận dụng nền tảng Low-code miễn phí của Google"
        ],
        correctAnswer: "B",
        explanation: "Tác giả tận dụng gói cơ bản, miễn phí của Google AppSheet giúp tối ưu hóa chi phí cho trung tâm y tế, hoàn toàn miễn phí triển khai."
      },
      {
        id: 5,
        question: "Bạn có thể thực hiện bảng kiểm tuân thủ vệ sinh tay trên thiết bị nào?",
        options: [
          "A. Chỉ máy tính bàn",
          "B. Máy tính bảng hoặc Điện thoại di động thông minh"
        ],
        correctAnswer: "B",
        explanation: "Hệ thống được tối ưu hóa giao diện di động, giúp nhân viên KSNK hoặc đại sứ dễ dàng thao tác kiểm tra ngay trên điện thoại thông minh hoặc máy tính bảng vô cùng tiện lợi."
      }
    ]
  }
];
