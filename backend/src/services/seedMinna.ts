import mongoose from 'mongoose';
import { MinnaLesson } from '../models/MinnaLesson';
import dotenv from 'dotenv';
dotenv.config();

// ==================== LESSON METADATA (ALL 50 LESSONS) ====================
const LESSON_META = [
  { n: 1,  level: 'N5', jp: 'はじめまして',                vi: 'Rất vui được làm quen' },
  { n: 2,  level: 'N5', jp: 'これから　お世話に　なります', vi: 'Từ nay xin nhờ anh/chị chỉ giáo' },
  { n: 3,  level: 'N5', jp: 'これを　ください',             vi: 'Cho tôi cái này' },
  { n: 4,  level: 'N5', jp: 'そちらは　何時までですか',     vi: 'Bên đó mở đến mấy giờ?' },
  { n: 5,  level: 'N5', jp: 'この電車は　甲子園へ　行きますか', vi: 'Tàu điện này đi đến Kōshien không?' },
  { n: 6,  level: 'N5', jp: 'いっしょに　行きませんか',     vi: 'Cùng đi không?' },
  { n: 7,  level: 'N5', jp: 'いらっしゃい',                vi: 'Xin mời!' },
  { n: 8,  level: 'N5', jp: 'そろそろ　失礼します',         vi: 'Xin phép về sớm' },
  { n: 9,  level: 'N5', jp: '残念ですが',                  vi: 'Tiếc quá!' },
  { n: 10, level: 'N5', jp: 'ナンプラー、ありますか',       vi: 'Có nước mắm Thái không?' },
  { n: 11, level: 'N5', jp: 'これ、お願いします',           vi: 'Phiền anh/chị cái này' },
  { n: 12, level: 'N5', jp: '祇園祭は　どうでしたか？',     vi: 'Lễ hội Gion thế nào?' },
  { n: 13, level: 'N5', jp: '別々に　お願いします',         vi: 'Tính riêng giúp tôi' },
  { n: 14, level: 'N5', jp: 'みどり町まで　お願いします',   vi: 'Cho tôi đến thị trấn Midori' },
  { n: 15, level: 'N5', jp: 'ご家族は？',                  vi: 'Gia đình anh/chị thế nào?' },
  { n: 16, level: 'N5', jp: '使い方を　教えて　ください',   vi: 'Xin chỉ cho tôi cách dùng' },
  { n: 17, level: 'N5', jp: 'どう　しましたか？',           vi: 'Anh/chị có chuyện gì vậy?' },
  { n: 18, level: 'N5', jp: '趣味は　何ですか',             vi: 'Sở thích của anh/chị là gì?' },
  { n: 19, level: 'N5', jp: 'ダイエットは　あしたから　します', vi: 'Việc ăn kiêng để đến ngày mai' },
  { n: 20, level: 'N5', jp: 'いっしょに　行かない？',       vi: 'Không đi cùng nhau à?' },
  { n: 21, level: 'N5', jp: 'わたしも　そう　思います',     vi: 'Tôi cũng nghĩ vậy' },
  { n: 22, level: 'N5', jp: 'どんな　部屋を　お探しですか', vi: 'Anh/chị đang tìm phòng kiểu nào?' },
  { n: 23, level: 'N5', jp: 'どうやって　行きますか',       vi: 'Đi bằng phương tiện gì?' },
  { n: 24, level: 'N5', jp: '手伝いに　行きましょうか',     vi: 'Chúng ta đến giúp nhé' },
  { n: 25, level: 'N5', jp: 'いろいろ　お世話に　なりました', vi: 'Cảm ơn đã quan tâm chỉ giáo' },
  { n: 26, level: 'N4', jp: 'ごみは　どこに　出したら　いいですか', vi: 'Rác để ở đâu thì được?' },
  { n: 27, level: 'N4', jp: '何でも　作れるんですね',        vi: 'Cái gì cũng có thể làm được nhỉ' },
  { n: 28, level: 'N4', jp: '出張も　多いし、試験も　あるし…', vi: 'Vừa nhiều công tác, lại vừa có kỳ thi...' },
  { n: 29, level: 'N4', jp: '忘れ物を　して　しまいました',  vi: 'Tôi đã để quên đồ mất rồi' },
  { n: 30, level: 'N4', jp: '非常袋を　準備して　おかないと', vi: 'Phải chuẩn bị túi khẩn cấp trước' },
  { n: 31, level: 'N4', jp: '料理を　習おうと　思って　います', vi: 'Tôi đang nghĩ sẽ học nấu ăn' },
  { n: 32, level: 'N4', jp: '無理を　しない　ほうが　いいですよ', vi: 'Không nên cố quá đâu' },
  { n: 33, level: 'N4', jp: 'これは　どういう　意味ですか',  vi: 'Cái này nghĩa là gì?' },
  { n: 34, level: 'N4', jp: 'わたしが　した　とおりに、して　ください', vi: 'Xin hãy làm đúng như tôi đã làm' },
  { n: 35, level: 'N4', jp: 'どこか　いい　所、ありませんか', vi: 'Không có chỗ nào hay sao?' },
  { n: 36, level: 'N4', jp: '毎日　運動するように　して　います', vi: 'Tôi đang cố gắng tập thể dục mỗi ngày' },
  { n: 37, level: 'N4', jp: '金閣寺は　14世紀に　建てられました', vi: 'Kim Các Tự được xây dựng vào thế kỷ 14' },
  { n: 38, level: 'N4', jp: '片づけるのが　好きなんです',    vi: 'Tôi thích dọn dẹp ngăn nắp' },
  { n: 39, level: 'N4', jp: '遅れて、すみません',           vi: 'Xin lỗi vì đến trễ' },
  { n: 40, level: 'N4', jp: '友達が　できたか　どうか、心配です', vi: 'Tôi lo không biết có kết bạn được không' },
  { n: 41, level: 'N4', jp: 'ご結婚　おめでとう　ございます', vi: 'Chúc mừng đám cưới' },
  { n: 42, level: 'N4', jp: 'ボーナスは　何に　使いますか',  vi: 'Tiền thưởng dùng vào việc gì?' },
  { n: 43, level: 'N4', jp: '毎日　楽しそうです',           vi: 'Mỗi ngày trông có vẻ vui vẻ' },
  { n: 44, level: 'N4', jp: 'この写真みたいに　して　ください', vi: 'Xin làm giống như bức ảnh này' },
  { n: 45, level: 'N4', jp: 'コースを　まちがえた　場合は　どう　したら　いいですか', vi: 'Nếu đi nhầm đường thì phải làm sao?' },
  { n: 46, level: 'N4', jp: '先週　直して　もらった　ばかりなのに、また…', vi: 'Mới tuần trước vừa mới sửa xong mà lại...' },
  { n: 47, level: 'N4', jp: '婚約したそうです',             vi: 'Nghe nói đã đính hôn' },
  { n: 48, level: 'N4', jp: '休ませて　いただけませんか',    vi: 'Xin cho tôi nghỉ phép' },
  { n: 49, level: 'N4', jp: 'よろしく　お伝え　ください',    vi: 'Xin hãy chuyển lời thăm hỏi giúp tôi' },
  { n: 50, level: 'N4', jp: '心から　感謝いたします',        vi: 'Tôi vô cùng biết ơn' },
];

