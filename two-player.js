class TwoPlayerWordle {
    constructor() {
        this.words = [];
        this.wordsLoaded = false;
        this.currentPlayer = 1;
        this.gameActive = false;
        this.gamePhase = 'setting'; // 'setting' or 'guessing'
        
        // Player states
        this.players = {
            1: {
                targetWord: '', // Word that Player 2 will guess
                myTarget: '', // Word that Player 1 needs to guess (set by Player 2)
                currentRow: 0,
                currentCol: 0,
                gameOver: false,
                guesses: Array(6).fill().map(() => Array(5).fill('')),
                solvedWords: [],
                wordSet: false
            },
            2: {
                targetWord: '', // Word that Player 1 will guess  
                myTarget: '', // Word that Player 2 needs to guess (set by Player 1)
                currentRow: 0,
                currentCol: 0,
                gameOver: false,
                guesses: Array(6).fill().map(() => Array(5).fill('')),
                solvedWords: [],
                wordSet: false
            }
        };
        
        this.loadWords();
        this.initializeGame();
    }

    async loadWords() {
        try {
            const response = await fetch('valid-wordle-words.txt');
            const text = await response.text();
            this.words = text.trim().split('\n').map(word => word.toUpperCase());
            this.wordsLoaded = true;
            console.log('Words loaded successfully');
        } catch (error) {
            console.error('Error loading words:', error);
            // Fallback words
            this.words = ['ABOUT', 'HOUSE', 'WORLD', 'GREAT', 'RIGHT', 'THINK', 'PLACE', 'WATER', 'WHERE', 'FIRST'];
            this.wordsLoaded = true;
        }
    }

    initializeGame() {
        this.createGameBoards();
        this.addEventListeners();
        this.showSwitchScreen();
    }

    createGameBoards() {
        // Create Player 1 board
        this.createBoardForPlayer(1);
        // Create Player 2 board
        this.createBoardForPlayer(2);
    }

    createBoardForPlayer(playerNum) {
        const board = document.getElementById(`player${playerNum}-board`);
        board.innerHTML = '';
        
        for (let i = 0; i < 6; i++) {
            const row = document.createElement('div');
            row.className = 'row';
            
            for (let j = 0; j < 5; j++) {
                const tile = document.createElement('div');
                tile.className = 'tile';
                tile.id = `p${playerNum}-tile-${i}-${j}`;
                row.appendChild(tile);
            }
            
            board.appendChild(row);
        }
    }

    addEventListeners() {
        // Switch player button
        document.getElementById('switch-player-btn').addEventListener('click', () => {
            this.startPlayerTurn();
        });

        // New game button
        document.getElementById('new-game-btn').addEventListener('click', () => {
            this.newGame();
        });

        // Victory modal buttons
        document.getElementById('play-again-btn').addEventListener('click', () => {
            this.newGame();
        });

        document.getElementById('back-to-menu-btn').addEventListener('click', () => {
            window.location.href = 'index.html';
        });

        // Keyboard event listeners
        document.addEventListener('keydown', (e) => {
            if (!this.gameActive) return;
            
            const key = e.key.toUpperCase();
            
            if (key === 'ENTER') {
                this.submitGuess();
            } else if (key === 'BACKSPACE') {
                this.deleteLetter();
            } else if (key.match(/[A-Z]/) && key.length === 1) {
                this.addLetter(key);
            }
        });

        // On-screen keyboard event listeners
        const keyboardButtons = document.querySelectorAll('#shared-keyboard button');
        keyboardButtons.forEach(button => {
            button.addEventListener('click', () => {
                if (!this.gameActive) return;
                
                const key = button.getAttribute('data-key');
                
                if (key === 'ENTER') {
                    this.submitGuess();
                } else if (key === 'BACKSPACE') {
                    this.deleteLetter();
                } else {
                    this.addLetter(key);
                }
            });
        });
    }

    showSwitchScreen() {
        document.getElementById('switch-screen').classList.remove('hidden');
        document.getElementById('two-player-layout').classList.add('hidden');
        
        if (this.gamePhase === 'setting') {
            document.getElementById('switch-message').textContent = `Player ${this.currentPlayer}: Choose a word for your opponent`;
        } else {
            document.getElementById('switch-message').textContent = `Player ${this.currentPlayer}'s Turn to Guess`;
        }
        
        this.gameActive = false;
    }

    startPlayerTurn() {
        document.getElementById('switch-screen').classList.add('hidden');
        document.getElementById('two-player-layout').classList.remove('hidden');
        
        // Show current player's board, hide the other
        document.getElementById('player1-game').classList.toggle('hidden', this.currentPlayer !== 1);
        document.getElementById('player2-game').classList.toggle('hidden', this.currentPlayer !== 2);
        
        // Update player indicator based on phase
        if (this.gamePhase === 'setting') {
            document.getElementById('current-player-indicator').textContent = `Player ${this.currentPlayer}: Set opponent's word`;
        } else {
            document.getElementById('current-player-indicator').textContent = `Player ${this.currentPlayer}: Guess the word`;
        }
        
        this.gameActive = true;
        this.resetKeyboard();
    }

    endTurn() {
        this.gameActive = false;
        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
        
        // Update switch screen message
        document.getElementById('switch-message').textContent = `Player ${this.currentPlayer}'s Turn`;
        document.getElementById('switch-player-btn').textContent = 'Continue Playing';
        
        this.showSwitchScreen();
    }

    addLetter(letter) {
        if (!this.gameActive) return;
        
        const player = this.players[this.currentPlayer];
        
        if (player.currentCol < 5 && player.currentRow < 6) {
            const tile = document.getElementById(`p${this.currentPlayer}-tile-${player.currentRow}-${player.currentCol}`);
            tile.textContent = letter;
            tile.classList.add('filled');
            player.guesses[player.currentRow][player.currentCol] = letter;
            player.currentCol++;
        }
    }

    deleteLetter() {
        if (!this.gameActive) return;
        
        const player = this.players[this.currentPlayer];
        
        if (player.currentCol > 0) {
            player.currentCol--;
            const tile = document.getElementById(`p${this.currentPlayer}-tile-${player.currentRow}-${player.currentCol}`);
            tile.textContent = '';
            tile.classList.remove('filled');
            player.guesses[player.currentRow][player.currentCol] = '';
        }
    }

    submitGuess() {
        if (!this.gameActive) return;
        
        const player = this.players[this.currentPlayer];
        
        if (player.currentCol !== 5) {
            this.showMessage('Not enough letters', this.currentPlayer);
            this.shakeRow(this.currentPlayer, player.currentRow);
            return;
        }

        const guess = player.guesses[player.currentRow].join('');
        
        if (!this.isValidWord(guess)) {
            this.showMessage('Not in word list', this.currentPlayer);
            this.shakeRow(this.currentPlayer, player.currentRow);
            return;
        }

        if (this.gamePhase === 'setting') {
            // Player is setting a word for opponent to guess
            player.targetWord = guess;
            player.wordSet = true;
            
            // Set as opponent's target
            const opponent = this.currentPlayer === 1 ? 2 : 1;
            this.players[opponent].myTarget = guess;
            
            this.showMessage(`Word set! This will be your first guess too`, this.currentPlayer);
            
            // Keep this word as their first guess - move to next row
            player.currentRow = 1;
            player.currentCol = 0;
            
            setTimeout(() => {
                // Check if both players have set words
                if (this.players[1].wordSet && this.players[2].wordSet) {
                    this.gamePhase = 'guessing';
                    
                    // Now evaluate both players' first guesses against their targets
                    [1, 2].forEach(playerNum => {
                        const p = this.players[playerNum];
                        const firstGuess = p.guesses[0].join('');
                        this.checkGuess(firstGuess, 0, playerNum, p.myTarget);
                    });
                    
                    // Update keyboard for both players' first guesses
                    this.updateKeyboardForBothPlayers();
                    
                    this.currentPlayer = 1; // Start with player 1 for guessing phase
                } else {
                    this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
                }
                
                this.showSwitchScreen();
            }, 1500);
        } else {
            // Player is guessing opponent's word
            const targetWord = player.myTarget;
            
            this.checkGuess(guess, player.currentRow, this.currentPlayer, targetWord);
            this.updateKeyboardForBothPlayers();

            if (guess === targetWord) {
                player.solvedWords.push({
                    word: guess,
                    attempts: player.currentRow + 1,
                    date: new Date().toISOString()
                });
                
                this.showMessage(`Correct! You found "${guess}"`, this.currentPlayer);
                player.gameOver = true;
                
                setTimeout(() => {
                    this.showVictoryModal(guess);
                }, 2000);
            } else if (player.currentRow === 5) {
                player.gameOver = true;
                this.showMessage(`Game Over! The word was "${targetWord}"`, this.currentPlayer);
                
                setTimeout(() => {
                    this.endTurn();
                }, 2000);
            } else {
                player.currentRow++;
                player.currentCol = 0;
                
                setTimeout(() => {
                    this.endTurn();
                }, 1500);
            }
        }
    }

    clearPlayerBoard(playerNum) {
        for (let i = 0; i < 6; i++) {
            for (let j = 0; j < 5; j++) {
                const tile = document.getElementById(`p${playerNum}-tile-${i}-${j}`);
                tile.textContent = '';
                tile.classList.remove('filled', 'correct', 'present', 'absent', 'shake');
            }
        }
    }

    updateKeyboardForBothPlayers() {
        // Reset keyboard
        this.resetKeyboard();
        
        // Apply colors from both players' guesses
        [1, 2].forEach(playerNum => {
            const player = this.players[playerNum];
            if (player.myTarget) {
                for (let row = 0; row < player.currentRow + (playerNum === this.currentPlayer ? 1 : 0); row++) {
                    const guess = player.guesses[row]?.join('');
                    if (guess && guess.length === 5) {
                        this.updateKeyboard(guess, player.myTarget);
                    }
                }
            }
        });
    }


    showVictoryModal(winningWord) {
        const modal = document.getElementById('victory-modal');
        const statsDiv = document.getElementById('victory-stats');
        const titleElement = document.getElementById('victory-title');
        
        const winner = this.currentPlayer;
        const attempts = this.players[winner].currentRow + 1;
        
        titleElement.textContent = `🎉 Player ${winner} Wins! 🎉`;
        
        statsDiv.innerHTML = `
            <div class="victory-stat">
                <span><strong>Winning Word:</strong></span>
                <span>${winningWord}</span>
            </div>
            <div class="victory-stat">
                <span><strong>Attempts:</strong></span>
                <span>${attempts}/6</span>
            </div>
            <div class="victory-stat">
                <span><strong>Set by:</strong></span>
                <span>Player ${winner === 1 ? 2 : 1}</span>
            </div>
        `;
        
        modal.classList.remove('hidden');
    }

    isValidWord(word) {
        return this.wordsLoaded && this.words.includes(word.toUpperCase());
    }

    checkGuess(guess, rowIndex, playerNum, targetWord) {
        const wordArray = targetWord.split('');
        const guessArray = guess.split('');
        const result = Array(5).fill('absent');
        const wordLetterCount = {};
        
        // Count letters in the target word
        wordArray.forEach(letter => {
            wordLetterCount[letter] = (wordLetterCount[letter] || 0) + 1;
        });

        // First pass: mark correct letters
        guessArray.forEach((letter, index) => {
            if (letter === wordArray[index]) {
                result[index] = 'correct';
                wordLetterCount[letter]--;
            }
        });

        // Second pass: mark present letters
        guessArray.forEach((letter, index) => {
            if (result[index] !== 'correct' && wordLetterCount[letter] > 0) {
                result[index] = 'present';
                wordLetterCount[letter]--;
            }
        });

        // Apply colors to tiles with delay
        result.forEach((status, index) => {
            setTimeout(() => {
                const tile = document.getElementById(`p${playerNum}-tile-${rowIndex}-${index}`);
                tile.classList.add(status);
            }, index * 100);
        });
    }

    updateKeyboard(guess, targetWord) {
        const wordArray = targetWord.split('');
        const guessArray = guess.split('');
        
        guessArray.forEach((letter, index) => {
            const keyButton = document.querySelector(`button[data-key="${letter}"]`);
            if (!keyButton) return;
            
            if (letter === wordArray[index]) {
                keyButton.classList.remove('present', 'absent');
                keyButton.classList.add('correct');
            } else if (targetWord.includes(letter) && !keyButton.classList.contains('correct')) {
                keyButton.classList.remove('absent');
                keyButton.classList.add('present');
            } else if (!keyButton.classList.contains('correct') && !keyButton.classList.contains('present')) {
                keyButton.classList.add('absent');
            }
        });
    }

    shakeRow(playerNum, rowIndex) {
        for (let i = 0; i < 5; i++) {
            const tile = document.getElementById(`p${playerNum}-tile-${rowIndex}-${i}`);
            tile.classList.add('shake');
            setTimeout(() => {
                tile.classList.remove('shake');
            }, 500);
        }
    }

    showMessage(message, playerNum) {
        const messageElement = document.getElementById(`player${playerNum}-message`);
        messageElement.textContent = message;
        messageElement.classList.remove('hidden');
        
        setTimeout(() => {
            messageElement.classList.add('hidden');
        }, 2000);
    }

    resetKeyboard() {
        const keyboardButtons = document.querySelectorAll('#shared-keyboard button');
        keyboardButtons.forEach(button => {
            button.classList.remove('correct', 'present', 'absent');
        });
    }

    newGame() {
        // Reset all game state
        this.currentPlayer = 1;
        this.gameActive = false;
        this.gamePhase = 'setting';
        
        // Reset players
        Object.keys(this.players).forEach(playerNum => {
            this.players[playerNum] = {
                targetWord: '',
                myTarget: '',
                currentRow: 0,
                currentCol: 0,
                gameOver: false,
                guesses: Array(6).fill().map(() => Array(5).fill('')),
                solvedWords: [],
                wordSet: false
            };
        });
        
        // Clear boards
        [1, 2].forEach(playerNum => {
            this.clearPlayerBoard(playerNum);
        });
        
        // Reset keyboard
        this.resetKeyboard();
        
        // Hide modal and show switch screen
        document.getElementById('victory-modal').classList.add('hidden');
        this.showSwitchScreen();
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const game = new TwoPlayerWordle();
});