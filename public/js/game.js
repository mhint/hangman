function Player(id) {
    this.id = id
    this.score = 0
    this.wins = 0
}

const Game = {
    initialLives: 6,
    players: [],
    isPvP: false,
    currentPlayer: undefined,
    currentPlayerCanGuess: false,
    currentPlayerGuesses: [],
    currentPlayerLives: this.initialLives,
    currentWord: new Object,
    loadWords: async function() {
        const url = './json/words.json'
        let json = await fetch(url).then(response => {
            return response.json()
        }).then(obj => {
            return obj
        })
        return json
    },
    getLettersInSolution: function(word) {
        let solution = []
        word = word.toLowerCase()
        word = word.replace(/\s+/g, '')
        word = word.replace(/(.)(?=.*\1)/g, '')
        solution = word.split('').sort()
        return solution
    },
    getFormInput: function(word, category) {
        if (/^(?=.*[a-zA-Z])[a-zA-Z\s]*$/.test(word)) {
            this.currentWord = {
                solution: word.toLowerCase(),
                category: category.toLowerCase(),
                letters: this.getLettersInSolution(word)
            }
            this.UI.hideForm()
            this.currentPlayerCanGuess = true
            this.UI.displayCategory(this.currentWord.category, this.isPvP)
            this.UI.updateWord(this.currentWord.solution, this.currentPlayerGuesses)
            this.UI.resetAllKeys()
        } else {
            this.UI.flashInputField()
        }
    },
    newWord: async function() {
        await this.loadWords().then(words => {
            const randomCategory = Object.keys(words.category)[Math.floor(Math.random() * Object.keys(words.category).length)]
            const randomWord = words.category[randomCategory][Math.floor(Math.random() * words.category[randomCategory].length)]
            const word = {
                solution: randomWord,
                category: randomCategory,
                letters: this.getLettersInSolution(randomWord)
            }
            this.currentWord = word
        })
    },
    new: function() {
        this.isPvP = false
        this.players = []
        this.players.push(new Player(1))
        this.currentPlayer = this.players[0]
        this.resetWord()
        this.UI.startGame()
    },
    newPvP: function() {
        this.isPvP = true
        this.players = []
        this.players.push(new Player(1))
        this.players.push(new Player(2))
        this.currentPlayer = this.players[1]
        this.resetWordPvP()
        this.UI.startGamePvP()
    },
    resetWord: function() {
        this.UI.hideForm()
        this.currentPlayerGuesses = []
        this.currentPlayerLives = this.initialLives
        this.UI.resetLives()
        this.newWord().then(() => {
            this.currentPlayerCanGuess = true
            this.UI.displayCategory(this.currentWord.category, this.isPvP)
            this.UI.updateWord(this.currentWord.solution, this.currentPlayerGuesses)
            this.UI.resetAllKeys()
        })
    },
    resetWordPvP: function() {
        if (this.currentPlayer.id == 1) {
            this.currentPlayer = this.players[1]
            this.UI.updatePlayer(this.currentPlayer)
        } else {
            this.currentPlayer = this.players[0]
            this.UI.updatePlayer(this.currentPlayer)
        }
        this.UI.showForm()
        this.currentPlayerGuesses = []
        this.currentPlayerLives = this.initialLives
        this.UI.resetLives()
    },
    skipWord: function () {
        if (this.currentPlayerLives > 2) {
            this.currentPlayerGuesses = []
            this.currentPlayerLives -= 2
            this.UI.updateLives(this.currentPlayerLives)
            this.newWord().then(() => {
                this.currentPlayerCanGuess = true
                this.UI.displayCategory(this.currentWord.category, this.isPvP)
                this.UI.updateWord(this.currentWord.solution, this.currentPlayerGuesses)
                this.UI.resetAllKeys()
            })
        }
    },
    togglePvP: function() {
        if (Game.isPvP) {
            Game.new()
        } else {
            Game.newPvP()
        }
    },
    win: function() {
        const reset = this.isPvP ? () => this.resetWordPvP() : () => this.resetWord()
        this.UI.disableAllKeys()
        this.currentPlayerCanGuess = false
        this.currentPlayer.score += this.currentPlayerLives
        this.currentPlayer.wins += 1
        this.UI.updateScore(this.currentPlayer, this.isPvP)
        this.UI.displaySolutionOnWin(this.currentWord.solution)
        setTimeout(() => {
            reset()
        }, 1000)
    },
    lose: function() {
        const reset = this.isPvP ? () => this.resetWordPvP() : () => this.resetWord()
        this.UI.disableAllKeys()
        this.currentPlayerCanGuess = false
        this.UI.displaySolutionOnLoss(this.currentWord.solution)
        setTimeout(() => {
            reset()
        }, 1000)
    },
    guessLetter: function(key) {
        if (this.currentPlayerCanGuess == true) {
            this.UI.disableKey(key)
            if ($.inArray(key, this.currentWord.letters) != -1) {
                this.UI.keyIsCorrect(key)
                this.currentPlayerGuesses.push(key)
                this.currentPlayerGuesses.sort()
                this.UI.updateWord(this.currentWord.solution, this.currentPlayerGuesses)
                if (this.currentPlayerLives > 0) {
                    if (this.currentPlayerGuesses.toString() == this.currentWord.letters.toString()) {
                        this.win()
                    }
                }
            } else {
                this.UI.keyIsIncorrect(key)
                this.currentPlayerLives -= 1
                this.UI.updateLives(this.currentPlayerLives)
                if (this.currentPlayerLives == 0) {
                    this.lose()
                }
            }
        }
    },
    UI: {
        disableKey: function(key) {
            $(`#key-${key}`).prop("disabled", true)
        },
        disableAllKeys: function() {
            $(`.keys`).prop("disabled", true).addClass("key-incorrect")
        },
        displayCategory: function(category, isPvP) {
            if (!isPvP) {
                $('#category').html(`THE CATEGORY IS <b>${category.toUpperCase()}</b>`)
            } else {
                if (category != "") {
                    $('#category').html(`Hint: <b>${category.toUpperCase()}</b>`)
                } else {
                    $('#category').html("Guess the other player's word")
                }
            }
        },
        displaySolutionOnLoss: function(word) {
            this.revealWord(word)
            $('#word').addClass('solution-loss')
            setTimeout(() => {
                $('#word').removeClass('solution-loss')
            }, 1000)
        },
        displaySolutionOnWin: function(word) {
            this.revealWord(word)
            $('#word').addClass('solution-win')
            setTimeout(() => {
                $('#word').removeClass('solution-win')
            }, 1000)
        },
        keyIsCorrect: function(key) {
            $(`#key-${key}`).addClass("key-correct")
        },
        keyIsIncorrect: function(key) {
            $(`#key-${key}`).addClass("key-incorrect")
        },
        resetAllKeys: function () {
            $(`.keys`).prop("disabled", false).removeClass("key-correct").removeClass("key-incorrect")
        },
        resetLives: function () {
            $('.hearts').removeClass("heart-fallen")
            $('#word-skip-button').prop("disabled", false)
        },
        revealWord: function(word) {
            let displayWord = ''
            for (var i = 0; i < word.length; i++) {
                let currentLetter = undefined
                if (word[i] != ' ') {
                    currentLetter = word[i].toUpperCase()
                } else {
                    currentLetter = '&nbsp;'
                }
                displayWord += currentLetter
            }
            $("#word").html(displayWord)
            setTimeout(function() {}, 800)
        },
        startGame: function() {
            $("#pvp-button").html("<i class='material-icons'>group</i><span>1v1</span>")
            $("#score").css({"display": "block"})
            $('#score').html("SCORE: 0")
            $("#words-guessed").css({"display": "block"})
            $('#words-guessed').html("WORDS GUESSED: 0")
            $("#player-one-score").css({"display": "none"})
            $("#player-two-score").css({"display": "none"})
            $("#category").css({"display": "block"})
            $("#content-bottom").css({"display": "flex"})
            $('#player-turn-text').css({"display": "none"})
            $('#info-two-player').css({"display": "none"})
        },
        startGamePvP: function() {
            $("#pvp-button").html("<i class='material-icons'>person</i><span>SOLO</span>")
            $("#score").css({"display": "none"})
            $("#words-guessed").css({"display": "none"})
            $("#player-one-score").css({"display": "block"})
            $('#player-one-score').html("PLAYER ONE: 0")
            $("#player-two-score").css({"display": "block"})
            $('#player-two-score').html("PLAYER TWO: 0")
            $('#player-turn-text').css({"display": "block"})
            $('#info-two-player').css({"display": "block"})
            $('#category').html("Hint:  ")
        },
        updateLives: function(lives) {
            let hearts = $('.hearts:not(.heart-fallen)').length
            if (lives < hearts) {
                for (let i = hearts; i > lives; i--) {
                    $(`#heart-${i}`).addClass("heart-fallen")
                }
            }
            if (lives <= 2) {
                $('#word-skip-button').prop("disabled", true)
            }
        },
        updateScore: function(player, isPvP) {
            if (!isPvP) {
                $('#score').html("SCORE: " + player.score)
                $('#words-guessed').html("WORDS GUESSED: " + player.wins)
            } else {
                if (player.id == 1) {
                    $('#player-one-score').html("PLAYER ONE: " + player.score)
                } else if (player.id == 2) {
                    $('#player-two-score').html("PLAYER TWO: " + player.score)
                }
            }
        },
        updatePlayer: function(player) {
            if (player.id == 1) {
                $("#form-container-player-text").html("Player 1 Guesses!")
                $("#player-turn-text").html("Player 1 Guesses!")
            } else if (player.id == 2) {
                $("#form-container-player-text").html("Player 2 Guesses!")
                $("#player-turn-text").html("Player 2 Guesses!")
            }
        },
        updateWord: function(word, guesses) {
            let displayWord = ''
            for (var i = 0; i < word.length; i++) {
                let currentLetter = undefined
                if ($.inArray(word[i], guesses) != -1) {
                    currentLetter = word[i].toUpperCase()
                } else if (word[i] == ' ') {
                    currentLetter = ' '
                } else {
                    currentLetter = '_'
                }
                displayWord += currentLetter
            }
            $("#word").html(displayWord)
        },
        showForm: function() {
            $("#content-top").css({"display": "none"})
            $("#input-container").css({"display": "flex"})
            $("#content-bottom").css({"display": "none"})
        },
        hideForm: function() {
            $("#input-word").val("")
            $("#input-category").val("")
            $("#content-top").css({"display": "flex"})
            $("#input-container").css({"display": "none"})
            $("#content-bottom").css({"display": "flex"})
        },
        flashInputField: function() {
            $("#input-word").css({"background": "#f57c7b", "transition": "0s ease-out"})
            setTimeout(() => {
                $("#input-word").css({"background": "#f5f5f5", "transition": "0.2s ease-out"})
            }, 200)
        }
    }
}
const Keys = "abcdefghijklmnopqrstuvwxyz"
for (let i = 0; i < Keys.length; i++) {
    const key = `<div class="key-container"><button type="button" class="keys" id="key-${Keys[i]}" onclick="Game.guessLetter('${Keys[i]}')">${Keys[i].toUpperCase()}</button></div>`
    $("#keyboard").append(key)
    if (Keys[i] == "m") $("#keyboard").append("<div></div>")
}
for (let i = 1; i <= Game.initialLives; i++) {
    const heart = `<i class="material-icons hearts" id="heart-${i}">favorite</i>`
    $("#health").append(heart)
}
Game.new()