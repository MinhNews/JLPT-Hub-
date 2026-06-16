"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const kanjiLLController_1 = require("../controllers/kanjiLLController");
const router = express_1.default.Router();
router.get('/', kanjiLLController_1.getAllLessons);
router.get('/:id', kanjiLLController_1.getLessonById);
exports.default = router;
