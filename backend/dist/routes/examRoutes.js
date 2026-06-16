"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const examController_1 = require("../controllers/examController");
const router = (0, express_1.Router)();
router.get('/:level', examController_1.getExamsList);
router.get('/:level/:id', examController_1.getExamDetails);
exports.default = router;
