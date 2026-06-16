"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const listeningController_1 = require("../controllers/listeningController");
const router = (0, express_1.Router)();
router.get('/', listeningController_1.getAllListeningLessons);
router.get('/:id', listeningController_1.getListeningLessonById);
exports.default = router;
