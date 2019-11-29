const commando = require('discord.js-commando')
const { TexasHoldEmPokerGameType, Player, PokerScoreService, Hand, ChipCollection, ChipService} = require('typedeck')
const deck = new TexasHoldEmPokerGameType().createDeck()
const handScorer = new PokerScoreService()
var communityCards = new Hand()
deck.shuffle()

//Extend the player class to include chips and chip methods
class PokerPlayer extends Player {
    //todo introduce the concept of the dealer chip
    constructor(name, hand) {
        super(name, hand)
        this.chips = 200
        this.folded = false
        this.lastBet = 0
    }
    getChips(){
        return this.chips
    }

    addChips(num){
        this.chips += num
        return this
    }

    takeChips(num){
        this.chips -= num
        return this
    }

    isFolded(){
        return this.folded
    }

    getLastBet(){
        return this.lastBet
    }

    setLastBet(num){
        this.lastBet = num
    }

}

class ActionHandlerService{
    constructor(players){
        this.gameType = new TexasHoldEmPokerGameType()
        this.players = players
        //todo handle side pots
        this.pot = 0
        this.highestBet = 0
        this.canRaise = true
    }

    validateAction(readableResponse, pokerPlayer){
        //todo need to add all in
        //you can't bet, raise, or call more than you have
        //you can't check if there is highestbet already in place
        //you can't raise if a raise has already been invoked in the betting round
        //you can always fold
        readableResponse = readableResponse.toLowerCase()
        var args = readableResponse.split(" ")
        if(args[0] === "fold"){
          return true

        } else if (args[0] === "bet"){
            if(isNaN(args[1]) || args[1] > pokerPlayer.getChips() || this.highestBet !== 0){
                return false
            } else {
                return true
            }
        } else if (args[0] === "raise"){
            if(isNaN(args[1]) || (args[1] + this.highestBet) > pokerPlayer.getChips() || this.canRaise === false){
                return false
            } else {
                this.canRaise = false
                return true
            }
        } else if (args[0] === "call"){
            if(this.highestBet === 0 || (this.highestBet - pokerPlayer.getLastBet()) > pokerPlayer.getChips()) {
                //give the player the money back from their last bet then remove the new total?
                return false
            } else {
                return true
            }
        } else if (args[0] === "check"){
            if(this.highestBet !== 0){
                return false
            } else {
                return true
            }
        } else {
            //if args[0] matches none of these words
            return false
        }
    }


}
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
        if(this.createPlayersFromVC(message, players)) {
            var actionHandler = new ActionHandlerService(players)
            this.dealCards(message, players)
            //fold, check, call, bet, or raise?

            //loop through all players for actions starting from the current dealer/small blind?
            //todo fix loop so that the first person who has an action changes each hand
            //todo add action to check hand and community cards
            //todo find a way to refactor and get this code into a method
            //todo reset the deck after a game
            //todo handle all in bet
            //todo deal with cards that are removed when dealing the rest of the community cards, bottom of deck

            //console.log("Player number: " + players.length)
            for (var i = dealer; i < players.length; i++) {
                message.channel.send("What would you like to do: " + players[dealer] + "?")
                console.log("Current iteration of the player loop: " + i)
                var response = await message.channel.awaitMessages(msg => {

                    /*
                    //console.log(msg.author.username)
                    var args = msg.content.split(" ")
                    var actions1 = ["fold", "check", "call"]
                    var actions2 = ["bet", "raise"]
                    //also check here to see if the message writer is the current player
                    console.log(!isNaN(args[1]) + " " + args[1] + " Money is getting retunred")
                    if (actions1.includes(args[0].toLowerCase())) {
                        return msg.content
                    } else if (actions2.includes(args[0].toLowerCase()) && !isNaN(args[1])){
                        return msg.content
                    } else {
                        //Leaving this out for now until we sort out not having the bots messages loop
                        //message.reply("Please input a valid action. (Fold, check, call, bet, raise. For bet and raise, enter" +
                            //"an amount after a space.")

                    }
                    */
                    //todo this match may not be the best way to handle things. May need to use the specific user ID
                    if(msg.author.username === players[dealer].name) {
                        var strMsg = "" + msg + ""
                        console.log("action: " + actionHandler.validateAction(strMsg, players[dealer]))
                        if (actionHandler.validateAction(strMsg, players[dealer])) {
                            console.log("got here: " + players[dealer].name)
                            return msg.content
                        } else {
                            //Leaving this out for now until we sort out not having the bots messages loop
                            //message.reply("Please input a valid action. (Fold, check, call, bet, raise. For bet and raise, enter" +
                            //"an amount after a space.")
                        }
                    }

                }, {max: 1})
                /*
                console.log("getting here")
                var readableResponse = "" + response.entries().next().value + ""
                console.log("Here's the response: " + response.entries().next().value)
                readableResponse = readableResponse.substring(readableResponse.indexOf(",") + 1)
                //feed readable response into bet handler
                console.log(readableResponse)
                */
            }

            console.log("Done with the await input: ")

            this.dealCommunityCards(message, communityCards, 3)

            console.log("Community Cards dealt")

            console.log(this.determineWinner(message, players, communityCards, handScorer))

            this.cleanupCards(players, communityCards)
        }

    }

    createPlayersFromVC(message, players){
        if(message.member.voiceChannel === undefined){
            message.channel.send("Get everyone into the voicechat (including yourself) before starting a game of Texas Hold" +
                "em.")
            return false
        } else {
            var vc = message.member.voiceChannel
            console.log(vc)
            console.log("Obtaining members of VC to create player objects")
            //console.log(vc.members)
            vc.members.forEach((member) => {
                console.log(member.user.username)
                var player = new PokerPlayer(member.user.username)
                players.push(player)
            })
            console.log(players)
            return true
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

    cleanupCards(players, communityCards = []){
        //shuffle in player cards back to the deck
        players.forEach((player) => {
            deck.addCards(player.getHand().getCards())
            player.getHand().takeCards(0)
            console.log("Cards in " + player.name + "'s hand: " + player.getHand().getCards())
        })
        //shuffle community cards back to the deck
        deck.addCards(communityCards.getCards())
        communityCards.takeCards(0)
        console.log("Deck count after cleanup: " + deck.getCount())
    }

    cleanupPlayers(){
        //todo reset folded flags, last bet status
    }

}



module.exports = startTexasHoldEmCommand