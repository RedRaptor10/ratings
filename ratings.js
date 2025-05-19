const TOP_RATINGS_PATH = './sheets/top_ratings.xlsx';
const ANIME_RATINGS_PATH = './sheets/anime_ratings.xlsx';
const MOVIE_RATINGS_PATH = './sheets/movie_ratings.xlsx';
const TV_SHOW_RATINGS_PATH = './sheets/tv_show_ratings.xlsx';

var topRatings = {
	'anime': null,
	'movies': null,
	'tv-shows': null
}

var ratings = {
	'anime': {
		path: ANIME_RATINGS_PATH,
		list: null
	},
	'movies': {
		path: MOVIE_RATINGS_PATH,
		list: null
	},
	'tv-shows': {
		path: TV_SHOW_RATINGS_PATH,
		list: null
	}
}

document.addEventListener('DOMContentLoaded', () => {
	(async () => {
		loadHomePage();
		createPages();
		addNavigationEvents();
		addInfoEvents();
		addSearchEvents();
		addSortEvents();
	})();
});

const loadHomePage = () => {
	handleDataTopRatings();
	document.getElementById('home').classList.add('active');
}

const createPages = () => {
	// Clone Ratings Page | Note: This is an unclean solution to avoid HTML duplication
	const ratingsPage = document.querySelector('.ratings-page');
	const clone1 = ratingsPage.cloneNode(true);
	const clone2 = ratingsPage.cloneNode(true);

	ratingsPage.dataset.page = 'anime';
	clone1.dataset.page = 'movies';
	clone2.dataset.page = 'tv-shows';

	ratingsPage.insertAdjacentElement('afterend', clone1);
	ratingsPage.insertAdjacentElement('afterend', clone2);
}

const getPage = (id) => {
	return document.querySelector('.page[data-page="' + id + '"]');
}

const getData = async (url) => {
	try {
		// Fetch Data
		const file = await (await fetch(url)).arrayBuffer();

		// Parse Data
		const workbook = XLSX.read(file);
		const worksheet = workbook.Sheets[workbook.SheetNames[0]];

		// Extract Data
		const data = XLSX.utils.sheet_to_json(worksheet);

		return data;
	} catch (error) {
		return false;
	}
}

const getDataTopRatings = async () => {
	const url = TOP_RATINGS_PATH;
	const data = {}

	try {
		// Fetch Data
		const file = await (await fetch(url)).arrayBuffer();

		// Parse Data
		const workbook = XLSX.read(file);

		// Extract Data
		if (workbook.SheetNames.includes('Anime')) {
			const worksheet = workbook.Sheets['Anime'];
			data['anime'] = XLSX.utils.sheet_to_json(worksheet);
		}

		if (workbook.SheetNames.includes('Movies')) {
			const worksheet = workbook.Sheets['Movies'];
			data['movies'] = XLSX.utils.sheet_to_json(worksheet);
		}

		if (workbook.SheetNames.includes('TV Shows')) {
			const worksheet = workbook.Sheets['TV Shows'];
			data['tv-shows'] = XLSX.utils.sheet_to_json(worksheet);
		}

		return data;
	} catch (error) {
		return false;
	}
}

const addNavigationEvents = () => {
	const menuItems = document.querySelectorAll('nav > div > *');

	menuItems.forEach(x => {
		x.addEventListener('click', () => {
			const id = x.id;

			if (id == 'home') {
				handleDataTopRatings();
			} else {
				handleData(id);
			}

			// Reset Page
			resetPage(id);

			// Toggle Menu Item
			menuItems.forEach(y => y.classList.remove('active'));
			x.classList.add('active');

			// Toggle Page
			const pages = document.querySelectorAll('.page');
			const page = getPage(id);
			pages.forEach(y => y.classList.add('hidden'));
			page.classList.remove('hidden');
		});
	});
}

const resetPage = (id) => {
	if (id == 'home') return;

	const page = getPage(id);

	// Reset Info
	const info = page.querySelector('.info');
	hideInfo(info);

	/* Commented out as this slows down page navigation
	// Reset Search
	const searchInput = page.querySelector('.search > input');
	searchInput.value = '';
	searchData(searchInput);

	// Reset Sort
	const header = page.querySelector('.table > div:first-child > div:first-child');
	sortData(header, 0, 'asc');
	*/
}