// ==================== BÀI 1 – FULL DATA ====================
const lesson1Vocab = [
  { kana: 'わたし',     kanji: '',      hanViet: '',          meaning: 'tôi' },
  { kana: 'わたしたち', kanji: '',      hanViet: '',          meaning: 'chúng tôi' },
  { kana: 'あなた',     kanji: '',      hanViet: '',          meaning: 'anh / chị / ông / bà (ngôi thứ 2)' },
  { kana: 'あのひと',   kanji: 'あの人', hanViet: 'NHÂN',     meaning: 'người kia / người đó' },
  { kana: 'あのかた',   kanji: 'あの方', hanViet: 'PHƯƠNG',   meaning: 'vị kia (cách nói lịch sự)' },
  { kana: '～さん',     kanji: '',       hanViet: '',          meaning: 'anh / chị / ông / bà (hậu tố lịch sự)' },
  { kana: '～ちゃん',   kanji: '',       hanViet: '',          meaning: 'hậu tố thân mật (dùng với trẻ em / bạn bè thân)' },
  { kana: '～じん',     kanji: '～人',   hanViet: 'NHÂN',      meaning: 'người (nước)～' },
  { kana: 'せんせい',   kanji: '先生',   hanViet: 'TIÊN SINH', meaning: 'thầy / cô giáo' },
  { kana: 'きょうし',   kanji: '教師',   hanViet: 'GIÁO SƯ',  meaning: 'giáo viên' },
  { kana: 'がくせい',   kanji: '学生',   hanViet: 'HỌC SINH', meaning: 'học sinh / sinh viên' },
  { kana: 'かいしゃいん', kanji: '会社員', hanViet: 'HỘI XÃ VIÊN', meaning: 'nhân viên công ty' },
  { kana: 'しゃいん',   kanji: '社員',   hanViet: 'XÃ VIÊN',  meaning: 'nhân viên công ty' },
  { kana: 'ぎんこういん', kanji: '銀行員', hanViet: 'NGÂN HÀNH VIÊN', meaning: 'nhân viên ngân hàng' },
  { kana: 'いしゃ',     kanji: '医者',   hanViet: 'Y GIẢ',    meaning: 'bác sĩ' },
  { kana: 'けんきゅうしゃ', kanji: '研究者', hanViet: 'NGHIÊN CỨU GIẢ', meaning: 'nhà nghiên cứu' },
  { kana: 'エンジニア', kanji: '',       hanViet: '',          meaning: 'kỹ sư' },
  { kana: 'だいがく',   kanji: '大学',   hanViet: 'ĐẠI HỌC',  meaning: 'trường đại học' },
  { kana: 'びょういん', kanji: '病院',   hanViet: 'BỆNH VIỆN', meaning: 'bệnh viện' },
  { kana: 'でんき',     kanji: '電気',   hanViet: 'ĐIỆN KHÍ',  meaning: 'điện / đồ điện' },
  { kana: 'だれ',       kanji: '',       hanViet: '',          meaning: 'ai' },
  { kana: 'どなた',     kanji: '',       hanViet: '',          meaning: 'vị nào (cách nói lịch sự của だれ)' },
  { kana: '～さい',     kanji: '～歳',   hanViet: 'TUẾ',      meaning: '～ tuổi' },
  { kana: 'なんさい',   kanji: '何歳',   hanViet: 'HÀ TUẾ',   meaning: 'mấy tuổi / bao nhiêu tuổi' },
  { kana: 'おいくつ',   kanji: '',       hanViet: '',          meaning: 'bao nhiêu tuổi (cách nói lịch sự)' },
  { kana: 'はい',       kanji: '',       hanViet: '',          meaning: 'vâng / dạ (đồng ý)' },
  { kana: 'いいえ',     kanji: '',       hanViet: '',          meaning: 'không phải (phủ nhận)' },
  { kana: 'そうです',   kanji: '',       hanViet: '',          meaning: 'đúng vậy / phải vậy' },
  { kana: 'そうじゃ ありません', kanji: '', hanViet: '',        meaning: 'không phải vậy' },
  { kana: 'はじめまして', kanji: '',     hanViet: '',          meaning: 'Rất vui được làm quen lần đầu' },
  { kana: 'どうぞ よろしく', kanji: '',  hanViet: '',          meaning: 'Rất mong được quan tâm chỉ giáo' },
  { kana: 'こちらこそ', kanji: '',       hanViet: '',          meaning: 'Tôi cũng vậy (đáp lại lời cảm ơn/chào hỏi)' },
  { kana: 'しつれいですが', kanji: '失礼ですが', hanViet: 'THẤT LỄ', meaning: 'Xin lỗi cho tôi hỏi / Thất lễ chút...' },
  { kana: 'おなまえは？', kanji: 'お名前は？', hanViet: 'DANH',  meaning: 'Tên anh/chị là gì?' },
  { kana: '～から きました', kanji: '',  hanViet: '',          meaning: 'đến từ ～ (quốc gia / vùng)' },
];

