const commando = require('discord.js-commando')
const { TexasHoldEmPokerGameType, Player, PokerScoreService, Hand} = require('typedeck')
const deck = new TexasHoldEmPokerGameType().createDeck()
const handScorer = new PokerScoreService()
var communityCards = new Hand()
deck.shuffle()

class startTexasHoldEmCommand extends commando.Command{
    constructor(client){
        super(client, {
            name: 'sthe',
            group: 'poker',
            memberName: 'sthe',
            description: '(S)tart (T)exas (H)old (E)m',
        })
    }

    async run(message, args){
        message.reply("Open the game!")
        var dealer = 0;
        var players = []
        this.createPlayersFromVC(message, players)
        this.dealCards(message, players)
        //fold, check, call, bet, or raise?

        //loop through all players for actions starting from the current dealer/small blind?
        //todo fix loop so that the first person who has an action changes each hand
        //todo test loop with multiple people
        //todo add action to check hand and community cards
        //todo find a way to refactor and get this code into a method
        //todo reset the deck after a game
        var responses = []
        //console.log("Player number: " + players.length)
        for(var i = dealer; i < players.length; i ++) {
            message.channel.send("What would you like to do: " + players[dealer] + "?")
            console.log("Current iteration of the player loop: " + i)
            var response = await message.channel.awaitMessages(msg => {
                //console.log(msg.author.username)
                var args = msg.content.split(" ")
                var actions = ["fold", "check", "call", "bet", "raise"]
                //also check here to see if the message writer is the current player
                if (actions.includes(args[0].toLowerCase())) {
                    return msg.content
                } else {
                    /* Leaving this out for now until we sort out not having the bots messages loop
                    message.reply("Please input a valid action. (Fold, check, call, bet, raise. For bet and raise, enter" +
                        "an amount after a space.")
                        */
                }
            }, {max: 1})
            responses.push(response)
        }

        console.log("Done with the await input: " )

        this.dealCommunityCards(message, communityCards, 3)

        console.log("Community Cards dealt")

        console.log(this.determineWinner(message, players, communityCards, handScorer))


    }

    createPlayersFromVC(message, players){
        if(message.member.voiceChannel === undefined){
            message.reply("Get everyone into the voicechat (including yourself) before starting a game of Texas Hold" +
                "em.")
        } else {
            var vc = message.member.voiceChannel
            console.log(vc)
            console.log("Obtaining members of VC to create player objects")
            //console.log(vc.members)
            vc.members.forEach((member) => {
                console.log(member.user.username)
                var player = new Player(member.user.username)
                players.push(player)
            })
            console.log(players)
        }
    }

    dealCards(message, players){
        players.forEach((player) => {
            deck.deal(player.getHand(), 2)
            //message.reply(player.name + " has these cards: " + player.getHand().getCards())
            //send player private message of cards dealt to them
            message.client.users.find("username", player.name).send("Here are your cards: " + player.getHand().getCards())
        });

    }

    dealCommunityCards(message, communityCards = [], num){
        deck.deal(communityCards, num)
        message.reply("These are the community cards: " + communityCards.getCards())
    }

    determineWinner(message, players, communityCards = [], handScorer) {
        var winner = players[0].name
        var highestScoringPlayerHand = 0
        players.forEach((player) => {
            var handValue = handScorer.scoreHand(player.hand, communityCards.getCards()).value
            if(handValue > highestScoringPlayerHand){
                winner = player.name
                highestScoringPlayerHand = handValue
            }
        });
        message.channel.send("The winner is: " + winner)
        return winner

    }


}



module.exports = startTexasHoldEmCommand