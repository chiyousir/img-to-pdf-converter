document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const nav = document.querySelector('nav');
    
    // Toggle mobile menu
    mobileMenuBtn.addEventListener('click', function() {
        nav.classList.toggle('active');
        toggleMobileMenuAnimation();
    });
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', function(event) {
        const isClickInsideNav = nav.contains(event.target);
        const isClickOnMenuBtn = mobileMenuBtn.contains(event.target);
        
        if (!isClickInsideNav && !isClickOnMenuBtn && nav.classList.contains('active')) {
            nav.classList.remove('active');
            resetMobileMenuAnimation();
        }
    });
    
    // Close mobile menu on window resize (if moving to desktop size)
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768 && nav.classList.contains('active')) {
            nav.classList.remove('active');
            resetMobileMenuAnimation();
        }
    });
    
    // Mobile menu button animation
    function toggleMobileMenuAnimation() {
        const spans = mobileMenuBtn.querySelectorAll('span');
        
        if (nav.classList.contains('active')) {
            spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
            spans[1].style.opacity = '0';
            spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
        } else {
            resetMobileMenuAnimation();
        }
    }
    
    function resetMobileMenuAnimation() {
        const spans = mobileMenuBtn.querySelectorAll('span');
        spans[0].style.transform = 'none';
        spans[1].style.opacity = '1';
        spans[2].style.transform = 'none';
    }
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            
            // Close mobile menu if open
            if (nav.classList.contains('active')) {
                nav.classList.remove('active');
                resetMobileMenuAnimation();
            }
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}); 