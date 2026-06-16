"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const minnaController_1 = require("../controllers/minnaController");
const router = (0, express_1.Router)();
router.get('/lessons', minnaController_1.getMinnaLessons);
router.get('/lessons/:number', minnaController_1.getMinnaLessonDetail);
exports.default = router;
