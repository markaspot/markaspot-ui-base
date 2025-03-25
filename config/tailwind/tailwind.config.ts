import type { Config } from 'tailwindcss'
import defaultTheme from 'tailwindcss/defaultTheme'

export default <Partial<Config>>{
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                primary: '#526d9d',
                secondary: '#ff21f2',
                'waikawa-gray': {
                    '50': '#f5f6fa',
                    '100': '#eaedf4',
                    '200': '#d0d7e7',
                    '300': '#a6b5d3',
                    '400': '#768fba',
                    '500': '#526d9d',
                    '600': '#425987',
                    '700': '#36486e',
                    '800': '#303f5c',
                    '900': '#2c374e',
                    '950': '#1d2334',
                },
                'magenta': {
                    '50': '#fff2fe',
                    '100': '#ffe3fe',
                    '200': '#ffc6fd',
                    '300': '#ff99f6',
                    '400': '#ff5def',
                    '500': '#ff21f2',
                    '600': '#ff00ff',
                    '700': '#cf00ca',
                    '800': '#a900a3',
                    '900': '#890682',
                    '950': '#5e005a',
                },
            }
        }
    }
}
