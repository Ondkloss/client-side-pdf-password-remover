class PDFPasswordRemover {
    constructor() {
        this.currentFiles = [];
        this.processedFiles = [];
        this.isBatchMode = false;
        this.processedPDF = null; // Keep for single file compatibility
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
        this.fileListSection = document.getElementById('fileListSection');
        this.fileList = document.getElementById('fileList');
        this.clearFilesBtn = document.getElementById('clearFilesBtn');
        this.notEncryptedSection = document.getElementById('notEncryptedSection');
        this.downloadOriginalBtn = document.getElementById('downloadOriginalBtn');
        this.resetBtn2 = document.getElementById('resetBtn2');
        this.passwordSection = document.getElementById('passwordSection');
        this.passwordInput = document.getElementById('passwordInput');
        this.removePasswordBtn = document.getElementById('removePasswordBtn');
        this.resultSection = document.getElementById('resultSection');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.batchResultSection = document.getElementById('batchResultSection');
        this.processedFilesList = document.getElementById('processedFilesList');
        this.downloadAllBtn = document.getElementById('downloadAllBtn');
        this.resetBatchBtn = document.getElementById('resetBatchBtn');
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
                this.handleFileSelect(Array.from(e.target.files));
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
            
            const files = Array.from(e.dataTransfer.files).filter(file => file.type === 'application/pdf');
            if (files.length > 0) {
                this.handleFileSelect(files);
            } else {
                this.showError('Please drop valid PDF file(s).');
            }
        });

        // Clear files button
        this.clearFilesBtn.addEventListener('click', () => {
            this.clearFiles();
        });

        // Download all button
        this.downloadAllBtn.addEventListener('click', () => {
            this.downloadAllFiles();
        });

        // Reset batch button
        this.resetBatchBtn.addEventListener('click', () => {
            this.reset();
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

    async handleFileSelect(files) {
        // Validate all files are PDFs
        const invalidFiles = files.filter(file => file.type !== 'application/pdf');
        if (invalidFiles.length > 0) {
            this.showError('Please select only valid PDF files.');
            return;
        }

        this.currentFiles = files;
        this.isBatchMode = files.length > 1;
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

            // Process each file to check encryption status
            const fileStates = [];
            for (const file of files) {
                try {
                    const arrayBuffer = await file.arrayBuffer();
                    const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
                    
                    fileStates.push({
                        file: file,
                        isEncrypted: pdfDoc.isEncrypted,
                        status: pdfDoc.isEncrypted ? 'encrypted' : 'not-encrypted'
                    });
                } catch (error) {
                    fileStates.push({
                        file: file,
                        isEncrypted: null,
                        status: 'error',
                        error: error.message
                    });
                }
            }

            this.hideSection(this.loading);

            if (this.isBatchMode) {
                this.displayFileList(fileStates);
                
                // Check if any files are encrypted
                const encryptedFiles = fileStates.filter(state => state.isEncrypted);
                const notEncryptedFiles = fileStates.filter(state => !state.isEncrypted && state.status !== 'error');
                
                if (encryptedFiles.length > 0) {
                    // Show password section for encrypted files
                    this.showSection(this.passwordSection);
                    this.passwordInput.focus();
                } else if (notEncryptedFiles.length === files.length) {
                    // All files are not encrypted
                    this.handleNotEncryptedBatch(fileStates);
                }
            } else {
                // Single file mode - maintain existing behavior
                const fileState = fileStates[0];
                if (fileState.status === 'error') {
                    this.showSection(this.uploadArea);
                    this.showError('Failed to process PDF. Please check if the file is valid and try again.');
                } else if (fileState.isEncrypted) {
                    this.showSection(this.passwordSection);
                    this.passwordInput.focus();
                } else {
                    this.showSection(this.notEncryptedSection);
                }
            }

        } catch (error) {
            console.error('Error checking PDF encryption:', error);
            this.hideSection(this.loading);
            this.showSection(this.uploadArea);
            this.showError('Failed to process PDF(s). Please check if the files are valid and try again.');
        }
    }

    displayFileList(fileStates) {
        this.fileList.innerHTML = '';
        
        fileStates.forEach((state, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = `file-item ${state.status}`;
            
            const fileInfo = document.createElement('div');
            fileInfo.className = 'file-info';
            
            const fileName = document.createElement('div');
            fileName.className = 'file-name';
            fileName.textContent = state.file.name;
            
            const fileStatus = document.createElement('div');
            fileStatus.className = 'file-status';
            
            switch (state.status) {
                case 'encrypted':
                    fileStatus.textContent = 'Password protected';
                    break;
                case 'not-encrypted':
                    fileStatus.textContent = 'Not password protected';
                    break;
                case 'error':
                    fileStatus.textContent = `Error: ${state.error}`;
                    break;
            }
            
            fileInfo.appendChild(fileName);
            fileInfo.appendChild(fileStatus);
            fileItem.appendChild(fileInfo);
            
            this.fileList.appendChild(fileItem);
        });
        
        this.showSection(this.fileListSection);
    }

    handleNotEncryptedBatch(fileStates) {
        // For non-encrypted files in batch mode, show a special message
        this.notEncryptedSection.innerHTML = `
            <h3>✅ ${fileStates.length > 1 ? 'Files are' : 'File is'} not encrypted</h3>
            <p>${fileStates.length > 1 ? 'These PDF files are' : 'This PDF file is'} not password-protected and don't need to be unlocked.</p>
            <button id="downloadOriginalBatchBtn" class="download-btn">Download All Original PDFs</button>
            <button id="resetBtn2" class="reset-btn">Process Other PDFs</button>
        `;
        
        // Add event listener for batch download
        document.getElementById('downloadOriginalBatchBtn').addEventListener('click', () => {
            this.downloadOriginalBatch();
        });
        
        this.showSection(this.notEncryptedSection);
    }

    clearFiles() {
        this.currentFiles = [];
        this.processedFiles = [];
        this.isBatchMode = false;
        this.hideSection(this.fileListSection);
        this.hideSection(this.passwordSection);
        this.hideSection(this.notEncryptedSection);
        this.showSection(this.uploadArea);
        this.hideError();
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

        if (this.currentFiles.length === 0) {
            this.showError('No PDF files selected.');
            return;
        }

        this.hideError();
        this.hideSection(this.passwordSection);
        this.hideSection(this.fileListSection);
        this.showSection(this.loading);

        try {
            if (this.isBatchMode) {
                await this.processBatchFiles(password);
            } else {
                await this.processSingleFile(password);
            }

        } catch (error) {
            console.error('Error processing PDF(s):', error);
            this.hideSection(this.loading);
            
            if (this.isBatchMode) {
                this.showSection(this.fileListSection);
            }
            this.showSection(this.passwordSection);
            
            if (error.message.includes('password') || error.message.includes('encrypted')) {
                this.showError('Incorrect password. Please try again.');
            } else if (error.message.includes('Invalid PDF')) {
                this.showError('Invalid or corrupted PDF file.');
            } else {
                this.showError('Failed to process PDF(s). Please check if the files are valid and try again.');
            }
            
            this.passwordInput.value = '';
            this.passwordInput.focus();
        }
    }

    async processSingleFile(password) {
        const file = this.currentFiles[0];
        const arrayBuffer = await file.arrayBuffer();
        
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
    }

    async processBatchFiles(password) {
        this.processedFiles = [];
        const errors = [];

        for (const file of this.currentFiles) {
            try {
                const arrayBuffer = await file.arrayBuffer();
                
                // Check if file is encrypted
                const checkDoc = await PDFLib.PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
                
                let processedBytes;
                if (checkDoc.isEncrypted) {
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

                    processedBytes = await newPdfDoc.save();
                } else {
                    // File is not encrypted, use original bytes
                    processedBytes = new Uint8Array(arrayBuffer);
                }

                this.processedFiles.push({
                    originalFile: file,
                    processedBytes: processedBytes,
                    status: 'success'
                });

            } catch (error) {
                console.error(`Error processing ${file.name}:`, error);
                errors.push({ file: file, error: error.message });
                this.processedFiles.push({
                    originalFile: file,
                    processedBytes: null,
                    status: 'error',
                    error: error.message
                });
            }
        }

        this.hideSection(this.loading);

        if (errors.length === this.currentFiles.length) {
            // All files failed
            throw new Error('Failed to process all files');
        } else {
            // At least some files succeeded
            this.displayBatchResults();
        }
    }

    displayBatchResults() {
        this.processedFilesList.innerHTML = '';
        
        const successfulFiles = this.processedFiles.filter(file => file.status === 'success');
        const failedFiles = this.processedFiles.filter(file => file.status === 'error');
        
        if (successfulFiles.length > 0) {
            successfulFiles.forEach((processedFile, index) => {
                const fileItem = document.createElement('div');
                fileItem.className = 'processed-file-item';
                
                const fileInfo = document.createElement('div');
                fileInfo.className = 'processed-file-info';
                
                const fileName = document.createElement('div');
                fileName.className = 'processed-file-name';
                fileName.textContent = this.getDownloadFilename(processedFile.originalFile);
                
                const fileSize = document.createElement('div');
                fileSize.className = 'processed-file-size';
                fileSize.textContent = `${(processedFile.processedBytes.length / 1024).toFixed(1)} KB`;
                
                fileInfo.appendChild(fileName);
                fileInfo.appendChild(fileSize);
                
                const downloadBtn = document.createElement('button');
                downloadBtn.className = 'download-individual-btn';
                downloadBtn.textContent = 'Download';
                downloadBtn.addEventListener('click', () => {
                    this.downloadIndividualFile(processedFile);
                });
                
                fileItem.appendChild(fileInfo);
                fileItem.appendChild(downloadBtn);
                this.processedFilesList.appendChild(fileItem);
            });
        }
        
        if (failedFiles.length > 0) {
            const errorSection = document.createElement('div');
            errorSection.innerHTML = `<h4 style="color: #e53e3e; margin: 1rem 0;">Failed to process ${failedFiles.length} file(s)</h4>`;
            failedFiles.forEach(failedFile => {
                const errorItem = document.createElement('div');
                errorItem.style.cssText = 'padding: 0.5rem; background: #fef5f5; border-radius: 4px; margin-bottom: 0.5rem; border-left: 4px solid #e53e3e;';
                errorItem.innerHTML = `<strong>${failedFile.originalFile.name}</strong>: ${failedFile.error}`;
                errorSection.appendChild(errorItem);
            });
            this.processedFilesList.appendChild(errorSection);
        }
        
        this.showSection(this.batchResultSection);
    }

    downloadIndividualFile(processedFile) {
        const blob = new Blob([processedFile.processedBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = this.getDownloadFilename(processedFile.originalFile);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
    }

    async downloadAllFiles() {
        const successfulFiles = this.processedFiles.filter(file => file.status === 'success');
        
        if (successfulFiles.length === 0) {
            this.showError('No successfully processed files to download.');
            return;
        }

        // Download files one by one with a small delay
        for (let i = 0; i < successfulFiles.length; i++) {
            this.downloadIndividualFile(successfulFiles[i]);
            // Small delay to prevent browser blocking multiple downloads
            if (i < successfulFiles.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
    }

    downloadOriginalBatch() {
        this.currentFiles.forEach((file, index) => {
            setTimeout(() => {
                const url = URL.createObjectURL(file);
                const a = document.createElement('a');
                a.href = url;
                a.download = file.name;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, index * 100); // Stagger downloads
        });
    }

    downloadOriginalPDF() {
        const currentFile = this.currentFiles[0];
        if (!currentFile) {
            this.showError('No PDF file available for download.');
            return;
        }

        const url = URL.createObjectURL(currentFile);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = currentFile.name;
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

    getDownloadFilename(file = null) {
        const targetFile = file || this.currentFiles[0];
        if (targetFile) {
            const originalName = targetFile.name;
            const nameWithoutExt = originalName.replace(/\.pdf$/i, '');
            return `${nameWithoutExt}_unlocked.pdf`;
        }
        return 'unlocked.pdf';
    }

    reset() {
        this.currentFiles = [];
        this.processedFiles = [];
        this.isBatchMode = false;
        this.processedPDF = null;
        this.passwordInput.value = '';
        this.fileInput.value = '';
        
        this.hideError();
        this.hideSection(this.fileListSection);
        this.hideSection(this.notEncryptedSection);
        this.hideSection(this.passwordSection);
        this.hideSection(this.resultSection);
        this.hideSection(this.batchResultSection);
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