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
        this.showFlashcardGenerator();
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
            console.log('Extracted text:', allText.substring(0, 500) + '...');
            
            const generatedCards = this.generateFlashcardsFromText(allText);
            console.log('Generated cards:', generatedCards.length);
            
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
            try {
                const text = await this.readFileContent(file);
                allText += text + '\n\n';
            } catch (error) {
                console.error('Dosya okuma hatası:', error);
                // Hata durumunda dosya adından içerik üret
                allText += this.generateContentFromFileName(file.name) + '\n\n';
            }
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
                reader.readAsText(file, 'UTF-8');
            } else {
                // Diğer dosya türleri için dosya adından içerik üret
                resolve(this.generateContentFromFileName(fileName));
            }
        });
    }

    generateContentFromFileName(fileName) {
        // Dosya adından konu çıkarma
        const topics = [];
        const medicalKeywords = {
            'anatomi': ['Kemik yapısı ve fonksiyonları', 'Kas sistemi anatomisi', 'Sinir sistemi yapısı', 'Dolaşım sistemi anatomisi'],
            'fizyoloji': ['Hücre fizyolojisi ve homeostaz', 'Kardiyovasküler sistem fizyolojisi', 'Solunum sistemi fizyolojisi', 'Sinir sistemi fizyolojisi'],
            'biyokimya': ['Protein yapısı ve fonksiyonları', 'Enzim kinetikleri', 'Metabolik yolaklar', 'Hormon biyokimyası'],
            'histoloji': ['Epitel doku özellikleri', 'Bağ dokusu çeşitleri', 'Kas dokusu histolojisi', 'Sinir dokusu yapısı'],
            'patoloji': ['Hücre hasarı mekanizmaları', 'İnflamasyon süreci', 'Tümör biyolojisi', 'Genetik hastalıklar'],
            'farmakoloji': ['İlaç emilimi ve dağılımı', 'Reseptör teorisi', 'İlaç etkileşimleri', 'Toksikoloji prensipleri'],
            'mikrobiyoloji': ['Bakteri yapısı ve üremesi', 'Viral enfeksiyonlar', 'Antibiyotik direnci', 'Bağışıklık sistemi'],
            'kardiyoloji': ['Kalp anatomisi ve fizyolojisi', 'EKG yorumlama', 'Kalp hastalıkları', 'Hipertansiyon yönetimi'],
            'nöroloji': ['Beyin anatomisi', 'Nörotransmiterler', 'Nörolojik muayene', 'Merkezi sinir sistemi hastalıkları']
        };

        const lowerFileName = fileName.toLowerCase();
        
        for (const [keyword, topicList] of Object.entries(medicalKeywords)) {
            if (lowerFileName.includes(keyword)) {
                topics.push(...topicList);
                break;
            }
        }

        // Eğer özel konu bulunamazsa genel tıp konuları ekle
        if (topics.length === 0) {
            topics.push(
                'Hücre: Canlıların temel yapı ve işlev birimi',
                'Doku: Benzer yapı ve işleve sahip hücrelerin bir araya gelmesi',
                'Organ: Belirli bir işlevi yerine getiren doku topluluğu',
                'Homeostaz: Vücudun iç dengesini koruma mekanizması',
                'Metabolizma: Vücuttaki kimyasal reaksiyonların tümü'
            );
        }

        return `Dosya: ${fileName}\n\n${topics.join('\n')}`;
    }

    generateFlashcardsFromText(text) {
        const cards = [];
        
        // Satırları ayır ve temizle
        const lines = text.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 10);

        console.log('Processing lines:', lines.length);

        // Tanım-açıklama çiftlerini ara (: ile ayrılanlar)
        lines.forEach(line => {
            if (line.includes(':') && line.length > 20 && line.length < 200) {
                const parts = line.split(':');
                if (parts.length >= 2) {
                    const term = parts[0].trim();
                    const definition = parts.slice(1).join(':').trim();
                    
                    if (term.length > 2 && definition.length > 10) {
                        cards.push({
                            id: cards.length + 1,
                            question: `${term} nedir?`,
                            answer: definition,
                            difficulty: null,
                            studied: false,
                            category: 'Tanım'
                        });
                    }
                }
            }
        });

        // Eğer yeterli kart yoksa, cümlelerden soru-cevap oluştur
        if (cards.length < 3) {
            lines.forEach(line => {
                if (line.length > 30 && line.length < 150 && cards.length < 20) {
                    // Tıbbi terimler ara
                    const medicalTerms = ['hücre', 'organ', 'sistem', 'hastalık', 'tedavi', 'tanı', 'semptom', 'enzim', 'hormon', 'protein', 'doku', 'kan', 'kalp', 'beyin', 'akciğer', 'böbrek', 'karaciğer'];
                    
                    let foundTerm = null;
                    for (let term of medicalTerms) {
                        if (line.toLowerCase().includes(term)) {
                            foundTerm = term;
                            break;
                        }
                    }
                    
                    if (foundTerm) {
                        cards.push({
                            id: cards.length + 1,
                            question: `${foundTerm.charAt(0).toUpperCase() + foundTerm.slice(1)} hakkında bu bilgi nedir?`,
                            answer: line,
                            difficulty: null,
                            studied: false,
                            category: 'Genel'
                        });
                    } else {
                        // Genel soru oluştur
                        cards.push({
                            id: cards.length + 1,
                            question: `Bu tıbbi bilgi neyi açıklar?`,
                            answer: line,
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

        console.log('Final cards generated:', cards.length);
        return cards.slice(0, 25); // Maksimum 25 kart
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
                question: "Homeostaz nedir ve neden önemlidir?",
                answer: "Homeostaz, vücudun iç ortamının sabit tutulması için çalışan düzenleme mekanizmalarıdır. Vücut sıcaklığı, kan şekeri, pH gibi parametrelerin dengelenmesini sağlar ve yaşam için kritiktir.",
                difficulty: null,
                studied: false,
                category: "Fizyoloji"
            },
            {
                id: 4,
                question: "Enzimler nasıl çalışır ve özellikleri nelerdir?",
                answer: "Enzimler, substratlarına özgü olarak bağlanır ve aktivasyon enerjisini düşürerek biyokimyasal reaksiyonları hızlandırır. Reaksiyon sonunda değişmeden kalırlar ve tekrar kullanılabilirler.",
                difficulty: null,
                studied: false,
                category: "Biyokimya"
            },
            {
                id: 5,
                question: "DNA ve RNA arasındaki temel farklar nelerdir?",
                answer: "DNA çift iplikli, RNA tek ipliklidir. DNA'da timin, RNA'da urasil bulunur. DNA kalıtsal bilgiyi saklar, RNA protein sentezinde görev alır. DNA daha kararlı, RNA daha kısa ömürlüdür.",
                difficulty: null,
                studied: false,
                category: "Moleküler Biyoloji"
            },
            {
                id: 6,
                question: "Kan dolaşımının temel fonksiyonları nelerdir?",
                answer: "Kan dolaşımı oksijen ve besin maddelerini hücrelere taşır, metabolik atıkları uzaklaştırır, vücut sıcaklığını düzenler, hormonları taşır ve bağışıklık sistemine destek sağlar.",
                difficulty: null,
                studied: false,
                category: "Fizyoloji"
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
        const questionSection = document.getElementById('questionSection');
        const answerSection = document.getElementById('answerSection');
        const questionText = document.getElementById('questionText');
        const answerText = document.getElementById('answerText');
        const currentCard = document.getElementById('currentCard');
        const totalCards = document.getElementById('totalCards');

        if (questionText) questionText.textContent = card.question;
        if (answerText) answerText.textContent = card.answer;
        if (currentCard) currentCard.textContent = this.currentIndex + 1;
        if (totalCards) totalCards.textContent = this.flashcards.length;

        // Soru/cevap görünümünü ayarla
        if (questionSection && answerSection) {
            if (this.isFlipped) {
                questionSection.style.display = 'none';
                answerSection.style.display = 'block';
            } else {
                questionSection.style.display = 'block';
                answerSection.style.display = 'none';
            }
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

        // Update flip button text
        const flipBtn = document.getElementById('flipBtn');
        if (flipBtn) {
            flipBtn.textContent = this.isFlipped ? '❓ Soruyu Göster' : '💡 Cevabı Göster';
        }

        // Hide/show difficulty buttons
        const difficultyButtons = document.getElementById('difficultyButtons');
        if (difficultyButtons) {
            difficultyButtons.style.display = (this.studyMode && this.isFlipped) ? 'flex' : 'none';
        }
    }

    flipCard() {
        this.isFlipped = !this.isFlipped;
        this.displayCurrentCard();
    }

    nextCard() {
        if (this.currentIndex < this.flashcards.length - 1) {
            this.currentIndex++;
            this.isFlipped = false; // Yeni karta geçerken soruyu göster
            this.displayCurrentCard();
        }
    }

    previousCard() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.isFlipped = false; // Yeni karta geçerken soruyu göster
            this.displayCurrentCard();
        }
    }

    shuffleCards() {
        for (let i = this.flashcards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.flashcards[i], this.flashcards[j]] = [this.flashcards[j], this.flashcards[i]];
        }
        this.currentIndex = 0;
        this.isFlipped = false;
        this.displayCurrentCard();
        alert('Kartlar karıştırıldı!');
    }

    resetProgress() {
        this.flashcards.forEach(card => {
            card.difficulty = null;
            card.studied = false;
        });
        this.currentIndex = 0;
        this.isFlipped = false;
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
                alert('Çalışma modu aktif! Cevabı gördükten sonra zorluk seviyesini seçebilirsiniz.');
            } else {
                btn.textContent = '📚 Çalışma Modu';
                btn.style.backgroundColor = '';
            }
        }
        
        this.displayCurrentCard();
    }

    markDifficulty(level) {
        if (this.flashcards.length === 0) return;
        
        const card = this.flashcards[this.currentIndex];
        card.difficulty = level;
        card.studied = true;
        
        this.updateStats();
        
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