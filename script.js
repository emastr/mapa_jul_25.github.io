class WordleGame {
    constructor() {
        this.DEBUG_MODE = false; // Set to false to disable debug display
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
            this.showResetConfirmation();
        });

        // Debug confirmation button listeners
        document.getElementById('reset-yes-btn').addEventListener('click', () => {
            // Clear localStorage first, then reload page
            localStorage.removeItem('wordle-solved-words');
            location.reload();
        });

        document.getElementById('reset-no-btn').addEventListener('click', () => {
            this.cancelReset();
        });

        // Debug skip stage button listener
        document.getElementById('skip-stage-btn').addEventListener('click', () => {
            this.skipToLetterGame();
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

    showResetConfirmation() {
        document.getElementById('reset-normal').classList.add('hidden');
        document.getElementById('reset-confirm').classList.remove('hidden');
    }

    confirmReset() {
        this.resetAllProgress();
        this.hideResetConfirmation();
        
        // If we're in letter arranging mode, return to wordle mode
        if (document.getElementById('word-arranging-game')) {
            this.returnToWordleMode();
        }
    }

    cancelReset() {
        this.hideResetConfirmation();
    }

    hideResetConfirmation() {
        document.getElementById('reset-normal').classList.remove('hidden');
        document.getElementById('reset-confirm').classList.add('hidden');
    }

    skipToLetterGame() {
        // Mark all target words as solved for testing
        this.TARGET_WORDS.forEach((word, index) => {
            const attempts = index + 2; // Vary the attempts (2, 3, 4)
            if (!this.solvedWords.find(item => item.word === word)) {
                this.solvedWords.push({ 
                    word, 
                    attempts, 
                    date: new Date().toISOString() 
                });
            }
        });
        
        // Mark gift as complete
        this.giftComplete = true;
        
        // Save progress
        this.saveSolvedWords();
        
        // Update display
        this.updateWordsDisplay();
        
        // Start the letter arranging game directly
        this.startWordArrangingGame();
        
        console.log('Skipped to letter arranging game!');
    }
    
    returnToWordleMode() {
        // Restore the original game layout
        const gameLayout = document.querySelector('.game-layout');
        
        // Recreate the original wordle game HTML structure with correct IDs
        gameLayout.innerHTML = `
            <main class="game-section">
                <div id="game-board">
                    <!-- Game grid will be generated by JavaScript -->
                </div>
                
                <div id="keyboard">
                    <div class="keyboard-row">
                        <button data-key="Q">Q</button>
                        <button data-key="W">W</button>
                        <button data-key="E">E</button>
                        <button data-key="R">R</button>
                        <button data-key="T">T</button>
                        <button data-key="Y">Y</button>
                        <button data-key="U">U</button>
                        <button data-key="I">I</button>
                        <button data-key="O">O</button>
                        <button data-key="P">P</button>
                    </div>
                    <div class="keyboard-row">
                        <button data-key="A">A</button>
                        <button data-key="S">S</button>
                        <button data-key="D">D</button>
                        <button data-key="F">F</button>
                        <button data-key="G">G</button>
                        <button data-key="H">H</button>
                        <button data-key="J">J</button>
                        <button data-key="K">K</button>
                        <button data-key="L">L</button>
                    </div>
                    <div class="keyboard-row">
                        <button data-key="ENTER" class="wide-key">ENTER</button>
                        <button data-key="Z">Z</button>
                        <button data-key="X">X</button>
                        <button data-key="C">C</button>
                        <button data-key="V">V</button>
                        <button data-key="B">B</button>
                        <button data-key="N">N</button>
                        <button data-key="M">M</button>
                        <button data-key="BACKSPACE" class="wide-key">⌫</button>
                    </div>
                </div>
                
                <div id="message" class="hidden"></div>
            </main>
            
            <div id="modal" class="modal hidden">
                <div class="modal-content">
                    <h2 id="modal-title">Game Over</h2>
                    <p id="modal-message">Thanks for playing!</p>
                    <button id="new-game-btn">New Game</button>
                </div>
            </div>
        `;
        
        // Show the words section again
        document.querySelector('.words-section').style.display = 'block';
        
        // Reset the header
        document.querySelector('header h1').textContent = '🎄 CHRISTMAS WORDLE 🎁';
        
        // Reinitialize the game
        this.createGameBoard();
        this.resetKeyboard();
        this.updateWordsDisplay();
        this.updateDebugDisplay();
        
        // Re-add event listeners since we recreated the HTML
        this.addEventListeners();
        
        console.log('Returned to Wordle mode');
    }

    startWordArrangingGame() {
        // Hide the wordle game and show word arranging game
        document.querySelector('.game-section').style.display = 'none';
        document.querySelector('header h1').textContent = '🎁 LETTER ARRANGING 🎄';
        
        // Hide the words section temporarily 
        document.querySelector('.words-section').style.display = 'none';
        
        this.createWordArrangingInterface();
    }

    createWordArrangingInterface() {
        const gameLayout = document.querySelector('.game-layout');
        
        // Create word arranging game HTML with side-by-side layout
        const wordGameHTML = `
            <div class="word-arranging-layout">
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
                            <div class="word-pattern">
                                <div class="letter-slot" data-target="5"></div>
                                <div class="letter-slot" data-target="6"></div>
                                <div class="letter-slot" data-target="7"></div>
                            </div>
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
                        <div class="word-row">
                            <div class="word-label">EARTH:</div>
                            <div class="letters-row" id="earth-letters"></div>
                        </div>
                        <div class="word-row">
                            <div class="word-label">LILAC:</div>
                            <div class="letters-row" id="lilac-letters"></div>
                        </div>
                        <div class="word-row">
                            <div class="word-label">TEETH:</div>
                            <div class="letters-row" id="teeth-letters"></div>
                        </div>
                    </div>
                    
                    <div class="word-arranging-buttons">
                        <button id="check-arrangement">Check Answer</button>
                        <button id="reset-arrangement">Reset Letters</button>
                    </div>
                </div>
                
                ${this.DEBUG_MODE ? `
                <div class="debug-section-right">
                    <div class="debug-panel">
                        <div class="debug-info">
                            <div class="debug-item">
                                <strong>Current Arrangement:</strong>
                                <span id="current-arrangement">_______________</span>
                            </div>
                            <div class="debug-item">
                                <strong>Target:</strong>
                                <span>CHILLEATTHEATRE</span>
                            </div>
                        </div>
                        <div class="debug-controls">
                            <div id="reset-normal" class="reset-normal">
                                <button id="reset-game-btn" class="debug-button">Reset Game</button>
                                <button id="skip-stage-btn" class="debug-button skip-button" style="display: none;">Skip to Letters</button>
                                <button id="autofill-arrangement" class="debug-button autofill-button">🔧 Autofill Letters</button>
                            </div>
                            <div id="reset-confirm" class="reset-confirm hidden">
                                <p>Are you sure you want to reset all progress?</p>
                                <button id="reset-yes-btn" class="debug-button confirm-yes">Yes</button>
                                <button id="reset-no-btn" class="debug-button confirm-no">No</button>
                            </div>
                        </div>
                    </div>
                </div>
                ` : ''}
            </div>
        `;
        
        // Replace the entire game layout with the word arranging game
        gameLayout.innerHTML = wordGameHTML;
        
        this.initializeLetters();
        this.addDragDropListeners();
        
        // Initialize debug info
        this.updateDebugInfo();
        
        // Add debug button listeners for letter arranging mode (only if debug mode is enabled)
        if (this.DEBUG_MODE) {
            document.getElementById('reset-game-btn').addEventListener('click', () => {
                this.showResetConfirmation();
            });
            
            document.getElementById('reset-yes-btn').addEventListener('click', () => {
                // Clear localStorage first, then reload page (same approach as play again button)
                localStorage.removeItem('wordle-solved-words');
                location.reload();
            });
            
            document.getElementById('reset-no-btn').addEventListener('click', () => {
                this.cancelReset();
            });
            
            document.getElementById('autofill-arrangement').addEventListener('click', () => {
                this.autofillArrangement();
            });
        }
    }
    
    updateDebugInfo() {
        const arrangementElement = document.getElementById('current-arrangement');
        if (arrangementElement) {
            const slots = document.querySelectorAll('.letter-slot');
            let currentWord = '';
            
            slots.forEach(slot => {
                if (slot.dataset.filled === 'true' && slot.querySelector('.draggable-letter')) {
                    currentWord += slot.querySelector('.draggable-letter').textContent;
                } else {
                    currentWord += '_';
                }
            });
            
            arrangementElement.textContent = currentWord;
        }
    }

    initializeLetters() {
        const wordLetters = {
            'EARTH': 'EARTH'.split(''),
            'LILAC': 'LILAC'.split(''),
            'TEETH': 'TEETH'.split('')
        };
        
        Object.entries(wordLetters).forEach(([word, letters]) => {
            const container = document.getElementById(`${word.toLowerCase()}-letters`);
            letters.forEach((letter, index) => {
                const letterElement = document.createElement('div');
                letterElement.className = 'draggable-letter';
                letterElement.textContent = letter;
                letterElement.draggable = true;
                letterElement.dataset.letter = letter;
                letterElement.dataset.originalIndex = `${word}-${index}`;
                letterElement.dataset.sourceWord = word;
                container.appendChild(letterElement);
            });
        });
    }

    addDragDropListeners() {
        let draggedElement = null;
        let isDragging = false;
        let offsetX, offsetY;
        
        // Function to make an element draggable
        const makeDraggable = (element) => {
            element.addEventListener('mousedown', (e) => {
                isDragging = true;
                draggedElement = element;
                
                // Calculate offset from mouse to element position
                const rect = element.getBoundingClientRect();
                offsetX = e.clientX - rect.left;
                offsetY = e.clientY - rect.top;
                
                // If letter is in a slot, unsnap it but keep the element
                if (element.dataset.slotIndex) {
                    const slot = document.querySelector(`[data-target="${element.dataset.slotIndex}"]`);
                    if (slot) {
                        // Move the element to document body for free positioning
                        document.body.appendChild(element);
                        slot.dataset.filled = 'false';
                        slot.classList.remove('filled');
                    }
                    delete element.dataset.slotIndex;
                }
                
                // Set initial position for absolute positioning
                element.style.position = 'absolute';
                element.style.left = (rect.left + window.scrollX) + 'px';
                element.style.top = (rect.top + window.scrollY) + 'px';
                element.style.zIndex = '1000';
                element.classList.add('dragging');
                
                // Update debug info immediately
                this.updateDebugInfo();
                
                e.preventDefault();
            });
        };
        
        // Add draggable behavior to all letters
        document.querySelectorAll('.draggable-letter').forEach(makeDraggable);
        
        // Global mouse move handler
        document.addEventListener('mousemove', (e) => {
            if (isDragging && draggedElement) {
                draggedElement.style.left = (e.clientX - offsetX + window.scrollX) + 'px';
                draggedElement.style.top = (e.clientY - offsetY + window.scrollY) + 'px';
            }
        });
        
        // Global mouse up handler
        document.addEventListener('mouseup', (e) => {
            if (isDragging && draggedElement) {
                isDragging = false;
                draggedElement.classList.remove('dragging');
                
                // Check if dropped on a slot
                const slots = document.querySelectorAll('.letter-slot');
                let dropped = false;
                
                for (const slot of slots) {
                    const slotRect = slot.getBoundingClientRect();
                    if (e.clientX >= slotRect.left && e.clientX <= slotRect.right &&
                        e.clientY >= slotRect.top && e.clientY <= slotRect.bottom) {
                        
                        // If slot is occupied, return that letter to its original position
                        if (slot.dataset.filled === 'true') {
                            const existingLetter = slot.querySelector('.draggable-letter');
                            if (existingLetter) {
                                this.returnLetterToOriginalPosition(existingLetter);
                            }
                        }
                        
                        // Snap to slot
                        this.snapToSlot(draggedElement, slot);
                        dropped = true;
                        break;
                    }
                }
                
                // If not dropped on a slot, letter stays where it was dropped
                if (!dropped) {
                    draggedElement.style.position = 'absolute';
                    draggedElement.style.zIndex = '1';
                    // Make sure it's not associated with any slot
                    if (draggedElement.dataset.slotIndex) {
                        delete draggedElement.dataset.slotIndex;
                    }
                }
                
                // Update debug info after drop
                this.updateDebugInfo();
                
                draggedElement = null;
            }
        });
        
        // Add button listeners
        document.getElementById('check-arrangement').addEventListener('click', () => {
            this.checkArrangement();
        });
        
        document.getElementById('reset-arrangement').addEventListener('click', () => {
            this.resetArrangement();
        });
    }

    snapToSlot(letter, slot) {
        // Position letter in slot
        const slotRect = slot.getBoundingClientRect();
        letter.style.position = 'absolute';
        letter.style.left = (slotRect.left + window.scrollX) + 'px';
        letter.style.top = (slotRect.top + window.scrollY) + 'px';
        letter.style.zIndex = '2';
        
        // Mark slot as filled and store reference
        slot.dataset.filled = 'true';
        slot.classList.add('filled');
        letter.dataset.slotIndex = slot.dataset.target;
        
        // Append letter to slot for organization
        slot.appendChild(letter);
        
        // Update debug info
        this.updateDebugInfo();
    }
    
    autofillArrangement() {
        const targetPhrase = 'CHILLEATTHEATRE';
        const slots = document.querySelectorAll('.letter-slot');
        
        // First, reset all arrangements
        this.resetArrangement();
        
        // Wait a moment for reset to complete, then autofill
        setTimeout(() => {
            // Get all available letters
            const allLetters = document.querySelectorAll('.draggable-letter');
            const availableLetters = {};
            
            // Count available letters
            allLetters.forEach(letter => {
                const char = letter.textContent;
                if (!availableLetters[char]) {
                    availableLetters[char] = [];
                }
                availableLetters[char].push(letter);
            });
            
            // Fill each slot with the correct letter
            for (let i = 0; i < targetPhrase.length; i++) {
                const targetChar = targetPhrase[i];
                const slot = document.querySelector(`[data-target="${i}"]`);
                
                if (availableLetters[targetChar] && availableLetters[targetChar].length > 0) {
                    const letter = availableLetters[targetChar].shift(); // Use the first available letter
                    this.snapToSlot(letter, slot);
                }
            }
            
            // Update debug info and show completion message
            this.updateDebugInfo();
            console.log('Autofill completed! Current arrangement:', targetPhrase);
            this.showMessage('🔧 Debug: Auto-filled with correct arrangement!');
        }, 200);
    }
    
    returnLetterToOriginalPosition(letter) {
        // Return to original word row
        const sourceWord = letter.dataset.sourceWord;
        if (sourceWord) {
            const container = document.getElementById(`${sourceWord.toLowerCase()}-letters`);
            if (container) {
                container.appendChild(letter);
                
                // Reset positioning and styling
                letter.style.position = 'relative';
                letter.style.left = 'auto';
                letter.style.top = 'auto';
                letter.style.zIndex = '1';
                
                // Clear slot reference
                delete letter.dataset.slotIndex;
                
                // Remove any dragging class
                letter.classList.remove('dragging');
            }
        }
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
        let filledCount = 0;
        
        slots.forEach(slot => {
            if (slot.dataset.filled === 'true' && slot.querySelector('.draggable-letter')) {
                currentWord += slot.querySelector('.draggable-letter').textContent;
                filledCount++;
            } else {
                currentWord += '_';
            }
        });
        
        const targetPhrase = 'CHILLEATTHEATRE';
        
        if (currentWord === targetPhrase) {
            this.showFinalGiftModal();
        } else if (filledCount === 0) {
            this.showMessage('Please place some letters first!');
        } else if (filledCount < 15) {
            this.showMessage(`You need to fill all ${15} slots. Currently filled: ${filledCount}`);
        } else {
            this.showMessage(`Not quite right! You have: "${currentWord.replace(/_/g, ' ')}". Keep trying!`);
        }
        
        // Update debug info
        this.updateDebugInfo();
    }

    resetArrangement() {
        // Find all letters regardless of where they are in the DOM
        const allLetters = document.querySelectorAll('.draggable-letter');
        const slots = document.querySelectorAll('.letter-slot');
        
        // Clear all slots first
        slots.forEach(slot => {
            slot.innerHTML = '';
            slot.dataset.filled = 'false';
            slot.classList.remove('filled');
        });
        
        // Return all letters to their original word rows
        allLetters.forEach(letter => {
            this.returnLetterToOriginalPosition(letter);
        });
        
        // Re-add drag listeners to ensure all letters are draggable
        setTimeout(() => {
            document.querySelectorAll('.draggable-letter').forEach(letter => {
                // Remove any existing listeners by cloning the element
                const newLetter = letter.cloneNode(true);
                letter.parentNode.replaceChild(newLetter, letter);
            });
            
            // Re-initialize drag listeners
            this.addDragDropListeners();
            
            // Update debug info
            this.updateDebugInfo();
        }, 100);
    }

    showFinalGiftModal() {
        // Redirect to the dedicated gift reveal page
        window.location.href = 'gift-revealed.html';
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const game = new WordleGame();
    createSnowflakes(); // Add snowflake effect
});

// Create falling snowflakes for ambient effect
function createSnowflakes() {
    const snowflakesContainer = document.querySelector('.snowflakes');
    if (!snowflakesContainer) return;
    
    const snowflakeSymbols = ['❄', '❅', '✦', '✧', '✶'];
    
    // Fewer snowflakes for main page (30 vs 50)
    for (let i = 0; i < 30; i++) {
        const snowflake = document.createElement('div');
        snowflake.className = 'snowflake';
        snowflake.innerHTML = snowflakeSymbols[Math.floor(Math.random() * snowflakeSymbols.length)];
        snowflake.style.left = Math.random() * 100 + '%';
        snowflake.style.animationDuration = Math.random() * 4 + 3 + 's'; // Slower fall
        snowflake.style.animationDelay = Math.random() * 3 + 's';
        snowflake.style.fontSize = Math.random() * 8 + 8 + 'px'; // Smaller size
        snowflake.style.opacity = Math.random() * 0.4 + 0.1; // Much more faint
        snowflakesContainer.appendChild(snowflake);
    }
}