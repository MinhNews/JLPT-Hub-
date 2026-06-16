"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const vocabController_1 = require("../controllers/vocabController");
const router = (0, express_1.Router)();
router.get('/', vocabController_1.getVocabList);
router.get('/categories', vocabController_1.getVocabCategories);
exports.default = router;
