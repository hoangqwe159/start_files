let selectedCharacters = [null, null];
let previousComparisons = [];

document.getElementById("search-input").addEventListener("input", processSearch);

async function processSearch(event) {
  var searchValue = event.target.value.toLowerCase();
  const data = await fetch('./data.json').then(response => response.json());
  search(searchValue, data.Characters);
}

function search(searchValue, characters) {
  const filteredCharacters = characters.filter(character => character.name.toLowerCase().includes(searchValue));
  renderCharacters(filteredCharacters);
}

function renderCharacters(characters) {
  const table = document.getElementById("character-table");
  table.innerHTML = ''; // Clear the table first

  characters.forEach((character, index) => {
    const row = table.insertRow(-1);
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.dataset.characterIndex = index;
    checkbox.checked = selectedCharacters.some(selected => selected && selected.index === index);
    checkbox.addEventListener('change', function() {
      handleSelectionChange(character, this.checked, parseInt(this.dataset.characterIndex));
    });

    row.innerHTML = `
      <td class="character-table-td">${character.name}</td>
      <td class="character-table-td">${character.strength}</td>
      <td class="character-table-td">${character.speed}</td>
      <td class="character-table-td">${character.skill}</td>
      <td class="character-table-td">${character.fear_factor}</td>
      <td class="character-table-td">${character.power}</td>
      <td class="character-table-td">${character.intelligence}</td>
      <td class="character-table-td">${character.wealth}</td>
      <td class="character-table-td"></td>
    `;
    row.lastElementChild.appendChild(checkbox);
  });
}

function handleSelectionChange(character, isChecked, characterIndex) {
  const checkboxes = document.querySelectorAll('#character-table input[type="checkbox"]');

  // Count how many characters are currently selected
  const selectedCount = selectedCharacters.filter(c => c !== null).length;

  if (isChecked) {
    // If trying to select a third character, alert the user and revert the checkbox
    if (selectedCount >= 2) {
      alert("You must deselect a character before selecting another.");
      checkboxes[characterIndex].checked = false; // Revert the checkbox to its previous state
      return; // Stop further execution
    }

    // Replace the first null slot with the new character
    const slotIndex = selectedCharacters[0] === null ? 0 : 1;
    selectedCharacters[slotIndex] = { ...character, index: characterIndex };
  } else {
    // Deselect the character
    selectedCharacters = selectedCharacters.map((selected) =>
      selected && selected.index === characterIndex ? null : selected
    );
  }

  // Update the display
  updateLogoDiv();
  // Update the previous comparisons if two characters are selected
  updatePreviousComparisons();
  // If two characters are selected, perform the comparison and update the display
  if (selectedCharacters[0] && selectedCharacters[1]) {
    // Load the character data for comparison
    const characterData1 = selectedCharacters[0];
    const characterData2 = selectedCharacters[1];

    // Perform the comparison and update the display
    compareAndDisplaySkills(characterData1, characterData2);
  } else {
    // Clear the skill comparison display if less than two characters are selected
    clearSkillComparisonDisplay();
  }
}

function updateLogoDiv() {
  const logoDiv = document.getElementById("logo-div");
  logoDiv.innerHTML = ''; // Clear the current content

  // Append the first character or unknown circle
  logoDiv.appendChild(createCharacterCircle(
    selectedCharacters[0] ? selectedCharacters[0].image_url : 'path_to_default_image.jpg',
    selectedCharacters[0] ? selectedCharacters[0].name : 'Unknown'
  ));

  // Append the second character or unknown circle
  logoDiv.appendChild(createCharacterCircle(
    selectedCharacters[1] ? selectedCharacters[1].image_url : 'path_to_default_image.jpg',
    selectedCharacters[1] ? selectedCharacters[1].name : 'Unknown'
  ));
}

function updatePreviousComparisons() {
  if (selectedCharacters[0] && selectedCharacters[1]) {
    previousComparisons.push([...selectedCharacters]);
    // Clear selections to allow new selections
    selectedCharacters = [null, null];
    renderPreviousComparisons();
    // Reflect deselection in the UI
    document.querySelectorAll('#character-table input[type="checkbox"]').forEach(checkbox => checkbox.checked = false);
  }
}