const lesson1Grammar = [
  {
    title: 'Phần 1: N は N です — Câu khẳng định',
    structure: 'N1 は N2 です',
    explanation: 'Diễn đạt "N1 là N2". Đây là cấu trúc câu danh từ cơ bản nhất trong tiếng Nhật. Trợ từ は (đọc là "wa") đánh dấu chủ đề của câu.',
    examples: [
      { jp: 'わたしは がくせい です。', vi: 'Tôi là học sinh.' },
      { jp: 'ミラーさんは エンジニア です。', vi: 'Anh Miller là kỹ sư.' },
      { jp: 'これは ほん です。', vi: 'Cái này là quyển sách.' },
    ]
  },
  {
    title: 'Phần 2: N は N じゃ ありません — Câu phủ định',
    structure: 'N1 は N2 じゃ ありません',
    explanation: 'Phủ định "N1 không phải là N2". "じゃ ありません" là dạng phủ định của "です". Trong văn viết trang trọng hơn, dùng "では ありません".',
    examples: [
      { jp: 'わたしは せんせい じゃ ありません。', vi: 'Tôi không phải là giáo viên.' },
      { jp: 'サントスさんは にほんじん じゃ ありません。', vi: 'Anh Santos không phải là người Nhật.' },
    ]
  },
  {
    title: 'Phần 3: N は N ですか — Câu hỏi Có/Không',
    structure: 'N1 は N2 ですか',
    explanation: 'Câu hỏi đơn giản "N1 có phải là N2 không?". Thêm か vào cuối câu khẳng định để tạo thành câu hỏi. Không dùng dấu chấm hỏi "?" trong văn viết tiếng Nhật truyền thống.',
    examples: [
      { jp: 'あのかたは やまださんですか。', vi: 'Vị kia có phải là anh Yamada không?' },
      { jp: 'はい、そうです。', vi: 'Vâng, đúng vậy.' },
      { jp: 'いいえ、ちがいます。', vi: 'Không, không phải.' },
    ]
  },
  {
    title: 'Phần 4: N の N — Danh từ sở hữu / phân loại',
    structure: 'N1 の N2',
    explanation: 'Trợ từ の nối hai danh từ. N1 bổ nghĩa cho N2, có thể chỉ sở hữu ("N2 của N1"), thuộc về, hoặc phân loại. Tương tự "of" trong tiếng Anh.',
    examples: [
      { jp: 'ミラーさんは IMC の エンジニア です。', vi: 'Anh Miller là kỹ sư của công ty IMC.' },
      { jp: 'わたしは にほんご の がくせい です。', vi: 'Tôi là học sinh tiếng Nhật.' },
      { jp: 'これは なんの ほんですか。', vi: 'Đây là sách về gì vậy?' },
    ]
  },
  {
    title: 'Phần 5: A ですか、B ですか — Câu hỏi lựa chọn',
    structure: 'N は A ですか、B ですか',
    explanation: 'Câu hỏi đưa ra 2 lựa chọn A hoặc B. Người nghe phải chọn một trong hai. Không trả lời bằng はい/いいえ.',
    examples: [
      { jp: 'なまえは マイク ですか、マーク ですか。', vi: 'Tên là Mike hay Mark?' },
      { jp: 'マイク です。', vi: 'Là Mike.' },
    ]
  },
];

