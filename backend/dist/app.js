"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const db_1 = require("./config/db");
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const listeningRoutes_1 = __importDefault(require("./routes/listeningRoutes"));
const readingRoutes_1 = __importDefault(require("./routes/readingRoutes"));
const vocabRoutes_1 = __importDefault(require("./routes/vocabRoutes"));
const grammarRoutes_1 = __importDefault(require("./routes/grammarRoutes"));
const kanjiRoutes_1 = __importDefault(require("./routes/kanjiRoutes"));
const progressRoutes_1 = __importDefault(require("./routes/progressRoutes"));
const notebookRoutes_1 = __importDefault(require("./routes/notebookRoutes"));
const membershipRoutes_1 = __importDefault(require("./routes/membershipRoutes"));
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const minnaRoutes_1 = __importDefault(require("./routes/minnaRoutes"));
const kanjiLLRoutes_1 = __importDefault(require("./routes/kanjiLLRoutes"));
const examRoutes_1 = __importDefault(require("./routes/examRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Connect to Database
(0, db_1.connectDB)();
// Middlewares
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use('/public', express_1.default.static(path_1.default.join(__dirname, '../public')));
// Routes
app.use('/api/auth', authRoutes_1.default);
app.use('/api/listening', listeningRoutes_1.default);
app.use('/api/reading', readingRoutes_1.default);
app.use('/api/vocab', vocabRoutes_1.default);
app.use('/api/grammar', grammarRoutes_1.default);
app.use('/api/kanji', kanjiRoutes_1.default);
app.use('/api/progress', progressRoutes_1.default);
app.use('/api/notebook', notebookRoutes_1.default);
app.use('/api/membership', membershipRoutes_1.default);
app.use('/api/admin', adminRoutes_1.default);
app.use('/api/users', userRoutes_1.default);
app.use('/api/minna', minnaRoutes_1.default);
app.use('/api/kanjill', kanjiLLRoutes_1.default);
app.use('/api/exams', examRoutes_1.default);
// Basic Route
app.get('/', (req, res) => {
    res.send('JLPT Hub Commercial API is running...');
});
// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
exports.default = app;
