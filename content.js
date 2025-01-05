// un niño que juega pokimon es el proximo para el diablo destrozarlo :3
// Cache for storing up to 5 recent Pokémon data using the browser's local storage. This whole thing can be improved by a lot using a background script but ive spent too much time on it already. Later...
let pokemonCache = JSON.parse(localStorage.getItem('pokemonCache')) || [];

// Function to add Pokémon to cache (keeps only the latest 5 entries) 
function addToCache(pokemonName, data) {
    // check if the pkmn is already in cache
    const existingIndex = pokemonCache.findIndex(entry => entry.name === pokemonName);

    if (existingIndex !== -1) {
        // move the existing pkmn to the end (most recent)
        const existingEntry = pokemonCache.splice(existingIndex, 1)[0];
        pokemonCache.push(existingEntry);
    } else {
        // Add new pkmn and maintain size of 5
        pokemonCache.push({ name: pokemonName, data });
        if (pokemonCache.length > 5) {
            pokemonCache.shift(); // Remove the oldest entry
        }
    }
    // save the updated cache to local storage
    localStorage.setItem('pokemonCache', JSON.stringify(pokemonCache));
}

// Function to get pkmn data from cache
function getFromCache(pokemonName) {
    const cachedEntry = pokemonCache.find(entry => entry.name === pokemonName);
    return cachedEntry ? cachedEntry.data : null;
}


function capitalize(word) {
    if (!word) return '';
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

// function return a tuple with the current theme on the first position and the opposite theme in the second position, that way the classes can be easily switched
// I just spend like 3 goddamn hours on this sht im going insane
function usingTheme() {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return ['dark-theme', 'light-theme'];
    } 
    else {
        return ['light-theme', 'dark-theme'];
    }
}

// function to type the pokemon stats
function getStatsHTML(stats) {
    let statNames = ['HP', 'Attack', 'Defense', 'Sp. Attack', 'Sp. Defense', 'Speed'];
    let statData = '';
    for (let i = 0; i < 6; i++) {
        statData += `
        <tr>
            <th style="text-align:right"><strong>${statNames[i]}: </strong></th>
            <td>${stats[i].base_stat}</td>
            <td>
                <div class="stat-bar">
                    <div class="stat-fill ${stats[i].base_stat > 150 ? 'superb': stats[i].base_stat > 100 ? 'great' : stats[i].base_stat > 75 ? 'good' : stats[i].base_stat > 50 ? 'nice' : stats[i].base_stat > 25 ? 'okay': 'bad'}" style="width: ${stats[i].base_stat / 180 * 100}%;"></div>
                </div>
            </td>
        </tr>`;
    }
    return statData;
}

function getTypesHTML(types) {
    let typeData = '';
    for (let i = 0; i < types.length; i++) {
        typeData += `<div class='type ${types[i].type.name}'>${types[i].type.name.toUpperCase()}</div>`;
    }
    return typeData;
}

// function to get the forms of the pokemon (doesn't work yet)
/*
async function getFormsHTML(pokemonName) {
    let formNames = ['alolan', 'galarian', 'paldean', 'mega', 'gmax'];
    let forms = '';
    let speciesData = await fetchSpeciesData(pokemonName);
    if (speciesData.varieties.length > 1) {
        for (let i = 0; i < 2 speciesData.varieties.length; i++) {
            // let name = speciesData.varieties[i].pokemon.name.split('-');
            // let form = formNames[formNames.findIndex(name[1])] ? formNames[formNames.findIndex(name[1])] : '';
            forms += `<img src="assets/pokeball.png" alt="${speciesData.varieties[i].pokemon.name} title="${speciesData.varieties[i].pokemon.name}">`;
        }
    }
    return forms;
}
*/

async function fetchPokemonData(pokemon) {
  try {
  const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemon}`);
  if (!response.ok) throw new Error('Pokemon not found: ' + pokemon); 
  console.log('api call'); 
  return await response.json();
  } 
  catch (error) {
    console.error(error);
    return null;
  }
}

async function fetchSpeciesData(pokemon) {
    try {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokemon}`);
    if (!response.ok) throw new Error('Pokemon Species not found: ' + pokemon);
    return await response.json();
    } 
    catch (error) {
      console.error(error);
      return null;
    }
  }

// for modifying the card without having to call the API -- Only use for testing
function fakePokemonData() {
    return {
        name: 'pikachu',
        sprites: {
            front_default: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png'
        },
        types: [
            { type: { name: 'electric' } }
        ],
        stats: [
            { base_stat: 35 },
            { base_stat: 55 },
            { base_stat: 40 },
            { base_stat: 50 },
            { base_stat: 50 },
            { base_stat: 90 }
        ]
    };
}

// function to inject the card into the search results
async function displayPokemonData() {
    // Get the seach query
    const searchInput = document.querySelector('input[name="q"]');
    if (!searchInput) return;

    // for now just extract the first word and check how that goes

    let pokemonName = searchInput.value.trim().toLowerCase();
    pokemonName = pokemonName.split(' ')[0];

    //fetch the data from the cache or the api if not in the cache
    const pokemonData = getFromCache(pokemonName) ? getFromCache(pokemonName) : await fetchPokemonData(pokemonName);
    pokemonData === null? null: addToCache(pokemonName, pokemonData);
    console.log(pokemonData);
    console.log(pokemonCache);
    
    // create the card if it doesn't exist
    card = document.createElement('div');
    card.id = 'pokemon-info-card';

    // This is for the theme the card is using, my first time using js and the way it passes objects is weird and dumb and there's only so many hours in a day so I'm doing it this way
    // this is the inner html of the info card, the stats are hard coded bc I'm lazy and there's always 6 anyways...
    card.innerHTML = `
    <div class="pokemon-card">
        <div>
            <h3 id="pokemon-name" class="text"><strong>${capitalize(pokemonData.name)}</strong></h3>
            <img src="${pokemonData.sprites.front_default}" alt="${pokemonData.name}" id="pokemon-image">
            <div class="types">
                <strong>${getTypesHTML(pokemonData.types)}</strong>
            </div>
        </div>
        <div class="text" id="stats">
            <p style="text-align:center"><strong>BASE STATS</strong></p>
            <table>
                <tbody>
                    ${getStatsHTML(pokemonData.stats)}
                </tbody>
            </table>
        </div>
    </div>
    `;

    let theme = usingTheme();
    card.classList.add(theme[0]);
    card.classList.contains(theme[1]) ? card.classList.remove(theme[1]) : null;

    // mete la tarjeta a la vaina y sal de eso
    //busca la barra de busqueda (para meter la tarjeta abajo)
    const container = document.querySelector('#search');
    if (container){
        container.prepend(card);
    }

    const image = document.getElementById('pokemon-image');
    if (image) {
    image.addEventListener('click', () => {
        const audio = new Audio(pokemonData.cries.latest); // Replace with dynamic URL
        audio.volume = 0.1;
        audio.play();
        });
    }
};    

displayPokemonData();