// Get/Set Data
const handleData = async (id) => {
	if (ratings[id]['list'] != null) return;

	const menuItems = document.querySelectorAll('nav > div > *');
	const path = ratings[id]['path'];

	const data = await getData(path);
	if (!data) return;

	// Sort Data
	data.sort((a, b) => {
		return a['Title'].toString().toUpperCase().localeCompare(b['Title'].toString().toUpperCase());
	});

	ratings[id]['list'] = data;
	addData(id, ratings[id]['list']);
}

// Get/Set Top Ratings Data
const handleDataTopRatings = async () => {
	if (topRatings['anime'] != null || topRatings['movies'] != null || topRatings['tv-shows'] != null) return;

	const data = await getDataTopRatings();
	if (!data) return;

	topRatings = data;
	addDataTopRatings();
}

const addInfoEvents = () => {
	document.querySelectorAll('.info-close-btn').forEach(x => {
		const container = x.closest('.page').querySelector('.info');

		x.addEventListener('click', () => {
			hideInfo(container);
		});
	});
}

const addSearchEvents = () => {
	const searchInputs = document.querySelectorAll('.search > input');

	searchInputs.forEach(x => {
		x.addEventListener('keyup', () => {
			searchData(x);
		});
	});
}

const addSortEvents = () => {
	const containers = document.querySelectorAll('.table');

	containers.forEach(x => {
		const headers = x.querySelectorAll('.table > div:first-child > div');

		headers.forEach((header, i) => {
			header.addEventListener('click', () => {
				let currentSortOrder = null;
				const sortActive = header.querySelector('.sort-active');

				if (sortActive) {
					if (sortActive.classList.contains('sort-up')) {
						currentSortOrder = 'asc';
					} else if (sortActive.classList.contains('sort-down')) {
						currentSortOrder = 'desc';
					}
				}
				
				const targetSortOrder = currentSortOrder == null || currentSortOrder == 'desc' ? 'asc' : 'desc';

				sortData(header, i, targetSortOrder);
			});
		});
	});
}

const addData = (id, data) => {
	const page = getPage(id);
	const target = page.querySelector('.table > div:last-child');

	// Clear Table
	target.innerHTML = '';

	// Update Footer Text
	page.querySelector('.footer').innerHTML = 'Total: ' + data.length;

	data.forEach((info, i) => {
		const title = info['Title'];
		const notes = info['Notes'] ?? '';
		const rating = info['Rating'] ?? '';

		const row = document.createElement('div');
		const col1 = document.createElement('div');
		const col2 = document.createElement('div');
		const col3 = document.createElement('div');

		// Name
		col1.innerHTML = title;

		// Notes
		col2.dataset.notes = notes != '';

		// Rating
		const ratingNumber = document.createElement('div');
		const ratingStars = document.createElement('div');

		col3.dataset.rating = rating;
		ratingNumber.innerHTML = rating;

		col3.append(ratingNumber, ratingStars);

		row.append(col1, col2, col3);
		target.append(row);

		// Add Event
		if (notes != '') {
			row.dataset.info = true;
			row.addEventListener('click', () => {
				toggleInfo(page, info, i);
			});
		}
	});
}

const addDataTopRatings = () => {
	const data = topRatings;

	const target = document.querySelector('.top-ratings');
	target.innerHTML = '';

	for (const key in data) {
		if (data[key] == null || data[key].length == 0) continue;

		const table = document.createElement('div');
		const header = document.createElement('div');
		const body = document.createElement('div');

		var category = '';
		if (key == 'anime') {
			category = 'Anime';
		} else if (key == 'movies') {
			category = 'Movies';
		} else if (key == 'tv-shows') {
			category = 'TV Shows';
		}

		header.innerHTML = category + ' - Top ' + data[key].length;

		data[key].forEach((x, i) => {
			const row = document.createElement('div');
			const col1 = document.createElement('div');
			const col2 = document.createElement('div');

			col1.innerHTML = (i + 1) + '.';
			col2.innerHTML = x['Title'];

			row.append(col1, col2);
			body.append(row);
		});

		table.append(header, body);
		target.append(table);
	}
}

const toggleInfo = (page, info, sourceIndex) => {
	const container = page.querySelector('.info');

	// Selected Item ID
	const activeCategory = document.querySelector('nav > div > div.active');
	const id = activeCategory.id + '-' + sourceIndex;

	if (container.classList.contains('hidden') || container.id != id) {
		showInfo(container, info, id);
	} else {
		hideInfo(container);
	}
}