const lesson1Kanji = [
  { kanji: 'あの人', hanViet: 'NHÂN', kana: 'あのひと' },
  { kanji: 'あの方', hanViet: 'PHƯƠNG', kana: 'あのかた' },
  { kanji: '～人', hanViet: 'NHÂN', kana: '～じん' },
  { kanji: '先生', hanViet: 'TIÊN SINH', kana: 'せんせい' },
  { kanji: '教師', hanViet: 'GIÁO SƯ', kana: 'きょうし' },
  { kanji: '学生', hanViet: 'HỌC SINH', kana: 'がくせい' },
  { kanji: '会社員', hanViet: 'HỘI XÃ VIÊN', kana: 'かいしゃいん' },
  { kanji: '社員', hanViet: 'XÃ VIÊN', kana: 'しゃいん' },
  { kanji: '銀行員', hanViet: 'NGÂN HÀNH VIÊN', kana: 'ぎんこういん' },
  { kanji: '医者', hanViet: 'Y GIẢ', kana: 'いしゃ' },
  { kanji: '研究者', hanViet: 'NGHIÊN CỨU GIẢ', kana: 'けんきゅうしゃ' },
  { kanji: '大学', hanViet: 'ĐẠI HỌC', kana: 'だいがく' },
  { kanji: '病院', hanViet: 'BỆNH VIỆN', kana: 'びょういん' },
  { kanji: '電気', hanViet: 'ĐIỆN KHÍ', kana: 'でんき' },
  { kanji: '何歳', hanViet: 'HÀ TUẾ', kana: 'なんさい' },
];

