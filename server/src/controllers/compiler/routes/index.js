// routes.js
const express = require('express');
const router = express.Router();
const { batchHandler } = require('../controllers/batchController');
const { textHandler } = require('../controllers/textController');
const { interactiveHandler } = require('../controllers/interactiveController');
const { htmlpuppeteerHandler } = require('../controllers/htmlPuppeteer/htmlpuppeteerHandler');

router.post('/batch', batchHandler);
router.post('/text', textHandler);
router.post('/interactive', interactiveHandler);


router.post('/htmlpuppeteer', htmlpuppeteerHandler);


module.exports = router;