const showInfo = (container, info, id) => {
	const title = info['Title'];
	const notes = info['Notes'] ?? '';
	const rating = info['Rating'] ?? '';

	container.id = id;
	container.classList.remove('hidden');

	container.querySelector('.info-title').innerHTML = title;
	container.querySelector('.info-rating').dataset.rating = rating;
	container.querySelector('.info-rating > div:first-child').innerHTML = rating != '' ? 'Rating: ' + rating : '';
	container.querySelector('.info-notes > pre').innerHTML = notes;
	container.querySelector('.info-notes > div:first-child').innerHTML = notes != '' ? 'Notes:' : '';
}

const hideInfo = (container) => {
	container.id = '';
	container.classList.add('hidden');

	container.querySelector('.info-title').innerHTML = '';
	container.querySelector('.info-rating').dataset.rating = '';
	container.querySelector('.info-rating > div:first-child').innerHTML = 'Rating:';
	container.querySelector('.info-notes > div:first-child').innerHTML = 'Notes:';
	container.querySelector('.info-notes > pre').innerHTML = '';
}

const searchData = (searchInput) => {
	const page = searchInput.closest('.page');
	const value = searchInput.value.toUpperCase();
	const cells = page.querySelectorAll('.table > div:last-child > div > div:first-child');

	cells.forEach(x => {
		const text = x.innerHTML.toUpperCase();

		if (text.indexOf(value) > -1) {
			x.parentNode.classList.remove('hidden-important');
		} else {
			x.parentNode.classList.add('hidden-important');
		}
	});
}

const sortData = (header, index, sortOrder) => {
	const page = header.closest('.page');
	const items = page.querySelectorAll('.table > div:last-child > div > div:nth-child(' + (index + 1) + ')');
	const itemsArray = Array.from(items);

	switch (index) {
		// Name
		case 0:
			itemsArray.sort((a, b) => {
				let result;

				if (sortOrder == 'asc') {
					result = a.innerHTML.toUpperCase().localeCompare(b.innerHTML.toUpperCase());
				} else if (sortOrder == 'desc') {
					result = b.innerHTML.toUpperCase().localeCompare(a.innerHTML.toUpperCase());
				}

				return result;
			});

			break;
		// Notes
		case 1:
			itemsArray.sort((a, b) => {
				const notesA = a.dataset.notes == 'true';
				const notesB = b.dataset.notes == 'true';

				if (sortOrder == 'asc') {
					if (!notesA && notesB) {
						return -1;
					} else if ((notesA && notesB) || (!notesA && !notesB)) {
						return 0;
					} else if (notesA && !notesB) {
						return 1;
					}
				} else if (sortOrder == 'desc') {
					if (!notesB && notesA) {
						return -1;
					} else if ((notesA && notesB) || (!notesA && !notesB)) {
						return 0;
					} else if (notesB && !notesA) {
						return 1;
					}
				}
			});

			break;
		// Rating
		case 2:
			itemsArray.sort((a, b) => {
				const ratingA = a.dataset.rating != '' ? parseInt(a.dataset.rating) : 0;
				const ratingB = b.dataset.rating != '' ? parseInt(b.dataset.rating) : 0;

				if (sortOrder == 'asc') {
					if (ratingA < ratingB) {
						return -1;
					} else if (ratingA == ratingB) {
						return 0;
					} else if (ratingA > ratingB) {
						return 1;
					}
				} else if (sortOrder == 'desc') {
					if (ratingB < ratingA) {
						return -1;
					} else if (ratingB == ratingA) {
						return 0;
					} else if (ratingB > ratingA) {
						return 1;
					}
				}
			});

			break;
		default:
			break;
	}

	for (let i = 0; i < itemsArray.length; i++) {
		itemsArray[i].parentNode.parentNode.appendChild(itemsArray[i].parentNode);
	}

	// Set Active Sort Arrow
	const sortArrows = page.querySelectorAll('.sort-arrow');
	const targetSortArrow = sortOrder == 'asc' ? header.querySelector('.sort-up') : header.querySelector('.sort-down');

	sortArrows.forEach(x => {
		x.classList.remove('sort-active');
	});

	targetSortArrow.classList.add('sort-active');
}