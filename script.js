class WordleGame {
    constructor() {
        this.DEBUG_MODE = true; // Set to false to disable debug display
        this.GIFT_MODE = true; // Christmas gift game mode
        this.TARGET_WORDS = ['EARTH', 'LILAC', 'TEETH']; // Gift words to guess
        this.words = [];
        this.wordsLoaded = false;
        this.currentWord = '';
        this.currentRow = 0;
        this.currentCol = 0;
        this.gameOver = false;
        this.guesses = Array(6).fill().map(() => Array(5).fill(''));
        this.solvedWords = this.loadSolvedWords();
        this.giftComplete = false;
        
        this.loadWords();
    }

    loadSolvedWords() {
        const saved = localStorage.getItem('wordle-solved-words');
        return saved ? JSON.parse(saved) : [];
    }

    saveSolvedWords() {
        localStorage.setItem('wordle-solved-words', JSON.stringify(this.solvedWords));
    }

    addSolvedWord(word, attempts) {
        const existingIndex = this.solvedWords.findIndex(item => item.word === word);
        if (existingIndex >= 0) {
            // Update existing entry if attempts are better
            if (attempts < this.solvedWords[existingIndex].attempts) {
                this.solvedWords[existingIndex].attempts = attempts;
            }
        } else {
            // Add new solved word
            this.solvedWords.push({ word, attempts, date: new Date().toISOString() });
        }
        this.saveSolvedWords();
        this.updateWordsDisplay();
        
        // Check if gift is complete
        if (this.GIFT_MODE) {
            this.checkGiftCompletion();
        }
    }

    updateWordsDisplay() {
        const wordsList = document.getElementById('words-list');
        const wordsCount = document.getElementById('words-count');
        const avgGuesses = document.getElementById('avg-guesses');
        
        if (this.GIFT_MODE) {
            // Show gift mode progress
            const solvedTargetWords = this.solvedWords.map(item => item.word);
            const giftWords = this.TARGET_WORDS.map(word => {
                const solved = this.solvedWords.find(item => item.word === word);
                return {
                    word,
                    solved: !!solved,
                    attempts: solved ? solved.attempts : 0
                };
            });
            
            wordsList.innerHTML = giftWords.map(item => 
                `<div class="word-entry ${item.solved ? 'solved' : 'unsolved'}">
                    <span class="word-text">${item.solved ? item.word : '?????'}</span>
                    <span class="word-attempts">${item.solved ? `${item.attempts}/6` : '---'}</span>
                </div>`
            ).join('');
            
            wordsCount.textContent = `${solvedTargetWords.length}/3`;
            
            if (solvedTargetWords.length > 0) {
                const totalAttempts = this.solvedWords
                    .filter(item => this.TARGET_WORDS.includes(item.word))
                    .reduce((sum, item) => sum + item.attempts, 0);
                const average = (totalAttempts / solvedTargetWords.length).toFixed(1);
                avgGuesses.textContent = average;
            } else {
                avgGuesses.textContent = '0';
            }
            return;
        }
        
        // Regular mode display (unchanged)
        if (this.solvedWords.length === 0) {
            wordsList.innerHTML = '<p class="empty-state">Start playing to see your solved words!</p>';
            wordsCount.textContent = '0';
            avgGuesses.textContent = '0';
            return;
        }
        
        // Sort by date (most recent first)
        const sortedWords = [...this.solvedWords].sort((a, b) => new Date(b.date) - new Date(a.date));
        
        wordsList.innerHTML = sortedWords.map(item => 
            `<div class="word-entry">
                <span class="word-text">${item.word}</span>
                <span class="word-attempts">${item.attempts}/6</span>
            </div>`
        ).join('');
        
        // Update stats
        wordsCount.textContent = this.solvedWords.length;
        const totalAttempts = this.solvedWords.reduce((sum, item) => sum + item.attempts, 0);
        const average = (totalAttempts / this.solvedWords.length).toFixed(1);
        avgGuesses.textContent = average;
    }

    updateDebugDisplay() {
        const debugSection = document.getElementById('debug-section');
        const debugWord = document.getElementById('debug-word');
        
        if (this.DEBUG_MODE && debugSection && debugWord) {
            debugSection.classList.remove('hidden');
            debugWord.textContent = this.currentWord || '---';
        } else if (debugSection) {
            debugSection.classList.add('hidden');
        }
    }

    checkGiftCompletion() {
        const solvedTargetWords = this.solvedWords.map(item => item.word);
        const allTargetsSolved = this.TARGET_WORDS.every(word => solvedTargetWords.includes(word));
        
        if (allTargetsSolved && !this.giftComplete) {
            this.giftComplete = true;
            setTimeout(() => {
                this.showGiftCompletionModal();
            }, 2000);
        }
    }

    autoTransitionToNextWord() {
        if (this.GIFT_MODE) {
            // Check if all words are complete
            const solvedTargetWords = this.solvedWords.map(item => item.word);
            const allTargetsSolved = this.TARGET_WORDS.every(word => solvedTargetWords.includes(word));
            
            if (allTargetsSolved) {
                // All words solved, gift completion will be handled by checkGiftCompletion
                this.gameOver = true;
                return;
            }
        }
        
        // Show brief success message
        this.showMessage(`Great! "${this.currentWord}" found! Next word loading...`);
        
        // Reset game state and start new game immediately
        setTimeout(() => {
            // Force reset game state
            this.gameOver = false;
            this.currentRow = 0;
            this.currentCol = 0;
            this.guesses = Array(6).fill().map(() => Array(5).fill(''));
            
            // Clear the board
            const tiles = document.querySelectorAll('.tile');
            tiles.forEach(tile => {
                tile.textContent = '';
                tile.classList.remove('filled', 'correct', 'present', 'absent', 'shake');
            });
            
            // Reset keyboard
            this.resetKeyboard();
            
            // Get new word and update debug
            this.currentWord = this.getRandomWord();
            this.updateDebugDisplay();
            
            console.log('Auto-transitioned to new word:', this.currentWord);
        }, 2000);
    }

    showGiftCompletionModal() {
        const modal = document.getElementById('modal');
        const modalTitle = document.getElementById('modal-title');
        const modalMessage = document.getElementById('modal-message');
        
        modalTitle.textContent = '🎁 Words Unlocked! 🎁';
        modalMessage.innerHTML = `Congratulations! You've found all three words:<br><br>
            <strong>EARTH</strong>, <strong>LILAC</strong>, <strong>TEETH</strong><br><br>
            Now let's arrange these letters to reveal your Christmas gift!`;
        
        // Change the button to start word arranging
        const newGameBtn = document.getElementById('new-game-btn');
        newGameBtn.textContent = 'Start Letter Game';
        newGameBtn.onclick = () => {
            this.startWordArrangingGame();
            modal.classList.add('hidden');
        };
        
        modal.classList.remove('hidden');
    }

    async loadWords() {
        try {
            const response = await fetch('valid-wordle-words.txt');
            const text = await response.text();
            this.words = text.trim().split('\n').map(word => word.toUpperCase());
            this.wordsLoaded = true;
            this.currentWord = this.getRandomWord();
            this.initializeGame();
            this.addEventListeners();
            this.updateDebugDisplay();
            console.log('Current word:', this.currentWord); // For debugging
        } catch (error) {
            console.error('Error loading words:', error);
            // Fallback to a few basic words if file loading fails
            this.words = ['ABOUT', 'HOUSE', 'WORLD', 'GREAT', 'RIGHT', 'THINK', 'PLACE', 'WATER', 'WHERE', 'FIRST'];
            this.wordsLoaded = true;
            this.currentWord = this.getRandomWord();
            this.initializeGame();
            this.addEventListeners();
        }
    }

    getRandomWord() {
        if (this.GIFT_MODE) {
            // Get words that haven't been solved yet
            const solvedTargetWords = this.solvedWords.map(item => item.word);
            const unsolvedWords = this.TARGET_WORDS.filter(word => !solvedTargetWords.includes(word));
            
            if (unsolvedWords.length === 0) {
                this.giftComplete = true;
                return this.TARGET_WORDS[0]; // Return any word as fallback
            }
            
            return unsolvedWords[Math.floor(Math.random() * unsolvedWords.length)];
        }
        
        if (this.words.length === 0) return '';
        return this.words[Math.floor(Math.random() * this.words.length)];
    }

    initializeGame() {
        this.createGameBoard();
        this.resetKeyboard();
        this.updateWordsDisplay();
        this.updateDebugDisplay();
    }

    createGameBoard() {
        const gameBoard = document.getElementById('game-board');
        gameBoard.innerHTML = '';
        
        for (let i = 0; i < 6; i++) {
            const row = document.createElement('div');
            row.className = 'row';
            
            for (let j = 0; j < 5; j++) {
                const tile = document.createElement('div');
                tile.className = 'tile';
                tile.id = `tile-${i}-${j}`;
                row.appendChild(tile);
            }
            
            gameBoard.appendChild(row);
        }
    }

    addEventListeners() {
        // Keyboard event listeners
        document.addEventListener('keydown', (e) => {
            if (this.gameOver) return;
            
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
        const keyboardButtons = document.querySelectorAll('#keyboard button');
        keyboardButtons.forEach(button => {
            button.addEventListener('click', () => {
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

        // New game button event listener
        document.getElementById('new-game-btn').addEventListener('click', () => {
            this.newGame();
        });

        // Debug reset button event listener
        document.getElementById('reset-game-btn').addEventListener('click', () => {
            this.resetAllProgress();
        });
    }

    addLetter(letter) {
        if (this.gameOver) return; // Prevent input during transitions
        
        if (this.currentCol < 5 && this.currentRow < 6) {
            const tile = document.getElementById(`tile-${this.currentRow}-${this.currentCol}`);
            tile.textContent = letter;
            tile.classList.add('filled');
            this.guesses[this.currentRow][this.currentCol] = letter;
            this.currentCol++;
        }
    }

    deleteLetter() {
        if (this.gameOver) return; // Prevent input during transitions
        
        if (this.currentCol > 0) {
            this.currentCol--;
            const tile = document.getElementById(`tile-${this.currentRow}-${this.currentCol}`);
            tile.textContent = '';
            tile.classList.remove('filled');
            this.guesses[this.currentRow][this.currentCol] = '';
        }
    }

    submitGuess() {
        if (this.gameOver) return; // Prevent submission during transitions
        if (this.currentCol !== 5) {
            this.showMessage('Not enough letters');
            this.shakeRow();
            return;
        }

        const guess = this.guesses[this.currentRow].join('');
        
        // Check if word is in word list (simple validation)
        if (!this.isValidWord(guess)) {
            this.showMessage('Not in word list');
            this.shakeRow();
            return;
        }

        this.checkGuess(guess, this.currentRow);
        this.updateKeyboard(guess);

        if (guess === this.currentWord) {
            this.addSolvedWord(this.currentWord, this.currentRow + 1);
            
            // Show success animation, then auto-transition to next word
            setTimeout(() => {
                this.autoTransitionToNextWord();
            }, 1500);
        } else if (this.currentRow === 5) {
            this.gameOver = true;
            setTimeout(() => {
                this.showGameOverModal(false, `Game Over! The word was "${this.currentWord}". Better luck next time!`);
            }, 1500);
        }

        this.currentRow++;
        this.currentCol = 0;
    }

    isValidWord(word) {
        return this.wordsLoaded && this.words.includes(word.toUpperCase());
    }

    checkGuess(guess, rowIndex) {
        const wordArray = this.currentWord.split('');
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
                const tile = document.getElementById(`tile-${rowIndex}-${index}`);
                tile.classList.add(status);
            }, index * 100);
        });
    }

    updateKeyboard(guess) {
        const wordArray = this.currentWord.split('');
        const guessArray = guess.split('');
        
        guessArray.forEach((letter, index) => {
            const keyButton = document.querySelector(`button[data-key="${letter}"]`);
            if (!keyButton) return;
            
            if (letter === wordArray[index]) {
                keyButton.classList.remove('present', 'absent');
                keyButton.classList.add('correct');
            } else if (this.currentWord.includes(letter) && !keyButton.classList.contains('correct')) {
                keyButton.classList.remove('absent');
                keyButton.classList.add('present');
            } else if (!keyButton.classList.contains('correct') && !keyButton.classList.contains('present')) {
                keyButton.classList.add('absent');
            }
        });
    }

    shakeRow() {
        for (let i = 0; i < 5; i++) {
            const tile = document.getElementById(`tile-${this.currentRow}-${i}`);
            tile.classList.add('shake');
            setTimeout(() => {
                tile.classList.remove('shake');
            }, 500);
        }
    }

    showMessage(message) {
        const messageElement = document.getElementById('message');
        messageElement.textContent = message;
        messageElement.classList.remove('hidden');
        
        setTimeout(() => {
            messageElement.classList.add('hidden');
        }, 2000);
    }

    showGameOverModal(won, message) {
        const modal = document.getElementById('modal');
        const modalTitle = document.getElementById('modal-title');
        const modalMessage = document.getElementById('modal-message');
        
        modalTitle.textContent = won ? 'Congratulations!' : 'Game Over';
        modalMessage.textContent = message;
        modal.classList.remove('hidden');
    }

    resetKeyboard() {
        const keyboardButtons = document.querySelectorAll('#keyboard button');
        keyboardButtons.forEach(button => {
            button.classList.remove('correct', 'present', 'absent');
        });
    }

    newGame() {
        if (!this.wordsLoaded) {
            console.log('Words not loaded yet, please wait...');
            return;
        }
        
        if (this.GIFT_MODE && this.giftComplete) {
            console.log('Gift already complete! All words have been solved.');
            return;
        }
        
        // Get next word
        this.currentWord = this.getRandomWord();
        
        // Reset game state
        this.currentRow = 0;
        this.currentCol = 0;
        this.gameOver = false;
        this.guesses = Array(6).fill().map(() => Array(5).fill(''));
        
        // Clear the board
        const tiles = document.querySelectorAll('.tile');
        tiles.forEach(tile => {
            tile.textContent = '';
            tile.classList.remove('filled', 'correct', 'present', 'absent', 'shake');
        });
        
        this.resetKeyboard();
        
        // Hide modal if it's showing
        document.getElementById('modal').classList.add('hidden');
        
        this.updateDebugDisplay();
        console.log('New word:', this.currentWord); // For debugging
    }

    resetAllProgress() {
        if (confirm('Are you sure you want to reset all progress? This will clear all solved words and start over.')) {
            // Clear localStorage
            localStorage.removeItem('wordle-solved-words');
            
            // Reset game state
            this.solvedWords = [];
            this.giftComplete = false;
            this.gameOver = false;
            
            // Reset board and display
            this.currentRow = 0;
            this.currentCol = 0;
            this.guesses = Array(6).fill().map(() => Array(5).fill(''));
            
            // Clear the board
            const tiles = document.querySelectorAll('.tile');
            tiles.forEach(tile => {
                tile.textContent = '';
                tile.classList.remove('filled', 'correct', 'present', 'absent', 'shake');
            });
            
            // Reset keyboard
            this.resetKeyboard();
            
            // Get a new word
            this.currentWord = this.getRandomWord();
            
            // Update all displays
            this.updateWordsDisplay();
            this.updateDebugDisplay();
            
            // Hide any modals
            document.getElementById('modal').classList.add('hidden');
            
            console.log('Game progress reset! New word:', this.currentWord);
        }
    }

    startWordArrangingGame() {
        // Hide the wordle game and show word arranging game
        document.querySelector('.game-section').style.display = 'none';
        document.querySelector('header h1').textContent = '🎁 LETTER ARRANGING 🎄';
        
        this.createWordArrangingInterface();
    }

    createWordArrangingInterface() {
        const container = document.querySelector('.container');
        
        // Create word arranging game HTML
        const wordGameHTML = `
            <div id="word-arranging-game" class="word-arranging-game">
                <div class="target-pattern">
                    <h2>Arrange the letters to spell:</h2>
                    <div class="pattern-container">
                        <div class="word-pattern">
                            <div class="letter-slot" data-target="0"></div>
                            <div class="letter-slot" data-target="1"></div>
                            <div class="letter-slot" data-target="2"></div>
                            <div class="letter-slot" data-target="3"></div>
                            <div class="letter-slot" data-target="4"></div>
                        </div>
                        <div class="word-separator">-</div>
                        <div class="word-pattern">
                            <div class="letter-slot" data-target="5"></div>
                            <div class="letter-slot" data-target="6"></div>
                            <div class="letter-slot" data-target="7"></div>
                        </div>
                        <div class="word-separator">-</div>
                        <div class="word-pattern">
                            <div class="letter-slot" data-target="8"></div>
                            <div class="letter-slot" data-target="9"></div>
                            <div class="letter-slot" data-target="10"></div>
                            <div class="letter-slot" data-target="11"></div>
                            <div class="letter-slot" data-target="12"></div>
                            <div class="letter-slot" data-target="13"></div>
                            <div class="letter-slot" data-target="14"></div>
                        </div>
                    </div>
                </div>
                
                <div class="letters-pool">
                    <h3>Available Letters:</h3>
                    <div class="letters-container" id="letters-container">
                        <!-- Letters will be added by JavaScript -->
                    </div>
                </div>
                
                <div class="word-arranging-buttons">
                    <button id="check-arrangement">Check Answer</button>
                    <button id="reset-arrangement">Reset Letters</button>
                </div>
            </div>
        `;
        
        // Insert after the game layout
        container.insertAdjacentHTML('beforeend', wordGameHTML);
        
        this.initializeLetters();
        this.addDragDropListeners();
    }

    initializeLetters() {
        const letters = 'EARTHLILACTEETH'.split('');
        const container = document.getElementById('letters-container');
        
        letters.forEach((letter, index) => {
            const letterElement = document.createElement('div');
            letterElement.className = 'draggable-letter';
            letterElement.textContent = letter;
            letterElement.draggable = true;
            letterElement.dataset.letter = letter;
            letterElement.dataset.originalIndex = index;
            container.appendChild(letterElement);
        });
    }

    addDragDropListeners() {
        const letters = document.querySelectorAll('.draggable-letter');
        const slots = document.querySelectorAll('.letter-slot');
        
        // Add drag listeners to letters
        letters.forEach(letter => {
            letter.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', e.target.dataset.letter);
                e.dataTransfer.setData('element-id', e.target.dataset.originalIndex);
            });
        });
        
        // Add drop listeners to slots
        slots.forEach(slot => {
            slot.addEventListener('dragover', (e) => {
                e.preventDefault();
                slot.classList.add('drag-over');
            });
            
            slot.addEventListener('dragleave', (e) => {
                slot.classList.remove('drag-over');
            });
            
            slot.addEventListener('drop', (e) => {
                e.preventDefault();
                slot.classList.remove('drag-over');
                
                const letter = e.dataTransfer.getData('text/plain');
                const elementId = e.dataTransfer.getData('element-id');
                const sourceElement = document.querySelector(`[data-original-index="${elementId}"]`);
                
                // If slot is already occupied, return letter to pool
                if (slot.textContent) {
                    const existingLetter = slot.textContent;
                    this.returnLetterToPool(existingLetter);
                }
                
                // Place letter in slot
                slot.textContent = letter;
                slot.dataset.filled = 'true';
                
                // Hide the draggable element
                if (sourceElement) {
                    sourceElement.style.display = 'none';
                }
            });
            
            // Double click to remove letter from slot
            slot.addEventListener('dblclick', (e) => {
                if (slot.textContent) {
                    this.returnLetterToPool(slot.textContent);
                    slot.textContent = '';
                    slot.dataset.filled = 'false';
                }
            });
        });
        
        // Add button listeners
        document.getElementById('check-arrangement').addEventListener('click', () => {
            this.checkArrangement();
        });
        
        document.getElementById('reset-arrangement').addEventListener('click', () => {
            this.resetArrangement();
        });
    }

    returnLetterToPool(letter) {
        const letters = document.querySelectorAll('.draggable-letter');
        for (const letterEl of letters) {
            if (letterEl.textContent === letter && letterEl.style.display === 'none') {
                letterEl.style.display = 'block';
                break;
            }
        }
    }

    checkArrangement() {
        const slots = document.querySelectorAll('.letter-slot');
        let currentWord = '';
        
        slots.forEach(slot => {
            currentWord += slot.textContent || '_';
        });
        
        const targetPhrase = 'CHILLEATTHEATRE';
        
        if (currentWord === targetPhrase) {
            this.showFinalGiftModal();
        } else {
            this.showMessage('Not quite right! Keep arranging the letters.');
        }
    }

    resetArrangement() {
        const slots = document.querySelectorAll('.letter-slot');
        const letters = document.querySelectorAll('.draggable-letter');
        
        // Clear all slots
        slots.forEach(slot => {
            slot.textContent = '';
            slot.dataset.filled = 'false';
        });
        
        // Show all letters
        letters.forEach(letter => {
            letter.style.display = 'block';
        });
    }

    showFinalGiftModal() {
        const modal = document.getElementById('modal');
        const modalTitle = document.getElementById('modal-title');
        const modalMessage = document.getElementById('modal-message');
        
        modalTitle.textContent = '🎄 CHRISTMAS GIFT REVEALED! 🎄';
        modalMessage.innerHTML = `Amazing! You've spelled out:<br><br>
            <strong style="font-size: 1.5em; color: #538d4e;">CHILL - EAT - THEATRE</strong><br><br>
            Your Christmas gift is about taking time to:<br>
            🧘‍♀️ <strong>CHILL</strong> and relax<br>
            🍽️ <strong>EAT</strong> delicious food<br>
            🎭 <strong>THEATRE</strong> and enjoy the arts<br><br>
            Merry Christmas! 🎁✨`;
        
        const newGameBtn = document.getElementById('new-game-btn');
        newGameBtn.textContent = 'Play Again';
        newGameBtn.onclick = () => {
            location.reload();
        };
        
        modal.classList.remove('hidden');
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const game = new WordleGame();
});