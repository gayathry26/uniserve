const puppeteer = require('puppeteer');
const pixelmatchModule = require('pixelmatch');
const pixelmatch = pixelmatchModule.default || pixelmatchModule; // ✅ fix
const { PNG } = require('pngjs');
const axios = require('axios');

async function htmlpuppeteerHandler(req, res) {

    const { preview } = req.body;

    const adminImagePath = 'https://coder.amypo.com/storage//files/asset_images/e8u7H41dbcf0PXITQ8v60NUhaUKoBNZcEg9Lqe2k.png';

    const htmlDoc = preview;

    let browser;
    try {
        const adminResp = await axios.get(adminImagePath, {
            responseType: 'arraybuffer',
            validateStatus: (status) => status >= 200 && status < 400,
        });

        const adminImage = PNG.sync.read(Buffer.from(adminResp.data));

        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });

        const page = await browser.newPage();
        await page.setViewport({ width: 1024, height: 768 }); // adjust to your design

        await page.setContent(htmlDoc, {
            waitUntil: 'networkidle0',
            timeout: 30000,
        });

        // Take screenshot buffer
        const userScreenshotBuffer = await page.screenshot({ fullPage: true });

        // Load admin reference image
        const userImage = PNG.sync.read(userScreenshotBuffer);

        // Make sure dimensions match; otherwise, resize one or return error
        if (
            adminImage.width !== userImage.width ||
            adminImage.height !== userImage.height
        ) {
            return res.status(400).json({
                error: 'Dimension mismatch between user output and reference image',
                details: {
                    admin: { w: adminImage.width, h: adminImage.height },
                    user: { w: userImage.width, h: userImage.height },
                },
            });
        }

        const { width, height } = adminImage;
        const diff = new PNG({ width, height });

        const diffPixels = pixelmatch(
            adminImage.data,
            userImage.data,
            diff.data,
            width,
            height,
            { threshold: 0.2 } // tweak sensitivity
        );

        const totalPixels = width * height;
        const similarity = 1 - diffPixels / totalPixels; // 1 = identical

        res.json({
            success: true,
            similarity,
            diffPixels,
            totalPixels,
            passed: similarity >= 0.60, // your threshold
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Puppeteer validation failed', details: err.message });
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

module.exports = { htmlpuppeteerHandler };
