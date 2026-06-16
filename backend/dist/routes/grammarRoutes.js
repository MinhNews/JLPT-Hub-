"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const grammarController_1 = require("../controllers/grammarController");
const router = (0, express_1.Router)();
router.get('/', grammarController_1.getGrammarList);
router.get('/:id', grammarController_1.getGrammarById);
exports.default = router;
