export const webCode = {
	html: '<button>Clicks: 0</button>',
	css: `
		body {
			display: grid;
			place-content: center;
		}

		button {
			padding: 1rem 2rem;
			font-size: 1.25rem;
			cursor: pointer;
		}
	`,
	script: `
		import confetti from 'canvas-confetti';

		let count = 0;

		document
			.querySelector('button')
			.addEventListener('click', (e) => {
				count++;
				e.target.textContent = \`Clicks: \${count}\`;
				confetti();
			});
	`
};
