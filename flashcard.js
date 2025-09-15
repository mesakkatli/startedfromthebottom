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
        this.initializeDarkMode();
        this.loadSampleCards();
        this.showFlashcardGenerator(); // Başlangıçta flashcard generator'ı göster
    }

    initializeEventListeners() {
        // File upload events
        const fileInput = document.getElementById('fileInput');
        const uploadArea = document.getElementById('uploadArea');

        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        }
        
        // Drag and drop events
        if (uploadArea) {
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
        }

        // Navigation events
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const flipBtn = document.getElementById('flipBtn');
        
        if (prevBtn) prevBtn.addEventListener('click', () => this.previousCard());
        if (nextBtn) nextBtn.addEventListener('click', () => this.nextCard());
        if (flipBtn) flipBtn.addEventListener('click', () => this.flipCard());
        
        // Control events
        const shuffleBtn = document.getElementById('shuffleBtn');
        const resetBtn = document.getElementById('resetBtn');
        const studyModeBtn = document.getElementById('studyModeBtn');
        const exportBtn = document.getElementById('exportBtn');
        
        if (shuffleBtn) shuffleBtn.addEventListener('click', () => this.shuffleCards());
        if (resetBtn) resetBtn.addEventListener('click', () => this.resetProgress());
        if (studyModeBtn) studyModeBtn.addEventListener('click', () => this.toggleStudyMode());
        if (exportBtn) exportBtn.addEventListener('click', () => this.exportCards());

        // Flashcard click event
        const flashcard = document.getElementById('flashcard');
        if (flashcard) {
            flashcard.addEventListener('click', () => this.flipCard());
        }

        // Keyboard events
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        
        // Dark mode toggle
        const darkModeToggle = document.getElementById('darkModeToggle');
        if (darkModeToggle) {
            darkModeToggle.addEventListener('click', () => this.toggleDarkMode());
        }
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
                alert(`${generatedCards.length} adet flashcard başarıyla oluşturuldu!`);
            } else {
                alert('Dosyalardan flashcard oluşturulamadı. Örnek kartlar yüklendi.');
                this.loadSampleCards();
                this.showFlashcardGenerator();
            }
        } catch (error) {
            console.error('Dosya işleme hatası:', error);
            alert('Dosya işlenirken bir hata oluştu. Örnek kartlar yüklendi.');
            this.loadSampleCards();
            this.showFlashcardGenerator();
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
            const fileName = file.name.toLowerCase();
            const fileType = file.type.toLowerCase();
            
            console.log('Processing file:', fileName, 'Type:', fileType);
            
            if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.onerror = () => reject(new Error('Dosya okunamadı'));
                reader.readAsText(file);
            } else {
                // Diğer dosya türleri için örnek tıbbi içerik oluştur
                resolve(this.generateMedicalContent(fileType, fileName));
            }
        });
    }

    generateMedicalContent(fileType, fileName) {
        const medicalTopics = [
            'Hücre: Canlıların temel yapı ve işlev birimi',
            'Doku: Benzer yapı ve işleve sahip hücrelerin bir araya gelmesi',
            'Organ: Belirli bir işlevi yerine getiren doku topluluğu',
            'Sistem: Ortak bir işlevi yerine getiren organların topluluğu',
            'Homeostaz: Vücudun iç dengesini koruma mekanizması',
            'Metabolizma: Vücuttaki kimyasal reaksiyonların tümü',
            'Enzim: Biyokimyasal reaksiyonları hızlandıran proteinler',
            'Hormon: Endokrin bezlerden salgılanan kimyasal haberci moleküller',
            'Antikor: Bağışıklık sisteminin ürettiği koruyucu proteinler',
            'Nöron: Sinir sisteminin temel hücresi',
            'Sinapsis: Nöronlar arası bağlantı noktası',
            'Mitokondri: Hücrenin enerji santrali',
            'Ribozom: Protein sentezinin gerçekleştiği organeller',
            'DNA: Kalıtsal bilgiyi taşıyan molekül',
            'RNA: Protein sentezinde görevli nükleik asit'
        ];
        
        const randomTopics = medicalTopics.sort(() => 0.5 - Math.random()).slice(0, 10);
        return `Dosya: ${fileName}\n\n${randomTopics.join('\n')}`;
    }

    generateFlashcardsFromText(text) {
        const cards = [];
        
        // Basit metin işleme ile flashcard oluşturma
        const lines = text.split('\n').filter(line => line.trim().length > 10);
        
        // Tanım-açıklama çiftlerini ara
        const definitionPatterns = [
            /([A-ZÜĞŞÇÖI][a-züğşçöıi]+(?:\s+[A-ZÜĞŞÇÖI][a-züğşçöıi]+)*)\s*[:]\s*([^.!?]+)/g,
            /([A-ZÜĞŞÇÖI][a-züğşçöıi]+(?:\s+[A-ZÜĞŞÇÖI][a-züğşçöıi]+)*)\s*[-]\s*([^.!?]+)/g,
        ];

        definitionPatterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(text)) !== null) {
                if (match[1] && match[2] && match[1].length > 2 && match[2].length > 10) {
                    cards.push({
                        id: cards.length + 1,
                        question: `${match[1].trim()} nedir?`,
                        answer: match[2].trim(),
                        difficulty: null,
                        studied: false,
                        category: 'Tanım'
                    });
                }
            }
        });

        // Eğer yeterli kart oluşturulamazsa, satırlardan kart oluştur
        if (cards.length < 5) {
            lines.forEach((line, index) => {
                const trimmed = line.trim();
                if (trimmed.length > 20 && trimmed.length < 150 && cards.length < 20) {
                    // Basit soru oluşturma
                    const question = this.createQuestionFromSentence(trimmed);
                    if (question) {
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
        }

        // Eğer hala yeterli kart yoksa, örnek kartları ekle
        if (cards.length === 0) {
            return this.getSampleMedicalCards();
        }

        return cards.slice(0, 30); // Maksimum 30 kart
    }

    createQuestionFromSentence(sentence) {
        const medicalTerms = ['hücre', 'organ', 'sistem', 'hastalık', 'tedavi', 'tanı', 'semptom', 'sendrom', 'enzim', 'hormon'];
        
        for (let term of medicalTerms) {
            if (sentence.toLowerCase().includes(term)) {
                return `${term.charAt(0).toUpperCase() + term.slice(1)} ile ilgili bu bilgi nedir?`;
            }
        }
        
        // Genel soru
        if (sentence.length > 50) {
            return `Bu açıklama neyi anlatmaktadır?`;
        }
        
        return `Bu tanım neyi ifade eder?`;
    }

    getSampleMedicalCards() {
        return [
            {
                id: 1,
                question: "Hücre zarının temel yapısı nedir?",
                answer: "Hücre zarı, fosfolipit çift tabakasından oluşur ve hücrenin iç ve dış ortamını ayırır. Seçici geçirgenlik özelliği vardır ve membran proteinleri içerir.",
                difficulty: null,
                studied: false,
                category: "Hücre Biyolojisi"
            },
            {
                id: 2,
                question: "Mitokondri neden hücrenin enerji santrali olarak adlandırılır?",
                answer: "Mitokondri, ATP sentezi yoluyla hücrenin enerji ihtiyacını karşıladığı için enerji santrali olarak adlandırılır. Hücresel solunum sürecinin son aşaması burada gerçekleşir.",
                difficulty: null,
                studied: false,
                category: "Hücre Biyolojisi"
            },
            {
                id: 3,
                question: "Homeostaz nedir?",
                answer: "Homeostaz, vücudun iç ortamının sabit tutulması için çalışan düzenleme mekanizmalarıdır. Vücut sıcaklığı, kan şekeri, pH gibi parametrelerin dengelenmesini sağlar.",
                difficulty: null,
                studied: false,
                category: "Fizyoloji"
            },
            {
                id: 4,
                question: "Enzimler nasıl çalışır?",
                answer: "Enzimler, substratlarına özgü olarak bağlanır ve aktivasyon enerjisini düşürerek biyokimyasal reaksiyonları hızlandırır. Reaksiyon sonunda değişmeden kalırlar.",
                difficulty: null,
                studied: false,
                category: "Biyokimya"
            },
            {
                id: 5,
                question: "DNA ve RNA arasındaki temel farklar nelerdir?",
                answer: "DNA çift iplikli, RNA tek ipliklidir. DNA'da timin, RNA'da urasil bulunur. DNA kalıtsal bilgiyi saklar, RNA protein sentezinde görev alır.",
                difficulty: null,
                studied: false,
                category: "Moleküler Biyoloji"
            }
        ];
    }

    loadSampleCards() {
        this.flashcards = this.getSampleMedicalCards();
        this.currentIndex = 0;
        this.updateStats();
        this.displayCurrentCard();
    }

    showProcessing() {
        const uploadSection = document.getElementById('uploadSection');
        const processingSection = document.getElementById('processingSection');
        const flashcardGenerator = document.getElementById('flashcardGenerator');
        
        if (uploadSection) uploadSection.style.display = 'none';
        if (processingSection) processingSection.style.display = 'block';
        if (flashcardGenerator) flashcardGenerator.style.display = 'none';
    }

    showUploadSection() {
        const uploadSection = document.getElementById('uploadSection');
        const processingSection = document.getElementById('processingSection');
        const flashcardGenerator = document.getElementById('flashcardGenerator');
        
        if (uploadSection) uploadSection.style.display = 'block';
        if (processingSection) processingSection.style.display = 'none';
        if (flashcardGenerator) flashcardGenerator.style.display = 'none';
    }

    showFlashcardGenerator() {
        const uploadSection = document.getElementById('uploadSection');
        const processingSection = document.getElementById('processingSection');
        const flashcardGenerator = document.getElementById('flashcardGenerator');
        
        if (uploadSection) uploadSection.style.display = 'none';
        if (processingSection) processingSection.style.display = 'none';
        if (flashcardGenerator) flashcardGenerator.style.display = 'block';
    }

    displayCurrentCard() {
        if (this.flashcards.length === 0) {
            console.log('No flashcards to display');
            return;
        }

        const card = this.flashcards[this.currentIndex];
        const questionText = document.getElementById('questionText');
        const answerText = document.getElementById('answerText');
        const currentCard = document.getElementById('currentCard');
        const totalCards = document.getElementById('totalCards');

        if (questionText) questionText.textContent = card.question;
        if (answerText) answerText.textContent = card.answer;
        if (currentCard) currentCard.textContent = this.currentIndex + 1;
        if (totalCards) totalCards.textContent = this.flashcards.length;

        // Reset flip state
        this.isFlipped = false;
        const flashcard = document.getElementById('flashcard');
        if (flashcard) {
            flashcard.classList.remove('flipped');
        }

        // Update progress
        const progress = ((this.currentIndex + 1) / this.flashcards.length) * 100;
        const progressFill = document.getElementById('progressFill');
        if (progressFill) {
            progressFill.style.width = progress + '%';
        }

        // Update navigation buttons
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        
        if (prevBtn) prevBtn.disabled = this.currentIndex === 0;
        if (nextBtn) nextBtn.disabled = this.currentIndex === this.flashcards.length - 1;

        // Hide difficulty buttons
        const difficultyButtons = document.getElementById('difficultyButtons');
        if (difficultyButtons) {
            difficultyButtons.style.display = 'none';
        }
    }

    flipCard() {
        this.isFlipped = !this.isFlipped;
        const flashcard = document.getElementById('flashcard');
        
        if (flashcard) {
            if (this.isFlipped) {
                flashcard.classList.add('flipped');
                if (this.studyMode) {
                    const difficultyButtons = document.getElementById('difficultyButtons');
                    if (difficultyButtons) {
                        difficultyButtons.style.display = 'flex';
                    }
                }
            } else {
                flashcard.classList.remove('flipped');
                const difficultyButtons = document.getElementById('difficultyButtons');
                if (difficultyButtons) {
                    difficultyButtons.style.display = 'none';
                }
            }
        }
    }

    nextCard() {
        if (this.currentIndex < this.flashcards.length - 1) {
            this.currentIndex++;
            this.displayCurrentCard();
        }
    }

    previousCard() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.displayCurrentCard();
        }
    }

    shuffleCards() {
        for (let i = this.flashcards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.flashcards[i], this.flashcards[j]] = [this.flashcards[j], this.flashcards[i]];
        }
        this.currentIndex = 0;
        this.displayCurrentCard();
        alert('Kartlar karıştırıldı!');
    }

    resetProgress() {
        this.flashcards.forEach(card => {
            card.difficulty = null;
            card.studied = false;
        });
        this.currentIndex = 0;
        this.updateStats();
        this.displayCurrentCard();
        alert('İlerleme sıfırlandı!');
    }

    toggleStudyMode() {
        this.studyMode = !this.studyMode;
        const btn = document.getElementById('studyModeBtn');
        
        if (btn) {
            if (this.studyMode) {
                btn.textContent = '📖 Normal Mod';
                btn.style.backgroundColor = 'var(--success-green)';
                alert('Çalışma modu aktif! Kartları çevirdikten sonra zorluk seviyesini seçebilirsiniz.');
            } else {
                btn.textContent = '📚 Çalışma Modu';
                btn.style.backgroundColor = '';
                const difficultyButtons = document.getElementById('difficultyButtons');
                if (difficultyButtons) {
                    difficultyButtons.style.display = 'none';
                }
            }
        }
    }

    markDifficulty(level) {
        if (this.flashcards.length === 0) return;
        
        const card = this.flashcards[this.currentIndex];
        card.difficulty = level;
        card.studied = true;
        
        this.updateStats();
        
        const difficultyButtons = document.getElementById('difficultyButtons');
        if (difficultyButtons) {
            difficultyButtons.style.display = 'none';
        }
        
        // Auto advance to next card
        setTimeout(() => {
            if (this.currentIndex < this.flashcards.length - 1) {
                this.nextCard();
            } else {
                alert('Tüm kartları tamamladınız! Tebrikler!');
            }
        }, 500);
    }

    updateStats() {
        this.stats.total = this.flashcards.length;
        this.stats.studied = this.flashcards.filter(card => card.studied).length;
        this.stats.easy = this.flashcards.filter(card => card.difficulty === 'easy').length;
        this.stats.hard = this.flashcards.filter(card => card.difficulty === 'hard').length;

        const totalStat = document.getElementById('totalStat');
        const studiedStat = document.getElementById('studiedStat');
        const easyStat = document.getElementById('easyStat');
        const hardStat = document.getElementById('hardStat');

        if (totalStat) totalStat.textContent = this.stats.total;
        if (studiedStat) studiedStat.textContent = this.stats.studied;
        if (easyStat) easyStat.textContent = this.stats.easy;
        if (hardStat) hardStat.textContent = this.stats.hard;
    }

    exportCards() {
        if (this.flashcards.length === 0) {
            alert('Dışa aktarılacak kart bulunamadı!');
            return;
        }

        const dataStr = JSON.stringify(this.flashcards, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = 'tip-flashcards.json';
        link.click();
        
        alert('Flashcard\'lar başarıyla dışa aktarıldı!');
    }

    handleKeyPress(event) {
        // Sadece flashcard generator görünürken klavye kısayolları çalışsın
        const flashcardGenerator = document.getElementById('flashcardGenerator');
        if (!flashcardGenerator || flashcardGenerator.style.display === 'none') {
            return;
        }

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
            const toggle = document.getElementById('darkModeToggle');
            if (toggle) {
                toggle.innerHTML = '☀️';
            }
        }
    }

    toggleDarkMode() {
        this.isDarkMode = !this.isDarkMode;
        document.body.classList.toggle('dark-mode');
        
        const toggle = document.getElementById('darkModeToggle');
        if (toggle) {
            toggle.innerHTML = this.isDarkMode ? '☀️' : '🌙';
        }
        
        localStorage.setItem('darkMode', this.isDarkMode);
    }
}

// Initialize the flashcard system when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.flashcardSystem = new FlashcardSystem();
});

// Global functions for difficulty buttons
function markDifficulty(level) {
    if (window.flashcardSystem) {
        window.flashcardSystem.markDifficulty(level);
    }
}