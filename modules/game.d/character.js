class Character {
    /**
     * 
     * @param {string} name 
     * @param {string} className 
     * @param {import('discord.js').User} User 
     */
    constructor(name, className, User) {
        this.name = name;
        this.className = className;
        this.level = 1;
        this.hp = 100;
        this.xp = 0;
        this.money = 0;
        this.user = User;
        this.inPvP = false;
        this.wins = 0;
        this.loses = 0;
    }
    getUser() {
        return this.user;
    }
    toString() {
        return `${this.name}`;
    }
    resetHealth() {
        this.hp = 100;
    }
    endPvP() {
        this.inPvP = false;
    }
    startPvP() {
        this.inPvP = true;
    }
    isInPvP() {
        return this.inPvP;
    }
    getStats() {
        let stats = '';
        for (const key in this) {
            if (this.hasOwnProperty(key)) {
                stats += (key + ': ' + this[key] + '\n');
            }
        }
        return stats;
    }
    /**
     * 
     * @param {number} level 
     * @param {boolean} showMessage 
     */
    addLevel(level, showMessage) {
        this.level += level;
        showMessage && this.user.send(`Wow! You are now level ${this.level}.`);
    }
    getName() {
        return this.name;
    }
    /**
     * 
     * @param {number} newXP 
     * @param {boolean} showMessage 
     */
    addXP(newXP, showMessage) {
        const levelUpXP = 1000;
        const newLevel = parseInt((this.xp + newXP) / levelUpXP);
        if (newLevel > 0)
            this.addLevel(newLevel, showMessage);
        this.xp += (this.xp + newXP) % levelUpXP;
        showMessage && this.user.send(`You got ${newXP} xp.`);
    }
    addWin() {
        this.wins += 1;
    }
    addLose() {
        this.loses += 1;
    }
    changeHp(deltaHp) {
        this.hp += deltaHp;
    }
    getHp() {
        return this.hp;
    }
    isAlive() {
        return this.hp > 0;
    }
    /**
     * 
     * @param {Character} target 
     */
    attack(target) {
        target.changeHp(-20);
        return {
            damage: 20
        };
    }
    static isValidName(name) {
        if (name.length > 10 || !name.length)
            return false;
    }
    static getClass(className) {
        const names = ['Spheromancer', 'Triblader', 'Quadroguard', 'Pentafist', 'Hexacast'];
        const lowerClassName = className.toLowerCase();
        const index = names.indexOf(lowerClassName[0].toUpperCase() + lowerClassName.substring(1));
        if (index > -1)
            return names[index];
        return null;
    }
}
module.exports = Character;