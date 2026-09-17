(async () => {
	const container = /** @type {HTMLDivElement} */ (document.getElementById('app'));
	let error;
	try {
		const dataEl = /** @type {HTMLScriptElement} */ (document.getElementById('sandbox-data'));
		const data = JSON.parse(dataEl.textContent ?? '{}');
		const { files: compiled, entry } = data;

		error = data.error;
		/** @type {Record<string, string>} */
		const dir = {};

		for (const [name, js] of Object.entries(compiled)) {
			dir[name] = URL.createObjectURL(new Blob([js], { type: 'text/javascript' }));
		}

		for (const [name, url] of Object.entries(dir)) {
			const resp = await fetch(url);
			let text = await resp.text();
			for (const [otherName, otherUrl] of Object.entries(dir)) {
				if (name === otherName) continue;
				text = text.split('"' + './' + otherName + '"').join('"' + otherUrl + '"');
				text = text.split("'./" + otherName + "'").join("'" + otherUrl + "'");
			}
			const updated = new Blob([text], { type: 'text/javascript' });
			dir[name] = URL.createObjectURL(updated);
		}

		const { default: Component } = await import(dir[entry]);
		const { mount } = await import('svelte');
		mount(Component, { target: container });
	} catch (err) {
		container.textContent = 'Error: ' + (err instanceof Error ? err.message : String(err));
		if (error) container.style.color = error;
		container.style.padding = '1rem';
		container.style.fontFamily = 'monospace';
		container.style.whiteSpace = 'pre-wrap';
	}
})();
