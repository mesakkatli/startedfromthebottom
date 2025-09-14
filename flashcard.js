class FlashcardSystem {
    constructor() {
        this.flashcards = [];
        this.currentIndex = 0;
        this.isFlipped = false;
        this.studyMode = false;
        this.isDarkMode = localStorage.getItem('darkMode') === 'true';
        this.stats = {
            total: 0,
            studied: 0,
            easy: 0,
            medium: 0,
            hard: 0
        };
        this.initializeEventListeners();
        this.loadSampleCards();
        this.initializeDarkMode();
    }

    initializeEventListeners() {
        // File upload events
        const fileInput = document.getElementById('fileInput');
        const uploadArea = document.getElementById('uploadArea');

        fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        
        // Drag and drop events
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            this.processFiles(files);
        });

        // Navigation events
        document.getElementById('prevBtn').addEventListener('click', () => this.previousCard());
        document.getElementById('nextBtn').addEventListener('click', () => this.nextCard());
        document.getElementById('flipBtn').addEventListener('click', () => this.flipCard());
        
        // Control events
        document.getElementById('shuffleBtn').addEventListener('click', () => this.shuffleCards());
        document.getElementById('resetBtn').addEventListener('click', () => this.resetProgress());
        document.getElementById('studyModeBtn').addEventListener('click', () => this.toggleStudyMode());
        document.getElementById('exportBtn').addEventListener('click', () => this.exportCards());

        // Flashcard click event
        document.getElementById('flashcard').addEventListener('click', () => this.flipCard());

        // Keyboard events
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        
        // Dark mode toggle
        document.getElementById('darkModeToggle').addEventListener('click', () => this.toggleDarkMode());
    }

    handleFileSelect(event) {
        const files = event.target.files;
        this.processFiles(files);
    }

    async processFiles(files) {
        if (files.length === 0) return;

        this.showProcessing();
        
        try {
            const allText = await this.extractTextFromFiles(files);
            const generatedCards = this.generateFlashcardsFromText(allText);
            
            if (generatedCards.length > 0) {
                this.flashcards = generatedCards;
                this.currentIndex = 0;
                this.updateStats();
                this.showFlashcardGenerator();
                this.displayCurrentCard();
            } else {
                alert('Dosyalardan flashcard oluşturulamadı. Lütfen içerik kontrolü yapın.');
                this.showUploadSection();
            }
        } catch (error) {
            console.error('Dosya işleme hatası:', error);
            alert('Dosya işlenirken bir hata oluştu. Lütfen tekrar deneyin.');
            this.showUploadSection();
        }
    }

    async extractTextFromFiles(files) {
        let allText = '';
        
        for (let file of files) {
            const text = await this.readFileContent(file);
            allText += text + '\n\n';
        }
        
        return allText;
    }

    readFileContent(file) {
        return new Promise((resolve, reject) => {
            if (file.type === 'text/plain') {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.onerror = () => reject(new Error('Dosya okunamadı'));
                reader.readAsText(file);
            } else if (file.type === 'application/pdf') {
                this.extractPDFText(file).then(resolve).catch(reject);
            } else if (file.type.includes('word') || file.name.endsWith('.docx')) {
                this.extractWordText(file).then(resolve).catch(reject);
            } else {
                const reader = new FileReader();
                reader.onload = (e) => {
                    resolve(this.extractBasicText(e.target.result, file.type));
                };
                reader.onerror = () => reject(new Error('Dosya okunamadı'));
                reader.readAsArrayBuffer(file);
            }
        });
    }

    async extractPDFText(file) {
        try {
            // PDF.js kullanarak PDF'den metin çıkarma
            const arrayBuffer = await file.arrayBuffer();
            
            // PDF.js'i dinamik olarak yükle
            if (!window.pdfjsLib) {
                await this.loadPDFJS();
            }
            
            const pdf = await window.pdfjsLib.getDocument(arrayBuffer).promise;
            let fullText = '';
            
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => item.str).join(' ');
                fullText += pageText + '\n';
            }
            
            return fullText;
        } catch (error) {
            console.error('PDF işleme hatası:', error);
            return 'PDF dosyası işlenirken hata oluştu.';
        }
    }

    async extractWordText(file) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            
            // Mammoth.js'i dinamik olarak yükle
            if (!window.mammoth) {
                await this.loadMammoth();
            }
            
            const result = await window.mammoth.extractRawText({arrayBuffer});
            return result.value;
        } catch (error) {
            console.error('Word dosyası işleme hatası:', error);
            return 'Word dosyası işlenirken hata oluştu.';
        }
    }

    async loadPDFJS() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.min.js';
            script.onload = () => {
                window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.js';
                resolve();
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    async loadMammoth() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    extractBasicText(content, fileType) {
        if (fileType.includes('powerpoint')) {
            return 'PowerPoint sunumu tespit edildi. Gerçek uygulamada özel kütüphane gerekli.';
        }
        return 'Desteklenmeyen dosya formatı.';
    }

    generateFlashcardsFromText(text) {
        const cards = [];
        
        // Simple text processing to create flashcards
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
        
        // Medical terms and definitions pattern matching
        const medicalPatterns = [
            /([A-ZÜĞŞÇÖI][a-züğşçöıi]+(?:\s+[A-ZÜĞŞÇÖI][a-züğşçöıi]+)*)\s*[:]\s*([^.!?]+)/g,
            /([A-ZÜĞŞÇÖI][a-züğşçöıi]+(?:\s+[A-ZÜĞŞÇÖI][a-züğşçöıi]+)*)\s*[-]\s*([^.!?]+)/g,
            /([A-ZÜĞŞÇÖI][a-züğşçöıi]+(?:\s+[A-ZÜĞŞÇÖI][a-züğşçöıi]+)*)\s*[=]\s*([^.!?]+)/g
        ];

        // Extract definition-style flashcards
        medicalPatterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(text)) !== null) {
                if (match[1] && match[2] && match[1].length > 3 && match[2].length > 10) {
                    cards.push({
                        id: cards.length + 1,
                        question: match[1].trim(),
                        answer: match[2].trim(),
                        difficulty: null,
                        studied: false,
                        category: 'Tanım'
                    });
                }
            }
        });

        // Generate question-answer pairs from sentences
        const questionWords = ['nedir', 'nasıl', 'neden', 'hangi', 'kim', 'ne zaman', 'nerede'];
        
        sentences.forEach((sentence, index) => {
            const trimmed = sentence.trim();
            if (trimmed.length > 30 && trimmed.length < 200) {
                // Create a question from the sentence
                const question = this.createQuestionFromSentence(trimmed);
                if (question && question !== trimmed) {
                    cards.push({
                        id: cards.length + 1,
                        question: question,
                        answer: trimmed,
                        difficulty: null,
                        studied: false,
                        category: 'Genel'
                    });
                }
            }
        });

        // If no cards generated, create sample medical cards
        if (cards.length === 0) {
            cards.push(...this.getSampleMedicalCards());
        }

        return cards.slice(0, 50); // Limit to 50 cards
    }

    createQuestionFromSentence(sentence) {
        // Simple question generation logic
        const medicalTerms = ['hücre', 'organ', 'sistem', 'hastalık', 'tedavi', 'tanı', 'semptom', 'sendrom'];
        
        for (let term of medicalTerms) {
            if (sentence.toLowerCase().includes(term)) {
                return `${term.charAt(0).toUpperCase() + term.slice(1)} hakkında ne biliyorsunuz?`;
            }
        }
        
        // Generic question
        if (sentence.length > 50) {
            const firstPart = sentence.substring(0, sentence.indexOf(' ', 30));
            return `"${firstPart}..." ile ilgili açıklama nedir?`;
        }
        
        return null;
    }

    getSampleMedicalCards() {
        return [
            {
                id: 1,
                question: "Hücre zarının temel yapısı nedir?",
                answer: "Hücre zarı, fosfolipit çift tabakasından oluşur ve hücrenin iç ve dış ortamını ayırır. Seçici geçirgenlik özelliği vardır.",
                difficulty: null,
                studied: false,
                category: "Hücre Biyolojisi"
            },
            {
                id: 2,
                question: "Mitokondri neden hücrenin enerji santrali olarak adlandırılır?",
                answer: "Mitokondri, ATP sentezi yoluyla hücrenin enerji ihtiyacını karşıladığı için enerji santrali olarak adlandırılır.",
                difficulty: null,
                studied: false,
                category: "Hücre Biyolojisi"
            },
            {
                id: 3,
                question: "Homeostaz nedir?",
                answer: "Homeostaz, vücudun iç ortamının sabit tutulması için çalışan düzenleme mekanizmalarıdır.",
                difficulty: null,
                studied: false,
                category: "Fizyoloji"
            }
        ];
    }

    loadSampleCards() {
        this.flashcards = this.getSampleMedicalCards();
        this.updateStats();
        this.displayCurrentCard();
    }

    showProcessing() {
        document.getElementById('uploadSection').style.display = 'none';
        document.getElementById('processingSection').style.display = 'block';
        document.getElementById('flashcardGenerator').style.display = 'none';
    }

    showUploadSection() {
        document.getElementById('uploadSection').style.display = 'block';
        document.getElementById('processingSection').style.display = 'none';
        document.getElementById('flashcardGenerator').style.display = 'none';
    }

    showFlashcardGenerator() {
        document.getElementById('uploadSection').style.display = 'none';
        document.getElementById('processingSection').style.display = 'none';
        document.getElementById('flashcardGenerator').style.display = 'block';
    }

    displayCurrentCard() {
        if (this.flashcards.length === 0) return;

        const card = this.flashcards[this.currentIndex];
        document.getElementById('questionText').textContent = card.question;
        document.getElementById('answerText').textContent = card.answer;
        document.getElementById('currentCard').textContent = this.currentIndex + 1;
        document.getElementById('totalCards').textContent = this.flashcards.length;

        // Reset flip state
        this.isFlipped = false;
        document.getElementById('flashcard').classList.remove('flipped');

        // Update progress
        const progress = ((this.currentIndex + 1) / this.flashcards.length) * 100;
        document.getElementById('progressFill').style.width = progress + '%';

        // Update navigation buttons
        document.getElementById('prevBtn').disabled = this.currentIndex === 0;
        document.getElementById('nextBtn').disabled = this.currentIndex === this.flashcards.length - 1;
    }

    flipCard() {
        this.isFlipped = !this.isFlipped;
        const flashcard = document.getElementById('flashcard');
        
        if (this.isFlipped) {
            flashcard.classList.add('flipped');
            if (this.studyMode) {
                document.getElementById('difficultyButtons').style.display = 'flex';
            }
        } else {
            flashcard.classList.remove('flipped');
            document.getElementById('difficultyButtons').style.display = 'none';
        }
    }

    nextCard() {
        if (this.currentIndex < this.flashcards.length - 1) {
            this.currentIndex++;
            this.displayCurrentCard();
            document.getElementById('difficultyButtons').style.display = 'none';
        }
    }

    previousCard() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.displayCurrentCard();
            document.getElementById('difficultyButtons').style.display = 'none';
        }
    }

    shuffleCards() {
        for (let i = this.flashcards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.flashcards[i], this.flashcards[j]] = [this.flashcards[j], this.flashcards[i]];
        }
        this.currentIndex = 0;
        this.displayCurrentCard();
    }

    resetProgress() {
        this.flashcards.forEach(card => {
            card.difficulty = null;
            card.studied = false;
        });
        this.currentIndex = 0;
        this.updateStats();
        this.displayCurrentCard();
    }

    toggleStudyMode() {
        this.studyMode = !this.studyMode;
        const btn = document.getElementById('studyModeBtn');
        
        if (this.studyMode) {
            btn.textContent = '📖 Normal Mod';
            btn.style.backgroundColor = 'var(--success-green)';
        } else {
            btn.textContent = '📚 Çalışma Modu';
            btn.style.backgroundColor = 'var(--border-light)';
            document.getElementById('difficultyButtons').style.display = 'none';
        }
    }

    markDifficulty(level) {
        const card = this.flashcards[this.currentIndex];
        card.difficulty = level;
        card.studied = true;
        
        this.updateStats();
        document.getElementById('difficultyButtons').style.display = 'none';
        
        // Auto advance to next card
        setTimeout(() => {
            if (this.currentIndex < this.flashcards.length - 1) {
                this.nextCard();
            }
        }, 500);
    }

    updateStats() {
        this.stats.total = this.flashcards.length;
        this.stats.studied = this.flashcards.filter(card => card.studied).length;
        this.stats.easy = this.flashcards.filter(card => card.difficulty === 'easy').length;
        this.stats.hard = this.flashcards.filter(card => card.difficulty === 'hard').length;

        document.getElementById('totalStat').textContent = this.stats.total;
        document.getElementById('studiedStat').textContent = this.stats.studied;
        document.getElementById('easyStat').textContent = this.stats.easy;
        document.getElementById('hardStat').textContent = this.stats.hard;
    }

    exportCards() {
        const dataStr = JSON.stringify(this.flashcards, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = 'flashcards.json';
        link.click();
    }

    handleKeyPress(event) {
        switch(event.key) {
            case 'ArrowLeft':
                event.preventDefault();
                this.previousCard();
                break;
            case 'ArrowRight':
                event.preventDefault();
                this.nextCard();
                break;
            case ' ':
                event.preventDefault();
                this.flipCard();
                break;
            case '1':
                if (this.studyMode && this.isFlipped) {
                    this.markDifficulty('easy');
                }
                break;
            case '2':
                if (this.studyMode && this.isFlipped) {
                    this.markDifficulty('medium');
                }
                break;
            case '3':
                if (this.studyMode && this.isFlipped) {
                    this.markDifficulty('hard');
                }
                break;
        }
    }

    initializeDarkMode() {
        if (this.isDarkMode) {
            document.body.classList.add('dark-mode');
            document.getElementById('darkModeToggle').innerHTML = '☀️';
        }
    }

    toggleDarkMode() {
        this.isDarkMode = !this.isDarkMode;
        document.body.classList.toggle('dark-mode');
        
        const toggle = document.getElementById('darkModeToggle');
        toggle.innerHTML = this.isDarkMode ? '☀️' : '🌙';
        
        localStorage.setItem('darkMode', this.isDarkMode);
    }
}

// Initialize the flashcard system when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.flashcardSystem = new FlashcardSystem();
});

// Global functions for difficulty buttons
function markDifficulty(level) {
    window.flashcardSystem.markDifficulty(level);
}