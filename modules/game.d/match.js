class Match {
    /**
     * 
     * @param {import('./character')} player1 
     * @param {import('./character')} player2 
     * @param {import('discord.js').Channel} channel 
     */
    constructor(player1, player2, channel) {
        this.players = [player1, player2];
        this.turn = 0;
        this.channel = channel;
    }
    startMatch() {
        for (const player of this.players) {
            player.startPvp();
        }
    }
    hasWinner() {
        for (const player of this.players) {
            if (!player.isAlive())
                return true;
        }
        return false;
    }
    getMatchResult() {
        /** @type {{winners: import('./character')[], losers: import('./character')[]}} */
        const result = {
            winners: [],
            losers: []
        };
        for (const player of this.players) {
            if (player.isAlive()) {
                result.winners.push(player);
            } else {
                result.losers.push(player);
            }

        }
        return result;
    }
    endMatch() {
        if (this.hasWinner()) {
            const { winners, losers } = this.getMatchResult();
            for (const player of winners) {
                player.addWin();
            }
            for (const player of losers) {
                player.addLose();
            }
            this.channel.send(`Winners:${winners.join(' ')}\nLosers:${losers.join(' ')}`);
        }
        for (const player of this.players) {
            player.endPvP();
            player.resetHealth();
        }
    }
    nextTurn() {
        this.turn = (this.turn + 1) % this.players.length;
    }
    /**
     * 
     * @param {string} id 
     */
    findPlayer(id) {
        for (const player of this.players) {
            if (player.getUser().id === id)
                return player;
        }
        return null;
    }
    /**
     * 
     * @param {import('./character')} member 
     */
    isTurn(member) {
        return this.players[this.turn] === member;
    }
    getTurnName() {
        return this.players[this.turn].getName();
    }
    /**
     * 
     * @param {import('./character')} target 
     * @param {string} attackName 
     */
    attackSequence(target, attackName) {
        const playerTurn = this.players[this.turn];
        const playerName = playerTurn.getName();
        const targetName = target.getName();
        const attackInfo = playerTurn.attack(target, attackName);
        this.channel.send(`${playerName} attacks ${targetName}. \n${targetName} recieves ${attackInfo.damage}`);
    }
}
module.exports = Match;