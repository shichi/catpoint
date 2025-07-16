document.addEventListener('DOMContentLoaded', () => {
    const goToSlideBtn = document.getElementById('goToSlideBtn');

    if (goToSlideBtn) {
        goToSlideBtn.addEventListener('click', async () => {
            if (window.presentationApp && window.electronAPI) {
                const totalSlides = window.presentationApp.totalSlides;
                const promptMessage = await window.electronAPI.getLocalizedString('prompt_go_to_slide', totalSlides);
                const slideNumberStr = prompt(promptMessage);
                
                const slideNumber = parseInt(slideNumberStr, 10);
                if (!isNaN(slideNumber) && slideNumber >= 1 && slideNumber <= totalSlides) {
                    window.presentationApp.goToSlide(slideNumber);
                } else if (slideNumberStr !== null) {
                    const alertMessage = await window.electronAPI.getLocalizedString('alert_invalid_slide_number', totalSlides);
                    alert(alertMessage);
                }
            }
        });
    }
});