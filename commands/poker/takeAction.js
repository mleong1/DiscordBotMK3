const commando = require('discord.js-commando')

class takeBetCommand extends commando.Command{
    constructor(client){
        super(client, {
            name: 'ta',
            group: 'poker',
            memberName: 'ta',
            description: 'takes a player (t)able (a)ction',
            args:[
                {
                    key: 'action',
                    prompt: 'Do you want to fold, check, call, bet, or raise?',
                    type: 'string',
                    validate: action => {
                        if(action.toLowerCase() === 'fold' || action.toLowerCase() === 'check' ||
                        action.toLowerCase() === 'call' || action.toLowerCase() === 'bet' ||
                        action.toLowerCase() === 'raise')return true
                        return "Choose a valid action from fold, check, call, bet or raise."

                    }
                },
                {
                    key: 'bet',
                    prompt: 'What is your bet?',
                    type: 'integer',
                    default: ''
                }
            ]
        })
    }

    async run(message, {action, bet}){
        if((action.toLowerCase() === 'bet' || action.toLowerCase() === 'raise') && bet == 0){
            message.reply("You need to specify the amount of money for your bet or raise.")
        } else {
            let playerAction = {
                action: action,
                bet: bet
            }

        }
    }
}

module.exports = takeBetCommand