const lesson1Kaiwa = {
  audioUrl: '',
  lines: [
    { speaker: '佐藤', jp: 'おはよう ございます。', vi: 'Chào anh (buổi sáng)!' },
    { speaker: '山田', jp: 'おはよう ございます。', vi: 'Chào chị (buổi sáng)!' },
    { speaker: '佐藤', jp: '山田さん、こちらは マイク・ミラーさんです。', vi: 'Anh Yamada, đây là anh Mike Miller.' },
    { speaker: 'ミラー', jp: '初めまして。マイク・ミラーです。', vi: 'Rất vui được làm quen. Tôi là Mike Miller.' },
    { speaker: 'ミラー', jp: 'IMCの　エンジニアです。', vi: 'Tôi là kỹ sư của công ty IMC.' },
    { speaker: 'ミラー', jp: 'どうぞ　よろしく　お願いします。', vi: 'Rất mong được quan tâm chỉ giáo.' },
    { speaker: '山田', jp: 'こちらこそ、どうぞ　よろしく。', vi: 'Tôi cũng vậy, rất mong được quan tâm chỉ giáo.' },
  ]
};

const lesson1Test = [
  {
    question: 'わたし nghĩa là gì?',
    choices: ['Bạn', 'Anh ấy', 'Tôi', 'Chúng tôi'],
    correctIdx: 2
  },
  {
    question: '先生 đọc là gì?',
    choices: ['がくせい', 'せんせい', 'きょうし', 'いしゃ'],
    correctIdx: 1
  },
  {
    question: 'Câu nào đúng nghĩa "Tôi là học sinh"?',
    choices: [
      'わたしは せんせい です。',
      'あなたは がくせい です。',
      'わたしは がくせい です。',
      'わたしは がくせい じゃ ありません。'
    ],
    correctIdx: 2
  },
  {
    question: '「～じゃ ありません」 dùng để diễn đạt điều gì?',
    choices: ['Khẳng định', 'Phủ định', 'Câu hỏi', 'Sở hữu'],
    correctIdx: 1
  },
  {
    question: 'Trợ từ の trong "IMC の エンジニア" có nghĩa gì?',
    choices: ['là', 'và', 'của', 'từ'],
    correctIdx: 2
  },
  {
    question: '「はじめまして」 dùng khi nào?',
    choices: [
      'Tạm biệt',
      'Gặp lần đầu tiên',
      'Cảm ơn',
      'Xin lỗi'
    ],
    correctIdx: 1
  },
  {
    question: '医者 nghĩa là gì?',
    choices: ['Học sinh', 'Kỹ sư', 'Bác sĩ', 'Nhân viên ngân hàng'],
    correctIdx: 2
  },
  {
    question: 'Câu hỏi lựa chọn "N は A ですか、B ですか" — bạn trả lời bằng gì?',
    choices: ['はい', 'いいえ', 'Chọn A hoặc B', 'そうです'],
    correctIdx: 2
  },
];

