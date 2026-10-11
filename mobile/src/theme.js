/**
 * Bethany Homestay Mobile Application - Theme & Design Tokens
 * Himalayan Boutique Aesthetics
 */

export const colors = {
    // Primary Himalayan Palette
    forest: '#23483B',
    forestDark: '#162E25',
    forestLight: '#2D5B4B',
    forestSubtle: 'rgba(35, 72, 59, 0.08)',

    beige: '#EAE3D5',
    beigeLight: '#F4EFE6',
    beigeDark: '#D8CEBC',

    ivory: '#F8F6F0',
    ivoryWarm: '#FAF8F5',

    grey: '#625C50',
    greyLight: '#8E8779',
    greySubtle: '#DCD8D0',

    terracotta: '#B86B42',
    terracottaDark: '#9E5632',
    gold: '#C5A059',
    goldLight: '#DFC386',

    // Semantic colors
    textMain: '#1A2421',
    textMuted: '#625C50',
    textLight: '#8E8779',
    textInverse: '#F8F6F0',

    bgPage: '#F8F6F0',
    bgSurface: '#FFFFFF',
    bgDark: '#162E25',

    borderSubtle: 'rgba(98, 92, 80, 0.14)',
    borderMedium: 'rgba(98, 92, 80, 0.28)',

    success: '#2A9D8F',
    error: '#E63946',
    warning: '#E76F51',
    whatsapp: '#25D366'
};

export const spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48
};

export const radius = {
    xs: 6,
    sm: 10,
    md: 16,
    lg: 24,
    full: 9999
};

export const shadows = {
    subtle: {
        shadowColor: '#162E25',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2
    },
    card: {
        shadowColor: '#162E25',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 14,
        elevation: 4
    },
    elevated: {
        shadowColor: '#162E25',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.14,
        shadowRadius: 24,
        elevation: 8
    }
};
