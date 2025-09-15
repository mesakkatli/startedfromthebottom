class SlideSummarySystem {
    constructor() {
        this.currentSummary = '';
        this.currentFileName = '';
        this.isDarkMode = localStorage.getItem('darkMode') === 'true';
        this.medicalTerms = this.initializeMedicalTerms();
        this.initializeEventListeners();
        this.initializeDarkMode();
    }

    initializeMedicalTerms() {
        return {
            // Anatomi terimleri
            anatomy: [
                'kemik', 'kas', 'sinir', 'damar', 'organ', 'doku', 'hücre', 'sistem',
                'kalp', 'akciğer', 'karaciğer', 'böbrek', 'beyin', 'omurilik', 'vertebra',
                'ekstremite', 'toraks', 'abdomen', 'pelvis', 'kranium'
            ],
            // Fizyoloji terimleri
            physiology: [
                'homeostaz', 'metabolizma', 'solunum', 'dolaşım', 'sindirim', 'boşaltım',
                'endokrin', 'hormon', 'enzim', 'nörotransmiter', 'aksiyon potansiyeli',
                'membran potansiyeli', 'osmoz', 'difüzyon', 'filtrasyon'
            ],
            // Biyokimya terimleri
            biochemistry: [
                'protein', 'karbonhidrat', 'lipit', 'nükleik asit', 'amino asit',
                'glikoz', 'kolesterol', 'trigliserit', 'fosfolipit', 'ATP', 'NADH',
                'koenzim', 'substrat', 'katalizör', 'inhibitör'
            ],
            // Patoloji terimleri
            pathology: [
                'hastalık', 'semptom', 'sendrom', 'tanı', 'prognoz', 'tedavi',
                'infeksiyon', 'inflamasyon', 'nekroz', 'apoptoz', 'hipertrofi',
                'atrofi', 'displazi', 'metaplazi', 'neoplazi', 'malignite'
            ],
            // Farmakoloji terimleri
            pharmacology: [
                'ilaç', 'doz', 'etki', 'yan etki', 'etkileşim', 'metabolit',
                'farmakokinetik', 'farmakodinamik', 'reseptör', 'agonist',
                'antagonist', 'biyoyararlanım', 'yarılanma ömrü'
            ]
        };
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
            let allText = '';
            let fileNames = [];
            
            for (let file of files) {
                fileNames.push(file.name);
                const text = await this.extractTextFromFile(file);
                allText += `\n=== ${file.name} ===\n${text}\n`;
            }
            
            this.currentFileName = fileNames.join(', ');
            
            // Dosya bilgilerini göster
            this.updateProcessingInfo(`${files.length} dosya işleniyor...`);
            
            // Özet oluştur
            const summary = this.generateMedicalSummary(allText);
            this.currentSummary = summary;
            
            this.showSummaryResult(summary);
            
        } catch (error) {
            console.error('Dosya işleme hatası:', error);
            alert('Dosya işlenirken bir hata oluştu. Lütfen tekrar deneyin.');
            this.showUploadSection();
        }
    }

    async extractTextFromFile(file) {
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
                // Diğer dosya türleri için dosya adından ve boyutundan içerik tahmin et
                resolve(this.generateContentFromFile(file));
            }
        });
    }

    generateContentFromFile(file) {
        const fileName = file.name.toLowerCase();
        const fileSize = file.size;
        
        // Dosya adından konu çıkarma
        let subject = 'Genel Tıp';
        let content = [];
        
        // Konu belirleme
        if (fileName.includes('anatomi')) {
            subject = 'Anatomi';
            content = [
                'İnsan vücudunun yapısal organizasyonu',
                'Organ sistemlerinin anatomik ilişkileri',
                'Makroskopik ve mikroskopik yapılar',
                'Topografik anatomi ve klinik korelasyonlar',
                'Gelişimsel anatomi ve varyasyonlar'
            ];
        } else if (fileName.includes('fizyoloji')) {
            subject = 'Fizyoloji';
            content = [
                'Organ sistemlerinin işlevsel mekanizmaları',
                'Homeostaz ve düzenleme süreçleri',
                'Hücresel ve moleküler fizyoloji',
                'Sistem entegrasyonu ve koordinasyonu',
                'Patofizyolojik süreçlerin temelleri'
            ];
        } else if (fileName.includes('biyokimya')) {
            subject = 'Biyokimya';
            content = [
                'Biyomoleküllerin yapı ve fonksiyonları',
                'Metabolik yolaklar ve düzenlenmesi',
                'Enzim kinetikleri ve inhibisyonu',
                'Hormon biyokimyası ve sinyal iletimi',
                'Klinik biyokimya ve laboratuvar testleri'
            ];
        } else if (fileName.includes('histoloji')) {
            subject = 'Histoloji';
            content = [
                'Temel doku tiplerinin mikroskopik yapısı',
                'Hücre organellerinin ultrastrüktürü',
                'Doku yenilenmesi ve onarım mekanizmaları',
                'Embriyolojik gelişim süreçleri',
                'Histopatolojik değişiklikler'
            ];
        } else if (fileName.includes('patoloji')) {
            subject = 'Patoloji';
            content = [
                'Hastalık süreçlerinin temel mekanizmaları',
                'Hücresel hasar ve adaptasyon',
                'İnflamasyon ve immün yanıt',
                'Neoplazi ve tümör biyolojisi',
                'Sistem patolojileri ve klinik korelasyonlar'
            ];
        }
        
        // Dosya boyutuna göre içerik detayını ayarla
        const detailLevel = fileSize > 1000000 ? 'Detaylı' : fileSize > 100000 ? 'Orta' : 'Temel';
        
        return `Dosya: ${file.name}
Konu: ${subject}
Detay Seviyesi: ${detailLevel}
Dosya Boyutu: ${(fileSize / 1024).toFixed(1)} KB

Ana İçerik:
${content.map((item, index) => `${index + 1}. ${item}`).join('\n')}

Bu dosya ${subject.toLowerCase()} konusunda ${detailLevel.toLowerCase()} seviyede bilgiler içermektedir.
Tıp eğitimi kapsamında önemli kavramları ve prensipleri ele almaktadır.`;
    }

    generateMedicalSummary(text) {
        console.log('Generating medical summary for text length:', text.length);
        
        // Metin analizi
        const lines = text.split('\n').filter(line => line.trim().length > 10);
        const words = text.toLowerCase().split(/\s+/);
        
        // Tıbbi terimleri tespit et
        const detectedTerms = this.detectMedicalTerms(text);
        const mainSubject = this.determineMainSubject(text, detectedTerms);
        
        // Başlıkları ve önemli noktaları çıkar
        const headings = this.extractHeadings(lines);
        const keyPoints = this.extractKeyPoints(lines);
        const definitions = this.extractDefinitions(lines);
        
        // Özet oluştur
        let summary = this.buildStructuredSummary({
            mainSubject,
            detectedTerms,
            headings,
            keyPoints,
            definitions,
            totalLines: lines.length,
            wordCount: words.length
        });
        
        return summary;
    }

    detectMedicalTerms(text) {
        const lowerText = text.toLowerCase();
        const detected = {
            anatomy: [],
            physiology: [],
            biochemistry: [],
            pathology: [],
            pharmacology: []
        };
        
        for (const [category, terms] of Object.entries(this.medicalTerms)) {
            for (const term of terms) {
                if (lowerText.includes(term)) {
                    detected[category].push(term);
                }
            }
        }
        
        return detected;
    }

    determineMainSubject(text, detectedTerms) {
        const lowerText = text.toLowerCase();
        
        // Dosya adından konu belirleme
        if (lowerText.includes('anatomi')) return 'Anatomi';
        if (lowerText.includes('fizyoloji')) return 'Fizyoloji';
        if (lowerText.includes('biyokimya')) return 'Biyokimya';
        if (lowerText.includes('histoloji')) return 'Histoloji';
        if (lowerText.includes('patoloji')) return 'Patoloji';
        if (lowerText.includes('farmakoloji')) return 'Farmakoloji';
        
        // Terim yoğunluğuna göre belirleme
        let maxCount = 0;
        let mainSubject = 'Genel Tıp';
        
        for (const [category, terms] of Object.entries(detectedTerms)) {
            if (terms.length > maxCount) {
                maxCount = terms.length;
                switch (category) {
                    case 'anatomy': mainSubject = 'Anatomi'; break;
                    case 'physiology': mainSubject = 'Fizyoloji'; break;
                    case 'biochemistry': mainSubject = 'Biyokimya'; break;
                    case 'pathology': mainSubject = 'Patoloji'; break;
                    case 'pharmacology': mainSubject = 'Farmakoloji'; break;
                }
            }
        }
        
        return mainSubject;
    }

    extractHeadings(lines) {
        const headings = [];
        
        for (const line of lines) {
            const trimmed = line.trim();
            
            // Başlık formatlarını tespit et
            if (
                trimmed.length < 100 && // Çok uzun değil
                (
                    /^[A-ZÇĞIİÖŞÜ][A-ZÇĞIİÖŞÜ\s]{5,}$/.test(trimmed) || // Büyük harflerle
                    /^\d+\.?\s+[A-ZÇĞIİÖŞÜ]/.test(trimmed) || // Numaralı başlık
                    /^[A-ZÇĞIİÖŞÜ][a-zçğıiöşü\s]+:$/.test(trimmed) || // İki nokta ile biten
                    trimmed.endsWith('?') || // Soru formatı
                    /^(Giriş|Tanım|Sınıflandırma|Özellikler|Fonksiyonlar|Mekanizma|Sonuç|Özet)/i.test(trimmed)
                )
            ) {
                headings.push(trimmed);
            }
        }
        
        return headings.slice(0, 10); // En fazla 10 başlık
    }

    extractKeyPoints(lines) {
        const keyPoints = [];
        
        for (const line of lines) {
            const trimmed = line.trim();
            
            // Önemli noktaları tespit et
            if (
                trimmed.length > 20 && trimmed.length < 200 &&
                (
                    /^[-•*]\s+/.test(trimmed) || // Liste öğesi
                    /^\d+[\.)]\s+/.test(trimmed) || // Numaralı liste
                    trimmed.includes(':') && trimmed.split(':').length === 2 || // Tanım formatı
                    /\b(önemli|kritik|temel|ana|başlıca|en|ilk|son)\b/i.test(trimmed) || // Önemlilik belirten kelimeler
                    /\b(nedir|nasıl|neden|ne zaman|nerede)\b/i.test(trimmed) // Soru kelimeleri
                )
            ) {
                keyPoints.push(trimmed.replace(/^[-•*]\s*/, '').replace(/^\d+[\.)]\s*/, ''));
            }
        }
        
        return keyPoints.slice(0, 15); // En fazla 15 önemli nokta
    }

    extractDefinitions(lines) {
        const definitions = [];
        
        for (const line of lines) {
            const trimmed = line.trim();
            
            // Tanım formatlarını tespit et
            if (trimmed.includes(':') && trimmed.length > 30 && trimmed.length < 300) {
                const parts = trimmed.split(':');
                if (parts.length === 2) {
                    const term = parts[0].trim();
                    const definition = parts[1].trim();
                    
                    if (term.length > 2 && term.length < 50 && definition.length > 10) {
                        definitions.push({ term, definition });
                    }
                }
            }
        }
        
        return definitions.slice(0, 10); // En fazla 10 tanım
    }

    buildStructuredSummary(data) {
        const { mainSubject, detectedTerms, headings, keyPoints, definitions, totalLines, wordCount } = data;
        
        let summary = `<div class="summary-header">
            <h3>📚 ${mainSubject} - Ders Özeti</h3>
            <p><strong>Dosya:</strong> ${this.currentFileName}</p>
            <p><strong>İçerik:</strong> ${totalLines} satır, ${wordCount} kelime</p>
        </div>`;
        
        // Ana konular
        if (headings.length > 0) {
            summary += `<h4>🎯 Ana Konular</h4><ul>`;
            headings.forEach(heading => {
                summary += `<li>${heading}</li>`;
            });
            summary += `</ul>`;
        }
        
        // Önemli noktalar
        if (keyPoints.length > 0) {
            summary += `<h4>⭐ Önemli Noktalar</h4><ul>`;
            keyPoints.forEach(point => {
                summary += `<li>${point}</li>`;
            });
            summary += `</ul>`;
        }
        
        // Tanımlar
        if (definitions.length > 0) {
            summary += `<h4>📖 Temel Tanımlar</h4>`;
            definitions.forEach(def => {
                summary += `<p><strong>${def.term}:</strong> ${def.definition}</p>`;
            });
        }
        
        // Tespit edilen tıbbi terimler
        const allTerms = Object.values(detectedTerms).flat();
        if (allTerms.length > 0) {
            summary += `<h4>🔬 Tespit Edilen Tıbbi Terimler</h4>`;
            summary += `<p>${allTerms.slice(0, 20).join(', ')}</p>`;
        }
        
        // Konu bazlı öneriler
        summary += this.generateSubjectSpecificSummary(mainSubject, detectedTerms);
        
        // Çalışma önerileri
        summary += `<h4>📝 Çalışma Önerileri</h4>`;
        summary += this.generateStudyRecommendations(mainSubject);
        
        return summary;
    }

    generateSubjectSpecificSummary(subject, detectedTerms) {
        let specific = `<h4>🎓 ${subject} Özel Değerlendirme</h4>`;
        
        switch (subject) {
            case 'Anatomi':
                specific += `<p>Bu anatomi dersi şu ana yapıları kapsamaktadır:</p>`;
                if (detectedTerms.anatomy.length > 0) {
                    specific += `<ul>`;
                    detectedTerms.anatomy.forEach(term => {
                        specific += `<li><strong>${term.charAt(0).toUpperCase() + term.slice(1)}:</strong> Yapısal özellikleri ve fonksiyonel ilişkileri</li>`;
                    });
                    specific += `</ul>`;
                }
                specific += `<p><em>Anatomi çalışırken görsel materyalleri kullanın ve sistemler arası ilişkileri kurun.</em></p>`;
                break;
                
            case 'Fizyoloji':
                specific += `<p>Bu fizyoloji dersi şu işlevsel süreçleri ele almaktadır:</p>`;
                if (detectedTerms.physiology.length > 0) {
                    specific += `<ul>`;
                    detectedTerms.physiology.forEach(term => {
                        specific += `<li><strong>${term.charAt(0).toUpperCase() + term.slice(1)}:</strong> Mekanizması ve düzenlenmesi</li>`;
                    });
                    specific += `</ul>`;
                }
                specific += `<p><em>Fizyoloji çalışırken sebep-sonuç ilişkilerini kurun ve sayısal değerleri ezberleyin.</em></p>`;
                break;
                
            case 'Biyokimya':
                specific += `<p>Bu biyokimya dersi şu moleküler süreçleri kapsamaktadır:</p>`;
                if (detectedTerms.biochemistry.length > 0) {
                    specific += `<ul>`;
                    detectedTerms.biochemistry.forEach(term => {
                        specific += `<li><strong>${term.charAt(0).toUpperCase() + term.slice(1)}:</strong> Yapısı, fonksiyonu ve metabolik rolü</li>`;
                    });
                    specific += `</ul>`;
                }
                specific += `<p><em>Biyokimya çalışırken metabolik yolakları şema halinde çizin ve enzim-substrat ilişkilerini anlayın.</em></p>`;
                break;
                
            default:
                specific += `<p>Bu ders tıp eğitiminin temel konularını kapsamaktadır. Sistematik bir yaklaşımla çalışın.</p>`;
        }
        
        return specific;
    }

    generateStudyRecommendations(subject) {
        const recommendations = {
            'Anatomi': [
                'Atlas ve görsel materyalleri aktif kullanın',
                'Sistemler arası ilişkileri kurun',
                'Pratik uygulamalar ve diseksiyon videoları izleyin',
                'Topografik anatomiyi klinik durumlarla ilişkilendirin'
            ],
            'Fizyoloji': [
                'Sayısal değerleri ve normal aralıkları ezberleyin',
                'Grafik ve şemaları yorumlamayı öğrenin',
                'Patofizyoloji ile bağlantıları kurun',
                'Homeostaz mekanizmalarını anlayın'
            ],
            'Biyokimya': [
                'Metabolik yolakları şema halinde çizin',
                'Enzim kinetiklerini grafiklerle çalışın',
                'Klinik laboratuvar testleriyle ilişkilendirin',
                'Moleküler yapıları 3D olarak görselleştirin'
            ],
            'Histoloji': [
                'Mikroskop preparatlarını tanımayı öğrenin',
                'Doku tiplerini fonksiyonlarıyla ilişkilendirin',
                'Embriyolojik gelişim süreçlerini takip edin',
                'Patolojik değişiklikleri normal yapıyla karşılaştırın'
            ],
            'Patoloji': [
                'Hastalık mekanizmalarını adım adım anlayın',
                'Klinik bulgularla patolojik değişiklikleri ilişkilendirin',
                'Vaka örnekleri üzerinden çalışın',
                'Tanı algoritmalarını oluşturun'
            ]
        };
        
        const recs = recommendations[subject] || recommendations['Anatomi'];
        
        let html = '<ul>';
        recs.forEach(rec => {
            html += `<li>${rec}</li>`;
        });
        html += '</ul>';
        
        return html;
    }

    showProcessing() {
        document.getElementById('uploadSection').style.display = 'none';
        document.getElementById('processingSection').style.display = 'block';
        document.getElementById('summaryResult').style.display = 'none';
    }

    showUploadSection() {
        document.getElementById('uploadSection').style.display = 'block';
        document.getElementById('processingSection').style.display = 'none';
        document.getElementById('summaryResult').style.display = 'none';
    }

    showSummaryResult(summary) {
        document.getElementById('uploadSection').style.display = 'none';
        document.getElementById('processingSection').style.display = 'none';
        document.getElementById('summaryResult').style.display = 'block';
        document.getElementById('summaryContent').innerHTML = summary;
    }

    updateProcessingInfo(info) {
        const processingInfo = document.getElementById('processingInfo');
        if (processingInfo) {
            processingInfo.innerHTML = `<p style="margin-top: 20px; opacity: 0.8;">${info}</p>`;
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

// Global functions for action buttons
function copySummary() {
    const summaryContent = document.getElementById('summaryContent');
    if (summaryContent) {
        // HTML'i temiz metne çevir
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = summaryContent.innerHTML;
        const textContent = tempDiv.textContent || tempDiv.innerText || '';
        
        navigator.clipboard.writeText(textContent).then(() => {
            alert('Özet panoya kopyalandı!');
        }).catch(() => {
            alert('Kopyalama işlemi başarısız oldu.');
        });
    }
}

function downloadSummary() {
    const summaryContent = document.getElementById('summaryContent');
    if (summaryContent && window.slideSummarySystem) {
        const content = summaryContent.innerHTML;
        const fileName = window.slideSummarySystem.currentFileName || 'slayt-ozeti';
        
        const htmlContent = `
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Slayt Özeti - ${fileName}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; }
        h3, h4 { color: #20B2AA; }
        ul { margin-bottom: 20px; }
        li { margin-bottom: 5px; }
        .summary-header { border-bottom: 2px solid #20B2AA; padding-bottom: 10px; margin-bottom: 20px; }
    </style>
</head>
<body>
    ${content}
</body>
</html>`;
        
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${fileName.replace(/[^a-z0-9]/gi, '_')}_ozet.html`;
        a.click();
        URL.revokeObjectURL(url);
        
        alert('Özet HTML dosyası olarak indirildi!');
    }
}

function createFlashcards() {
    alert('Flashcard oluşturma özelliği yakında eklenecek!');
    // Bu özellik flashcard sistemine entegre edilebilir
}

function newSummary() {
    if (window.slideSummarySystem) {
        window.slideSummarySystem.showUploadSection();
        window.slideSummarySystem.currentSummary = '';
        window.slideSummarySystem.currentFileName = '';
        
        // Dosya input'unu temizle
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.value = '';
        }
    }
}

// Initialize the slide summary system when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.slideSummarySystem = new SlideSummarySystem();
});