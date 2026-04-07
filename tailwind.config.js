/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.{js,jsx,ts,tsx}',
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#1A526D',
                    50: '#E8F1F5',
                    100: '#C5DCE8',
                    200: '#9EC5D9',
                    300: '#77ADCA',
                    400: '#4F96BB',
                    500: '#1A526D',
                    600: '#164761',
                    700: '#123B52',
                    800: '#0E2F42',
                    900: '#0A2333',
                },
                secondary: {
                    DEFAULT: '#8CC63E',
                    50: '#F2F9E7',
                    100: '#DDEFC1',
                    200: '#C7E599',
                    300: '#B1DB71',
                    400: '#9BD149',
                    500: '#8CC63E',
                    600: '#7AB036',
                    700: '#67952D',
                    800: '#547A24',
                    900: '#415F1C',
                },
                accent: {
                    DEFAULT: '#0C9345',
                    50: '#E6F5ED',
                    100: '#BFE5D1',
                    200: '#99D5B5',
                    300: '#73C599',
                    400: '#4DB57D',
                    500: '#0C9345',
                    600: '#0A823D',
                    700: '#087134',
                    800: '#06602B',
                    900: '#044F22',
                },
            },
            fontFamily: {
                sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
            },
            boxShadow: {
                card: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            },
        },
    },
    plugins: [],
};