function renderPreviousComparisons() {
  const previousComparisonsDiv = document.getElementById('previous-comparisons');
  previousComparisonsDiv.innerHTML = ''; // Clear current comparisons

  previousComparisons.forEach((comparison, index) => {
    const comparisonElement = document.createElement('div');
    comparisonElement.textContent = `${comparison[0].name} vs ${comparison[1].name}`;
    previousComparisonsDiv.appendChild(comparisonElement);
  });
}

function createCharacterCircle(imgSrc, textContent) {
  const characterCircle = document.createElement('div');
  characterCircle.style.display = 'inline-block';
  characterCircle.style.textAlign = 'center';
  characterCircle.style.marginRight = '20px';

  const img = document.createElement('img');
  img.src = imgSrc;
  img.alt = textContent;
  img.style.width = '100px';
  img.style.height = '100px';
  img.style.borderRadius = '50%';
  img.style.display = 'block';
  img.style.margin = '0 auto';

  const name = document.createElement('p');
  name.textContent = textContent;
  name.style.color = '#fff';
  name.style.marginTop = '8px'; // Adjust spacing as needed

  characterCircle.appendChild(img);
  characterCircle.appendChild(name);

  return characterCircle;
}

// Call the initial render function in case there are any comparisons to show when the page loads
renderPreviousComparisons();
function compareAndDisplaySkills(character1, character2) {
  if (!selectedCharacters[0] || !selectedCharacters[1]) {
    // One or both characters are unselected, clear the skill comparison
    document.getElementById('character1-column').className = 'skill-column no-comparison';
    document.getElementById('character2-column').className = 'skill-column no-comparison';
    return;
  }

  let character1Ticks = 0;
  let character2Ticks = 0;

  const skills = ['strength', 'speed', 'skill', 'fearFactor', 'power', 'intelligence', 'wealth'];

  skills.forEach(skill => {
    let result = compareSkill(character1[skill], character2[skill]);
    character1Ticks += result.character1Tick ? 1 : 0;
    character2Ticks += result.character2Tick ? 1 : 0;

    // Assume you have elements with IDs like 'char1-strength', 'char2-strength' etc.
    document.getElementById('char1-' + skill).textContent = result.character1Tick ? '✔' : '';
    document.getElementById('char2-' + skill).textContent = result.character2Tick ? '✔' : '';
  });

  updateColumnBackground(character1Ticks, character2Ticks);
}

function compareSkill(skill1, skill2) {
  if (skill1 > skill2) {
    return { character1Tick: true, character2Tick: false };
  } else if (skill1 < skill2) {
    return { character1Tick: false, character2Tick: true };
  } else {
    // Randomly assign a tick if skills are equal
    if (Math.random() > 0.5) {
      return { character1Tick: true, character2Tick: false };
    } else {
      return { character1Tick: false, character2Tick: true };
    }
  }
}

function updateColumnBackground(character1Ticks, character2Ticks) {
  if (character1Ticks > character2Ticks) {
    document.getElementById('character1-column').className = 'skill-column winner';
    document.getElementById('character2-column').className = 'skill-column loser';
  } else if (character1Ticks < character2Ticks) {
    document.getElementById('character1-column').className = 'skill-column loser';
    document.getElementById('character2-column').className = 'skill-column winner';
  } else {
    // In case of a tie
    document.getElementById('character1-column').className = 'skill-column no-comparison';
    document.getElementById('character2-column').className = 'skill-column no-comparison';
  }
}
function clearSkillComparisonDisplay() {
  // Clear ticks and reset backgrounds to dark grey
  const skills = ['strength', 'speed', 'skill', 'fearFactor', 'power', 'intelligence', 'wealth'];
  skills.forEach(skill => {
    document.getElementById('char1-' + skill).textContent = '';
    document.getElementById('char2-' + skill).textContent = '';
  });
  document.getElementById('character1-column').className = 'skill-column no-comparison';
  document.getElementById('character2-column').className = 'skill-column no-comparison';
}