const plugin = require('tailwindcss/plugin')
const radialGradientPlugin = plugin(
	function ({ matchUtilities, theme }) {
		matchUtilities(
			{
				// map to bg-radient-[*]
				'bg-radient': (value) => ({
					'background-image': `radial-gradient(${value},var(--tw-gradient-stops))`
				})
			},
			{ values: theme('radialGradients') }
		)
	},
	{
		theme: {
			radialGradients: _presets()
		}
	}
)
function _presets() {
	const shapes = ['circle', 'ellipse']
	const pos = {
		c: 'center',
		t: 'top',
		b: 'bottom',
		l: 'left',
		r: 'right',
		tl: 'top left',
		tr: 'top right',
		bl: 'bottom left',
		br: 'bottom right'
	}
	let result = {}
	for (const shape of shapes)
		for (const [posName, posValue] of Object.entries(pos))
			result[`${shape}-${posName}`] = `${shape} at ${posValue}`

	return result
}
/** @type {import('tailwindcss').Config} */
export default {
	content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
	theme: {
		extend: {
			fontFamily: {
				'poppins': ['Poppins', 'sans-serif'],
				'lexend': ['Lexend Deca', 'sans-serif'],
				'rajdhani': ['Rajdhani', 'sans-serif'],
				'bai': ['Bai Jamjuree', 'sans-serif'],
			},
			keyframes: {
				'fade-in-fast': {
					'0%': { opacity: '0' },
					'100%': { opacity: '1' }
				},
				'bob-up-down': {
					'0%, 100%': { transform: 'translateY(0)' },
					'50%': { transform: 'translateY(-10px)' }
				},
				'float': {
					'0%': { transform: 'translateY(-10px)' },
					'50%': { transform: 'translateY(0)' },
					'100%': { transform: 'translateY(-10px)' }
				}

			},
			animation: {
				'fade-in-fast': 'fade-in-fast 0.3s ease-out forwards',
				'bob-up-down': 'bob-up-down 1s ease-in-out infinite',
				'float': 'float 3s ease-in-out infinite'
			},
		}
	},
	plugins: [radialGradientPlugin]
}
