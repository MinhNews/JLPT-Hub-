"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const kanjiController_1 = require("../controllers/kanjiController");
const router = (0, express_1.Router)();
router.get('/', kanjiController_1.getKanjiList);
router.get('/lessons', kanjiController_1.getKanjiLessons);
exports.default = router;
