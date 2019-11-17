//const cannot be changed (final) var can be set again
//const Discord = require('discord.js')
//const bot = new Discord.Client()
const poker = require('poker')
const commando = require('discord.js-commando')
const bot = new commando.Client()
var variable = 0

bot.registry.registerGroup("poker", "Poker")
bot.registry.registerDefaults()
bot.registry.registerCommandsIn(__dirname + "/commands")


bot.on('message', function(message) {
    if(message.content === 'ping'){
        message.reply('Pong')
    } else if (message.content === "Send me something"){
        message.reply("What is your bet?")
    }
})

bot.login("NjQwMzU1MTYyODM3MzUyNDU5.Xb4tXw.4EoFNBJHQR85cjpW_ub07dYotLU")
