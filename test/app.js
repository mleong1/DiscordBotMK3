const { TexasHoldEmPokerGameType, Player, PokerScoreService, Hand} = require('typedeck')
const deck = new TexasHoldEmPokerGameType().createDeck()
const handScorer = new PokerScoreService()

deck.shuffle();
var players = []
var player1 = new Player('Mert')
var player2 = new Player('Andy')
players.push(player1)
players.push(player2)
var communityCards = new Hand()
deck.deal(player1.getHand(), 2)
deck.deal(player2.getHand(), 2)
deck.deal(communityCards, 3)
console.log("Deck has " + deck.getCount() + " remaining cards.")
console.log("Mert has this many cards: " + player1.getHand().getCards())
console.log(player2.name + " has this many cards: " + player2.getHand().getCards())
console.log("Community has this many cards: " + communityCards.getCards())
/*testing putting card arrays together
var playerHand = player1.getHand().getCards().concat(communityCards.getCards());
console.log(playerHand.length)
*/

/*
What the handtypes equate to:
PokerHandType[PokerHandType["HighCard"] = 0] = "HighCard";
    PokerHandType[PokerHandType["OnePair"] = 1] = "OnePair";
    PokerHandType[PokerHandType["TwoPair"] = 2] = "TwoPair";
    PokerHandType[PokerHandType["ThreeOfAKind"] = 3] = "ThreeOfAKind";
    PokerHandType[PokerHandType["Straight"] = 4] = "Straight";
    PokerHandType[PokerHandType["Flush"] = 5] = "Flush";
    PokerHandType[PokerHandType["FullHouse"] = 6] = "FullHouse";
    PokerHandType[PokerHandType["FourOfAKind"] = 7] = "FourOfAKind";
    PokerHandType[PokerHandType["StraightFlush"] = 8] = "StraightFlush";
    PokerHandType[PokerHandType["RoyalFlush"] = 9] = "RoyalFlush";
 */
console.log(handScorer.scoreHand(player1.hand, communityCards.getCards()).value)
console.log(handScorer.scoreHand(player2.hand, communityCards.getCards()).value)

function determineWinner(players, communityCards = [], handScorer) {
    var winner = players[0].name
    var highestScoringPlayerHand = 0
    players.forEach((player) => {
        var handValue = handScorer.scoreHand(player.hand, communityCards.getCards()).value
        if(handValue > highestScoringPlayerHand){
            winner = player.name
            highestScoringPlayerHand = handValue
        }
    });
    return winner
}

console.log(determineWinner(players, communityCards, handScorer))

//entries.values.next.value


