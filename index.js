// Percobaan pertama buat bot tele

const Telegraf      = require('telegraf'); //import telegraf file
const Markup        = require('telegraf/markup'); //get markup module
const Stage         = require('telegraf/stage'); //Per Telegraf: A stage is a simple scene-based control flow middle-ware.
const session       = require('telegraf/session');
const WizardScene   = require('telegraf/scenes/wizard');

const Converter     = require("./api/currency-converter"); // Currency converter code

//define bot_token
// const bot = new Telegraf('855084150:AAFnbdTSo3RnZLwcDJqw2YF4zMN-AO1tcIc')
const bot = new Telegraf(process.env.BOT_TOKEN); // Get the token from the environment variable

const URL = process.env.URL; // get the Heroku config var URL
const BOT_TOKEN = process.env.BOT_TOKEN || ""; // get Heroku config var BOT_TOKEN
const PORT = process.env.PORT || 2000;

// Config the webhook for heroku
bot.telegram.setWebhook(`${URL}bot${BOT_TOKEN}`);
bot.startWebhook(`/bot${BOT_TOKEN}`, null, PORT);

//Start bot
bot.start((ctx) => 
    ctx.reply(
        `Semangat Pagi ${ctx.from.first_name}!`,
        
        //buat 1x2 matrix keyboard
        Markup.inlineKeyboard([
            Markup.callbackButton("💱 Convert Currency", "CONVERT_CURRENCY"),
            Markup.callbackButton("🤑 View Rates", "VIEW_RATES")
        ]).extra()
    )
);

//go back to menu after action
bot.action("BACK", ctx => {
    ctx.reply(`Senang dapat membantu`);
    ctx.reply(
        `Do you need something else, ${ctx.from.first_name}?`,
        Markup.inlineKeyboard([
            Markup.callbackButton("💱 Convert Currency", "CONVERT_CURRENCY"),
            Markup.callbackButton("🤑 View Rates", "VIEW_RATES")
          ]).extra()
    );
});

// currency converter Wizard
const currencyConverter = new WizardScene(
    "currency_converter",
    ctx => {
        ctx.reply("Masukan tipe currency untuk di convert (contoh : USD)");
        return ctx.wizard.next();
    },

    ctx => {
        /* 
        * ctx.wizard.state is the state management object which is persistent
        * throughout the wizard 
        * we pass to it the previous user reply (supposed to be the source Currency ) 
        * which is retrieved through `ctx.message.text`
        */

        ctx.wizard.state.currencySource = ctx.message.text;

        ctx.reply(
            `OK, rubah dari currency ${
            ctx.wizard.state.currencySource
            } ke currency? (example: IDR)`
        );

        // Go to the following scene
        return ctx.wizard.next();
    },

    ctx => {
        /*
        * we get currency to convert to from the last user's input
        * which is retrieved through `ctx.message.text`
        */
        ctx.wizard.state.currencyDestination = ctx.message.text;

        ctx.reply(
            `Jumlah yang di konversi ${ctx.wizard.state.currencySource} ke ${
                ctx.wizard.state.currencyDestination
              }`
        );

        return ctx.wizard.next();
    },

    ctx => {
        const amt       = (ctx.wizard.state.amount = ctx.message.text);
        const source    = ctx.wizard.state.currencySource;
        const dest      = ctx.wizard.state.currencyDestination;
        const rates     = Converter.getRate(source, dest);

        rates.then(res => {
            let newAmount = Object.values(res.data)[0] * amt;
            newAmount = newAmount.toFixed(3).toString();
            ctx.reply(
                `${amt} ${source} is worth \n${newAmount} ${dest}`,
                Markup.inlineKeyboard([
                    Markup.callbackButton("🔙 Back to Menu", "BACK"),
                    Markup.callbackButton("💱 Convert Another Currency",  "CONVERT_CURRENCY")
                ]).extra()
            );
        });

        return ctx.scene.leave();
    }
);

//Scene registration
const stage = new Stage([currencyConverter], { default: "currency_converter" });
bot.use(session());
bot.use(stage.middleware());
// bot.startPolling()

// Start convert action
bot.command("convert",  enter("currency_converter"));
bot.action("CONVERT_CURRENCY",  enter("currency_converter"));

// Matching any input and default known inputs
bot.hears("Hello",({reply}) => reply('Hello! What\'s up?'))
bot.hears("Hi",({reply}) => reply('Hello! What\'s up?'))

bot.hears(/.*/, ({ match, reply }) => reply(`I really wish i could understand what "${match}" means
As for now you can use /convert to make me convert currencies`));