// ==================== BÀI 2 – BASIC DATA ====================
const lesson2Vocab = [
  { kana: 'これ',       kanji: '',       hanViet: '',         meaning: 'cái này (gần người nói)' },
  { kana: 'それ',       kanji: '',       hanViet: '',         meaning: 'cái đó (gần người nghe)' },
  { kana: 'あれ',       kanji: '',       hanViet: '',         meaning: 'cái kia (xa cả hai người)' },
  { kana: 'どれ',       kanji: '',       hanViet: '',         meaning: 'cái nào' },
  { kana: 'この',       kanji: '',       hanViet: '',         meaning: 'cái này (đứng trước danh từ)' },
  { kana: 'その',       kanji: '',       hanViet: '',         meaning: 'cái đó (đứng trước danh từ)' },
  { kana: 'あの',       kanji: '',       hanViet: '',         meaning: 'cái kia (đứng trước danh từ)' },
  { kana: 'どの',       kanji: '',       hanViet: '',         meaning: 'cái nào (đứng trước danh từ)' },
  { kana: 'ほん',       kanji: '本',     hanViet: 'BẢN',      meaning: 'sách, cuốn sách' },
  { kana: 'じしょ',     kanji: '辞書',   hanViet: 'TỪ THƯ',   meaning: 'từ điển' },
  { kana: 'ざっし',     kanji: '雑誌',   hanViet: 'TẠP CHÍ',  meaning: 'tạp chí' },
  { kana: 'しんぶん',   kanji: '新聞',   hanViet: 'TÂN VĂN',  meaning: 'báo, tờ báo' },
  { kana: 'ノート',     kanji: '',       hanViet: '',         meaning: 'vở ghi / sổ tay' },
  { kana: 'てちょう',   kanji: '手帳',   hanViet: 'THỦ TRƯỚNG', meaning: 'sổ tay bỏ túi' },
  { kana: 'めいし',     kanji: '名刺',   hanViet: 'DANH THIẾP', meaning: 'danh thiếp' },
  { kana: 'カード',     kanji: '',       hanViet: '',         meaning: 'thẻ / card' },
  { kana: 'テレホンカード', kanji: '',   hanViet: '',         meaning: 'thẻ điện thoại' },
  { kana: 'えんぴつ',   kanji: '鉛筆',   hanViet: 'DIÊN BÚT', meaning: 'bút chì' },
  { kana: 'ボールペン', kanji: '',       hanViet: '',         meaning: 'bút bi' },
  { kana: 'シャープペンシル', kanji: '', hanViet: '',         meaning: 'bút chì kim (bấm)' },
  { kana: 'かさ',       kanji: '傘',     hanViet: 'TÁN',      meaning: 'ô, dù' },
  { kana: 'かばん',     kanji: '',       hanViet: '',         meaning: 'túi xách, cặp' },
  { kana: 'かぎ',       kanji: '鍵',     hanViet: 'KIỆN',     meaning: 'chìa khóa' },
  { kana: 'とけい',     kanji: '時計',   hanViet: 'THỜI KẾ',  meaning: 'đồng hồ' },
  { kana: 'めがね',     kanji: '眼鏡',   hanViet: 'NHÃN KÍNH', meaning: 'kính mắt' },
  { kana: 'カメラ',     kanji: '',       hanViet: '',         meaning: 'máy ảnh' },
  { kana: 'なに / なん', kanji: '何',   hanViet: 'HÀ',       meaning: 'cái gì' },
  { kana: 'そう',        kanji: '',      hanViet: '',         meaning: 'vậy / như vậy' },
  { kana: 'ちがいます',  kanji: '違います', hanViet: '',      meaning: 'không phải, khác' },
  { kana: 'あのう',      kanji: '',      hanViet: '',         meaning: 'ờm... / uhm... (ngập ngừng khi nói)' },
  { kana: 'えーと',      kanji: '',      hanViet: '',         meaning: 'ờ... / à... (ngập ngừng khi nói)' },
  { kana: 'にほんご',    kanji: '日本語', hanViet: 'NHẬT BẢN NGỮ', meaning: 'tiếng Nhật' },
];

