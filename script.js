// Setup PDF.js to display the PDF
const pdfUrl = 'http://localhost:8000/TestSignature.pdf';  // Replace this with the path to your PDF file

const pdfjsLib = window['pdfjs-dist/build/pdf'];
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js';

const loadingTask = pdfjsLib.getDocument(pdfUrl);
const pdfCanvas = document.getElementById('pdf-canvas');
const signaturePadCanvas = document.getElementById('signature-pad');
let signaturePad;

loadingTask.promise.then(function(pdf) {
    pdf.getPage(1).then(function(page) {
        const scale = 1.5;
        const viewport = page.getViewport({ scale: scale });

        const context = pdfCanvas.getContext('2d');
        pdfCanvas.height = viewport.height;
        pdfCanvas.width = viewport.width;
        
        signaturePadCanvas.height = viewport.height;
        signaturePadCanvas.width = viewport.width;
        
        const renderContext = {
            canvasContext: context,
            viewport: viewport
        };
        page.render(renderContext);

        // Initialize signature pad on top of the PDF canvas
        signaturePad = new SignaturePad(signaturePadCanvas, {
            backgroundColor: 'rgba(0, 0, 0, 0)',  // Transparent background
        });
    });
});

// Clear signature button functionality
document.getElementById('clear-signature').addEventListener('click', function () {
    signaturePad.clear();
});

// Save signed PDF
document.getElementById('save-pdf').addEventListener('click', async function () {
    if (signaturePad.isEmpty()) {
        alert("Please provide a signature first.");
        return;
    }

    // Get the signature as a PNG data URL
    const signatureDataUrl = signaturePad.toDataURL();

    // Load the existing PDF using PDF-lib
    const existingPdfBytes = await fetch(pdfUrl).then(res => res.arrayBuffer());
    const pdfDoc = await PDFLib.PDFDocument.load(existingPdfBytes);

    // Embed the signature image in the PDF
    const signatureImage = await pdfDoc.embedPng(signatureDataUrl);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];

    // Place the signature on the PDF (position and size can be adjusted)
    const { width, height } = signatureImage.scale(0.25);  // Scale down the image
    firstPage.drawImage(signatureImage, {
        x: firstPage.getWidth() - width - 50,
        y: 50,
        width: width,
        height: height,
    });

    // Save the modified PDF
    const pdfBytes = await pdfDoc.save();

    // Create a download link for the signed PDF
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'signed.pdf';
    link.click();
});
