const { Telegraf, Markup } = require('telegraf');
const axios = require('axios');
const cheerio = require('cheerio');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 8080;
app.get('/', (req, res) => res.send('إمبراطورية مكاريوس v10.0 تعمل بنجاح! 🛡️🚀'));
app.listen(PORT);

const bot = new Telegraf(process.env.BOT_TOKEN);

const allCountries = [
    { name: '🇺🇸 أمريكا', slug: 'usa' }, { name: '🇬🇧 إنجلترا', slug: 'uk' },
    { name: '🇨🇦 كندا', slug: 'canada' }, { name: '🇵🇱 بولندا', slug: 'poland' },
    { name: '🇫🇷 فرنسا', slug: 'france' }, { name: '🇩🇪 ألمانيا', slug: 'germany' },
    { name: '🇪🇪 إستونيا', slug: 'estonia' }, { name: '🇸🇪 السويد', slug: 'sweden' },
    { name: '🇮🇹 إيطاليا', slug: 'italy' }, { name: '🇪🇸 إسبانيا', slug: 'spain' }
];

bot.start((ctx) => {
    ctx.reply(`👑 **إمبراطورية مكاريوس v10.0**\n\n📍 اختر الدولة لبدء السحب:`, 
    Markup.inlineKeyboard(allCountries.map(c => [Markup.button.callback(c.name, `list_${c.slug}`)])));
});

bot.action(/list_(.+)/, async (ctx) => {
    const slug = ctx.match[1];
    await ctx.answerCbQuery('📡 جاري الاتصال بالسيرفر العالمي...');
    try {
        const res = await axios.get(`https://receive-sms-free.net/Free-Receive-SMS-Online/${slug}/`, {
            timeout: 12000,
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0' }
        });
        const $ = cheerio.load(res.data);
        let buttons = [];
        $('.number-boxes-item-m').slice(0, 10).each((i, el) => {
            const num = $(el).find('.number-boxes-item-m-number').text().trim();
            const numPath = $(el).find('a').attr('href').split('/').filter(Boolean).pop();
            if(num && numPath) buttons.push([Markup.button.callback(`📲 ${num}`, `get_${numPath}`)]);
        });
        ctx.reply(`✅ أرقام ${slug.toUpperCase()} المتاحة:`, Markup.inlineKeyboard(buttons));
    } catch (e) { ctx.reply("⚠️ السيرفر مشغول، جرب دولة تانية."); }
});

bot.action(/get_(.+)/, async (ctx) => {
    const numPath = ctx.match[1];
    await ctx.answerCbQuery('📩 جاري سحب الأكواد...');
    try {
        const res = await axios.get(`https://receive-sms-free.net/Free-SMS-Online/${numPath}/`, { timeout: 12000 });
        const $ = cheerio.load(res.data);
        let codes = [];
        $('.msgtbl tr').slice(1, 6).each((i, el) => {
            const msg = $(el).find('td').eq(2).text().trim();
            const time = $(el).find('td').eq(3).text().trim();
            codes.push(`🔹 **الكود ${i+1}:**\n\`${msg}\`\n🕒 ${time}`);
        });
        ctx.reply(`📱 الرقم: \`${numPath}\`\n\n📋 الأكواد:\n\n${codes.join('\n\n')}`, 
        Markup.inlineKeyboard([[Markup.button.callback('🔄 تحديث فوري', `get_${numPath}`)], [Markup.button.callback('🔙 القائمة الرئيسية', 'start_over')]]));
    } catch (e) { ctx.reply("⚠️ خطأ، اطلب الكود تاني."); }
});

bot.action('start_over', (ctx) => {
    ctx.editMessageText(`📍 اختر الدولة:`, Markup.inlineKeyboard(allCountries.map(c => [Markup.button.callback(c.name, `list_${c.slug}`)])));
});

bot.launch();