const lesson2Grammar = [
  {
    title: 'Phần 1: これ / それ / あれ は N です — Đây / Đó / Kia là...',
    structure: 'これ / それ / あれ は N です',
    explanation: 'これ (cái này — gần người nói), それ (cái đó — gần người nghe), あれ (cái kia — xa cả hai người). Đây là đại từ chỉ thị vật thể.',
    examples: [
      { jp: 'これは じしょ です。', vi: 'Cái này là từ điển.' },
      { jp: 'それは なん ですか。', vi: 'Cái đó là cái gì vậy?' },
      { jp: 'あれは IMCの ビル です。', vi: 'Kia là tòa nhà của công ty IMC.' },
    ]
  },
  {
    title: 'Phần 2: この / その / あの N — Này / Đó / Kia + danh từ',
    structure: 'この / その / あの N',
    explanation: 'Khác với これ/それ/あれ (đại từ đứng độc lập), この/その/あの phải đứng trước danh từ để bổ nghĩa. Không dùng độc lập.',
    examples: [
      { jp: 'この ほん は わたしの です。', vi: 'Cuốn sách này là của tôi.' },
      { jp: 'その かばん は だれの ですか。', vi: 'Cái túi đó là của ai?' },
      { jp: 'あの かたは だれですか。', vi: 'Vị kia là ai?' },
    ]
  },
  {
    title: 'Phần 3: N は N の N です — Sở hữu mở rộng',
    structure: 'N1 は N2 の N3 です',
    explanation: 'Mở rộng cấu trúc の để chỉ sở hữu chi tiết hơn. Rất phổ biến khi giới thiệu đồ vật thuộc về ai.',
    examples: [
      { jp: 'これは ミラーさんの かさ です。', vi: 'Cái này là ô của anh Miller.' },
      { jp: 'これは にほんの じどうしゃ です。', vi: 'Cái này là ô tô của Nhật Bản.' },
    ]
  },
  {
    title: 'Phần 4: そう / ちがいます — Đồng ý / Phủ nhận',
    structure: 'はい、そうです / いいえ、そうじゃ ありません / ちがいます',
    explanation: '"そうです" xác nhận thông tin vừa đề cập. "ちがいます" dùng để phủ nhận một thông tin cụ thể khi người nghe hiểu nhầm.',
    examples: [
      { jp: 'それは じしょですか。はい、そうです。', vi: 'Cái đó là từ điển à? Vâng, đúng vậy.' },
      { jp: 'これは ミラーさんの ですか。いいえ、ちがいます。', vi: 'Cái này là của anh Miller à? Không, không phải.' },
    ]
  },
];

const lesson2Kanji = [
  { kanji: '本', hanViet: 'BẢN', kana: 'ほん' },
  { kanji: '辞書', hanViet: 'TỪ THƯ', kana: 'じしょ' },
  { kanji: '雑誌', hanViet: 'TẠP CHÍ', kana: 'ざっし' },
  { kanji: '新聞', hanViet: 'TÂN VĂN', kana: 'しんぶん' },
  { kanji: '手帳', hanViet: 'THỦ TRƯỚNG', kana: 'てちょう' },
  { kanji: '名刺', hanViet: 'DANH THIẾP', kana: 'めいし' },
  { kanji: '鉛筆', hanViet: 'DIÊN BÚT', kana: 'えんぴつ' },
  { kanji: '傘', hanViet: 'TÁN', kana: 'かさ' },
  { kanji: '鍵', hanViet: 'KIỆN', kana: 'かぎ' },
  { kanji: '時計', hanViet: 'THỜI KẾ', kana: 'とけい' },
  { kanji: '眼鏡', hanViet: 'NHÃN KÍNH', kana: 'めがね' },
  { kanji: '何', hanViet: 'HÀ', kana: 'なに / なん' },
  { kanji: '日本語', hanViet: 'NHẬT BẢN NGỮ', kana: 'にほんご' },
];

