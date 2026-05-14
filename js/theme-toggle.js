/**
 * LocalClaw Theme Toggle - Light/Dark Mode
 * Gère le basculement entre les modes sombre et clair
 */

(function() {
    'use strict';
    
    // Clé localStorage pour la préférence de thème
    const THEME_KEY = 'localclaw-theme';
    
    // Récupère le thème stocké ou définit 'dark' par défaut
    function getStoredTheme() {
        try {
            return localStorage.getItem(THEME_KEY) || 'dark';
        } catch (e) {
            return 'dark';
        }
    }
    
    // Sauvegarde le thème dans localStorage
    function setStoredTheme(theme) {
        try {
            localStorage.setItem(THEME_KEY, theme);
        } catch (e) {
            // Ignore les erreurs localStorage (mode privé, etc.)
        }
    }
    
    // Applique le thème au document
    function applyTheme(theme) {
        const html = document.documentElement;
        
        if (theme === 'light') {
            html.classList.remove('dark');
            html.classList.add('light');
            document.body.classList.remove('bg-black');
            document.body.classList.add('bg-gray-50');
            
            // Met à jour le meta theme-color pour mobile
            const metaThemeColor = document.querySelector('meta[name="theme-color"]');
            if (metaThemeColor) {
                metaThemeColor.setAttribute('content', '#f8fafc');
            }
        } else {
            html.classList.remove('light');
            html.classList.add('dark');
            document.body.classList.remove('bg-gray-50');
            document.body.classList.add('bg-black');
            
            const metaThemeColor = document.querySelector('meta[name="theme-color"]');
            if (metaThemeColor) {
                metaThemeColor.setAttribute('content', '#050505');
            }
        }
        
        // Met à jour l'icône du bouton si présent
        updateToggleIcon(theme);
    }
    
    // Met à jour l'icône du bouton toggle
    function updateToggleIcon(theme) {
        const sunIcon = document.getElementById('theme-icon-sun');
        const moonIcon = document.getElementById('theme-icon-moon');
        
        if (sunIcon && moonIcon) {
            if (theme === 'light') {
                sunIcon.classList.add('hidden');
                moonIcon.classList.remove('hidden');
            } else {
                sunIcon.classList.remove('hidden');
                moonIcon.classList.add('hidden');
            }
        }
    }
    
    // Bascule entre les thèmes
    function toggleTheme() {
        const currentTheme = getStoredTheme();
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        setStoredTheme(newTheme);
        applyTheme(newTheme);
    }
    
    // Expose la fonction toggle globalement
    window.toggleLocalClawTheme = toggleTheme;
    
    // Initialise le thème au chargement
    function init() {
        const savedTheme = getStoredTheme();
        applyTheme(savedTheme);
    }
    
    // Lance l'initialisation immédiatement ou après DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();
