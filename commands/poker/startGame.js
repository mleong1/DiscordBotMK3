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
            //raise has to be at least the
            if(isNaN(args[1]) || (args[1] + this.highestBet) > pokerPlayer.getChips() || this.canRaise === false ||
                args[1] < this.highestBet){
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

    executeAction(verifiedResponse, pokerPlayer) {
        verifiedResponse = verifiedResponse.toLowerCase()
        var args = verifiedResponse.split(" ")
        var betMoney = parseInt(args[1])

        console.log("Inside execute action: " + args[0])
        if (args[0] === "fold") {
            pokerPlayer.folded = true
        } else if (args[0] === "bet") {
            console.log("I am at the betting stage")
            pokerPlayer.takeChips(betMoney)
            pokerPlayer.setLastBet(betMoney)
            this.pot += betMoney
            this.highestBet = betMoney
        } else if (args[0] === "raise") {
            pokerPlayer.takeChips(betMoney + this.highestBet)
            pokerPlayer.setLastBet(betMoney + this.highestBet)
            this.pot += betMoney
            this.highestBet = betMoney
        } else if (args[0] === "call") {
            pokerPlayer.takeChips(this.highestBet - pokerPlayer.lastBet)
            pokerPlayer.setLastBet(this.highestBet)
            this.pot += this.highestBet - pokerPlayer.lastBet
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
        let dealer = 0;
        let players = []
        if(this.createPlayersFromVC(message, players)) {
            let actionHandler = new ActionHandlerService(players)
            this.dealCards(message, players)

            //fold, check, call, bet, or raise?
            //loop through all players for actions starting from the current dealer/small blind?

            //todo fix loop so that the first person who has an action changes each hand
            //todo add action to check hand and community cards
            //todo handle all in bet
            //todo deal with cards that are removed when dealing the rest of the community cards, bottom of deck
            //todo need to handle round 2 if someone raises


            for(let i = dealer; i < players.length; i ++) {
                message.channel.send("What would you like to do: " + players[i] + "? :spades:");
                await this.getPlayerInput(message, players, i, actionHandler)
            }
            await this.handleRaise(message, players, dealer, actionHandler)
            //console.log("Player number: " + players.length)

            console.log("Done with the await input: ")

            this.dealCommunityCards(message, communityCards, 3)

            console.log("Community Cards dealt")

            var winner = this.determineWinner(message, players, communityCards, handScorer)
            winner.addChips(actionHandler.pot)
            console.log(winner.getChips())

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
        var winner = players[0]
        var highestScoringPlayerHand = 0
        players.forEach((player) => {
            if(!player.isFolded()) {
                var handValue = handScorer.scoreHand(player.hand, communityCards.getCards()).value
                if (handValue > highestScoringPlayerHand) {
                    winner = player
                    highestScoringPlayerHand = handValue
                }
            }
        });
        message.channel.send("The winner is: " + winner.name)
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

    /*
        Gets a player's action input for a round. Player is selected by i parameter.
     */
    async getPlayerInput(message, players, i, actionHandler){
        console.log("Current iteration of the player loop: " + players[i]);
        //awaitMessages has to resolve as a collection of messages which is why they are processed after the await
        let response = await message.channel.awaitMessages(msg => {
            //todo this match may not be the best way to handle things. May need to use the specific user ID
            //going to leave it as matching via name for now but could extend player object to include discord ID to match off of
            if(msg.author.username === players[i].name) {
                let strMsg = "" + msg + "";
                console.log("action: " + actionHandler.validateAction(strMsg, players[i]));
                if (actionHandler.validateAction(strMsg, players[i])) {
                    console.log("got here: " + players[i].name);
                    return strMsg;
                } else {
                    message.channel.send("That is not an accurate command. Use this command to have rules DM'd " +
                        "to you.");
                }
            }
        }, {max: 1})

        let strResponse = "" + response.entries().next().value + ""
        console.log("Here's the response: " + response.entries().next().value)
        let finalResponse = strResponse.substring(strResponse.indexOf(",") + 1)
        actionHandler.executeAction(finalResponse, players[i])
        console.log("Logging player's money and last bet information for: " + players[i].name)
        console.log(players[i].getChips())
        console.log(players[i].getLastBet())
        console.log(actionHandler.pot)
    }

    /*
        If a player did not bet the current highest bet, prompts that player for a call to the raise or fold.
     */
    async handleRaise(message, players, rightOfTheDealer, actionHandler){
        let highestBet = actionHandler.highestBet;
        for(let i = rightOfTheDealer; i < players.length; i ++){
            if(players[i].getLastBet() < highestBet){
                message.channel.send(players[i] + ", you need to call or fold to stay in the game. What will it be?")
                //kind of a hacky solution, but only call or fold will work at this point by design
                await this.getPlayerInput(message, players, rightOfTheDealer, actionHandler)
            }
        }
    }

}



module.exports = startTexasHoldEmCommand