class PDFPasswordRemover {
    constructor() {
        this.currentFile = null;
        this.processedPDF = null;
        this.initializeElements();
        this.checkPDFLibAvailability();
        this.attachEventListeners();
    }

    checkPDFLibAvailability() {
        // Check if PDF-lib is available
        if (typeof PDFLib === 'undefined') {
            this.showError('PDF-lib library is not available. Please ensure you have an internet connection or host the library locally.');
            this.uploadArea.style.opacity = '0.5';
            this.uploadArea.style.pointerEvents = 'none';
            return false;
        }
        return true;
    }

    initializeElements() {
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('fileInput');
        this.notEncryptedSection = document.getElementById('notEncryptedSection');
        this.downloadOriginalBtn = document.getElementById('downloadOriginalBtn');
        this.resetBtn2 = document.getElementById('resetBtn2');
        this.passwordSection = document.getElementById('passwordSection');
        this.passwordInput = document.getElementById('passwordInput');
        this.removePasswordBtn = document.getElementById('removePasswordBtn');
        this.resultSection = document.getElementById('resultSection');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.loading = document.getElementById('loading');
        this.errorMessage = document.getElementById('errorMessage');
    }

    attachEventListeners() {
        // Upload area click
        this.uploadArea.addEventListener('click', () => {
            this.fileInput.click();
        });

        // File input change
        this.fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFileSelect(e.target.files[0]);
            }
        });

        // Drag and drop
        this.uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.uploadArea.classList.add('dragover');
        });

        this.uploadArea.addEventListener('dragleave', () => {
            this.uploadArea.classList.remove('dragover');
        });

        this.uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            this.uploadArea.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0 && files[0].type === 'application/pdf') {
                this.handleFileSelect(files[0]);
            } else {
                this.showError('Please drop a valid PDF file.');
            }
        });

        // Password removal
        this.removePasswordBtn.addEventListener('click', () => {
            this.removePassword();
        });

        // Enter key in password input
        this.passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.removePassword();
            }
        });

        // Download original button
        this.downloadOriginalBtn.addEventListener('click', () => {
            this.downloadOriginalPDF();
        });

        // Reset button 2
        this.resetBtn2.addEventListener('click', () => {
            this.reset();
        });

        // Download button
        this.downloadBtn.addEventListener('click', () => {
            this.downloadPDF();
        });

        // Reset button
        this.resetBtn.addEventListener('click', () => {
            this.reset();
        });
    }

    async handleFileSelect(file) {
        if (file.type !== 'application/pdf') {
            this.showError('Please select a valid PDF file.');
            return;
        }

        this.currentFile = file;
        this.hideError();
        this.hideSection(this.uploadArea);
        this.showSection(this.loading);

        try {
            // Check if PDF-lib is available
            if (!this.checkPDFLibAvailability()) {
                this.hideSection(this.loading);
                this.showSection(this.uploadArea);
                return;
            }

            const arrayBuffer = await file.arrayBuffer();
            
            // Load the PDF with ignoreEncryption to check if it's encrypted
            const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
            
            this.hideSection(this.loading);
            
            if (pdfDoc.isEncrypted) {
                // PDF is encrypted, show password section
                this.showSection(this.passwordSection);
                this.passwordInput.focus();
            } else {
                // PDF is not encrypted, show not encrypted section
                this.showSection(this.notEncryptedSection);
            }

        } catch (error) {
            console.error('Error checking PDF encryption:', error);
            this.hideSection(this.loading);
            this.showSection(this.uploadArea);
            this.showError('Failed to process PDF. Please check if the file is valid and try again.');
        }
    }

    async removePassword() {
        // Check if PDF-lib is available before proceeding
        if (!this.checkPDFLibAvailability()) {
            return;
        }

        const password = this.passwordInput.value.trim();
        
        if (!password) {
            this.showError('Please enter a password.');
            return;
        }

        if (!this.currentFile) {
            this.showError('No PDF file selected.');
            return;
        }

        this.hideError();
        this.hideSection(this.passwordSection);
        this.showSection(this.loading);

        try {
            const arrayBuffer = await this.currentFile.arrayBuffer();
            
            // Try to load the PDF with the provided password
            const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer, { 
                password: password,
                ignoreEncryption: false 
            });

            // Create a new PDF without password protection
            const newPdfDoc = await PDFLib.PDFDocument.create();
            
            // Copy all pages from the original PDF
            const pageIndices = pdfDoc.getPageIndices();
            const copiedPages = await newPdfDoc.copyPages(pdfDoc, pageIndices);
            
            copiedPages.forEach((page) => {
                newPdfDoc.addPage(page);
            });

            // Generate the new PDF bytes
            this.processedPDF = await newPdfDoc.save();

            this.hideSection(this.loading);
            this.showSection(this.resultSection);

        } catch (error) {
            console.error('Error processing PDF:', error);
            this.hideSection(this.loading);
            this.showSection(this.passwordSection);
            
            if (error.message.includes('password') || error.message.includes('encrypted')) {
                this.showError('Incorrect password. Please try again.');
            } else if (error.message.includes('Invalid PDF')) {
                this.showError('Invalid or corrupted PDF file.');
            } else {
                this.showError('Failed to process PDF. Please check if the file is valid and try again.');
            }
            
            this.passwordInput.value = '';
            this.passwordInput.focus();
        }
    }

    downloadOriginalPDF() {
        if (!this.currentFile) {
            this.showError('No PDF file available for download.');
            return;
        }

        const url = URL.createObjectURL(this.currentFile);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = this.currentFile.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
    }

    downloadPDF() {
        if (!this.processedPDF) {
            this.showError('No processed PDF available for download.');
            return;
        }

        const blob = new Blob([this.processedPDF], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = this.getDownloadFilename();
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
    }

    getDownloadFilename() {
        if (this.currentFile) {
            const originalName = this.currentFile.name;
            const nameWithoutExt = originalName.replace(/\.pdf$/i, '');
            return `${nameWithoutExt}_unlocked.pdf`;
        }
        return 'unlocked.pdf';
    }

    reset() {
        this.currentFile = null;
        this.processedPDF = null;
        this.passwordInput.value = '';
        this.fileInput.value = '';
        
        this.hideError();
        this.hideSection(this.notEncryptedSection);
        this.hideSection(this.passwordSection);
        this.hideSection(this.resultSection);
        this.hideSection(this.loading);
        this.showSection(this.uploadArea);
    }

    showSection(element) {
        element.style.display = 'block';
    }

    hideSection(element) {
        element.style.display = 'none';
    }

    showError(message) {
        this.errorMessage.textContent = message;
        this.errorMessage.classList.add('show');
    }

    hideError() {
        this.errorMessage.classList.remove('show');
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PDFPasswordRemover();
});

// Prevent default drag behaviors on the entire document
document.addEventListener('dragover', (e) => e.preventDefault());
document.addEventListener('drop', (e) => e.preventDefault());