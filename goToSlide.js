document.addEventListener('DOMContentLoaded', () => {
    const goToSlideBtn = document.getElementById('goToSlideBtn');
    const goToSlideDialog = document.getElementById('goToSlideDialog');
    const goToSlideDialogTitle = document.getElementById('goToSlideDialogTitle');
    const slideNumberInput = document.getElementById('slideNumberInput');
    const goToSlideConfirmBtn = document.getElementById('goToSlideConfirmBtn');
    const goToSlideCancelBtn = document.getElementById('goToSlideCancelBtn');

    if (goToSlideBtn) {
        goToSlideBtn.addEventListener('click', async () => {
            if (window.presentationApp && window.electronAPI) {
                const totalSlides = window.presentationApp.totalSlides;
                goToSlideDialogTitle.textContent = await window.electronAPI.getLocalizedString('prompt_go_to_slide', totalSlides);
                slideNumberInput.value = window.presentationApp.currentSlide; // Set current slide as default
                goToSlideConfirmBtn.textContent = await window.electronAPI.getLocalizedString('confirm_button');
                goToSlideCancelBtn.textContent = await window.electronAPI.getLocalizedString('cancel_button');
                goToSlideDialog.classList.add('show');
                slideNumberInput.focus();
                slideNumberInput.select();
            }
        });
    }

    goToSlideConfirmBtn.addEventListener('click', () => {
        const slideNumber = parseInt(slideNumberInput.value, 10);
        const totalSlides = window.presentationApp.totalSlides;
        if (!isNaN(slideNumber) && slideNumber >= 1 && slideNumber <= totalSlides) {
            window.presentationApp.goToSlide(slideNumber);
            goToSlideDialog.classList.remove('show');
        } else {
            window.electronAPI.getLocalizedString('alert_invalid_slide_number', totalSlides).then(message => {
                alert(message);
            });
        }
    });

    goToSlideCancelBtn.addEventListener('click', () => {
        goToSlideDialog.classList.remove('show');
    });

    // Close dialog on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && goToSlideDialog.classList.contains('show')) {
            goToSlideDialog.classList.remove('show');
        }
    });
});