const lesson2Kaiwa = {
  audioUrl: '',
  lines: [
    { speaker: 'ミラー', jp: 'これは　にほんごで　なんと　いいますか。', vi: 'Cái này tiếng Nhật gọi là gì?' },
    { speaker: '山田', jp: 'それは　えんぴつと　いいます。', vi: 'Cái đó gọi là えんぴつ (bút chì).' },
    { speaker: 'ミラー', jp: 'えんぴつ？　もう　いちど　おねがいします。', vi: 'えんぴつ? Xin nói lại một lần nữa.' },
    { speaker: '山田', jp: 'え・ん・ぴ・つ。', vi: 'E-n-pi-tsu.' },
    { speaker: 'ミラー', jp: 'ありがとう　ございます。', vi: 'Cảm ơn anh.' },
  ]
};

const lesson2Test = [
  { question: 'これ nghĩa là gì?', choices: ['Cái kia', 'Cái đó', 'Cái này', 'Cái nào'], correctIdx: 2 },
  { question: 'どれ nghĩa là gì?', choices: ['Cái nào', 'Cái này', 'Cái đó', 'Cái kia'], correctIdx: 0 },
  { question: '辞書 đọc là gì?', choices: ['ざっし', 'しんぶん', 'じしょ', 'てちょう'], correctIdx: 2 },
  { question: 'この khác これ ở điểm nào?', choices: [
    'Không có gì khác', 'この phải đứng trước danh từ', 'これ phải đứng trước danh từ', 'この chỉ dùng câu phủ định'
  ], correctIdx: 1 },
  { question: '"ちがいます" dùng để...', choices: ['Đồng ý', 'Phủ nhận thông tin', 'Chào hỏi', 'Cảm ơn'], correctIdx: 1 },
  { question: 'Đồng hồ tiếng Nhật là gì?', choices: ['かさ', 'めがね', 'とけい', 'かぎ'], correctIdx: 2 },
];

// ==================== SEED FUNCTION ====================
export const seedMinna = async () => {
  const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/jlpt_hub';
  await mongoose.connect(MONGO_URI);
  console.log('MongoDB connected for Minna seeding...');

  const lessonDataMap: Record<number, any> = {
    1: { vocab: lesson1Vocab, grammar: lesson1Grammar, kanji: lesson1Kanji, kaiwa: lesson1Kaiwa, test: lesson1Test },
    2: { vocab: lesson2Vocab, grammar: lesson2Grammar, kanji: lesson2Kanji, kaiwa: lesson2Kaiwa, test: lesson2Test },
  };

  let created = 0;
  let skipped = 0;

  for (const meta of LESSON_META) {
    const existing = await MinnaLesson.findOne({ lessonNumber: meta.n });
    if (existing) { skipped++; continue; }

    const fullData = lessonDataMap[meta.n] || {};

    await MinnaLesson.create({
      lessonNumber: meta.n,
      level: meta.level,
      titleJp: meta.jp,
      titleVi: meta.vi,
      vocab: fullData.vocab || [],
      grammar: fullData.grammar || [],
      kanji: fullData.kanji || [],
      kaiwa: fullData.kaiwa || { audioUrl: '', lines: [] },
      test: fullData.test || [],
      listeningHtml: '',
      exerciseHtml: '',
      kanjiRenshuHtml: '',
      readingHtml: '',
      readingCompHtml: '',
      referenceHtml: '',
    });
    created++;
    console.log(`  ✓ Bài ${meta.n}: ${meta.jp}`);
  }

  console.log(`\nMinna seeding done! Created: ${created}, Skipped (already exists): ${skipped}`);
  await mongoose.disconnect();
};

// Run directly: ts-node seedMinna.ts
if (require.main === module) {
  seedMinna().catch(console.error);
}
