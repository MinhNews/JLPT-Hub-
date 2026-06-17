"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const grammarController_1 = require("../controllers/grammarController");
const router = express_1.default.Router();
router.get('/', grammarController_1.getGrammarList);
router.get('/questions', grammarController_1.getGrammarQuestions);
router.get('/:id', grammarController_1.getGrammarById);
exports.default = router;
