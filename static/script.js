let history = [];
let selectedIndex = -1;
let debounceTimer = null;

const input = document.getElementById("inputBox");
const suggestionsBox = document.getElementById("suggestions");
const resultsDiv = document.getElementById("results");
const historyDiv = document.getElementById("history");
const loader = document.getElementById("loader");

// -------------------- ANALYZE --------------------
async function analyze() {
    const text = input.value.trim();
    if (!text) return;

    loader.classList.remove("hidden");
    resultsDiv.innerHTML = "";

    try {
        const res = await fetch("/analyze", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ text })
        });

        const data = await res.json();

        data.forEach(wordResults => {
            wordResults.forEach(res => {

                if (res.error) {
                    resultsDiv.innerHTML += `
                        <div class="card error">
                            ❌ <b>${res.word}</b><br>
                            Not found in dictionary.<br>
                            Try another word or check spelling.
                        </div>
                    `;
                    return;
                }

                const a = res.analysis;

                // Root + suffix split
                const root = a.lemma;
                const suffix = res.suffix || "";

                const formattedWord = suffix
                    ? `<span class="root">${root}</span><span class="suffix"> + ${suffix}</span>`
                    : `<span class="root">${root}</span>`;

                // Build grammatical info
                let grammar = "";
                if (a.features) {
                    if (a.features.number)
                        grammar += `<li><b>Number:</b> ${a.features.number}</li>`;
                    if (a.features.case)
                        grammar += `<li><b>Case:</b> ${a.features.case}</li>`;
                    if (a.features.definiteness)
                        grammar += `<li><b>Definiteness:</b> ${a.features.definiteness}</li>`;
                }

                // Explanation sentence
                let explanation = `This word is a ${res.explanation[0].toLowerCase()}`;
                if (a.features?.number)
                    explanation += `, ${a.features.number.toLowerCase()}`;
                if (a.features?.definiteness)
                    explanation += `, ${a.features.definiteness.toLowerCase()}`;
                explanation += ` formed from root "${root}"`;
                if (suffix)
                    explanation += ` using suffix "${suffix}"`;

                explanation += ".";

                resultsDiv.innerHTML += `
                    <div class="card">
                        <div class="word-title">🔍 ${res.word}</div>

                        <div class="section">
                            🟢 <b>Root:</b> ${formattedWord}
                        </div>

                        <div class="section">
                            🔵 <b>Part of Speech:</b> ${res.explanation[0]}
                        </div>

                        <div class="section">
                            📚 <b>Grammatical Info:</b>
                            <ul>${grammar}</ul>
                        </div>

                        <div class="section explanation">
                            🧠 <b>Explanation:</b><br>
                            ${explanation}
                        </div>
                    </div>
                `;
            });
        });

        addHistory(text);

    } catch (err) {
        resultsDiv.innerHTML = `<div class="card error">⚠️ Error occurred</div>`;
    }

    loader.classList.add("hidden");
}

// -------------------- HISTORY --------------------
function addHistory(text) {
    history.push(text);
    renderHistory();
}

function renderHistory() {
    historyDiv.innerHTML = "";

    history.slice(-10).forEach(item => {
        const div = document.createElement("div");
        div.textContent = item;
        div.onclick = () => input.value = item;
        historyDiv.appendChild(div);
    });
}

function clearHistory() {
    history = [];
    historyDiv.innerHTML = "";
}

// -------------------- DEBOUNCE SUGGESTIONS --------------------
input.addEventListener("input", function () {
    const prefix = input.value.trim();

    clearTimeout(debounceTimer);

    if (!prefix) {
        suggestionsBox.innerHTML = "";
        return;
    }

    debounceTimer = setTimeout(async () => {
        const res = await fetch("/suggest", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ prefix })
        });

        const data = await res.json();

        suggestionsBox.innerHTML = "";
        selectedIndex = -1;

        data.forEach(word => {
            const div = document.createElement("div");
            div.textContent = word;

            div.onclick = () => {
                input.value = word;
                suggestionsBox.innerHTML = "";
            };

            suggestionsBox.appendChild(div);
        });

    }, 300);
});

// -------------------- KEYBOARD NAV --------------------
input.addEventListener("keydown", function (e) {
    const items = document.querySelectorAll("#suggestions div");

    if (!items.length) return;

    if (e.key === "ArrowDown") {
        e.preventDefault();
        selectedIndex++;
        if (selectedIndex >= items.length) selectedIndex = 0;
    }

    if (e.key === "ArrowUp") {
        e.preventDefault();
        selectedIndex--;
        if (selectedIndex < 0) selectedIndex = items.length - 1;
    }

    items.forEach(i => i.classList.remove("active"));

    if (selectedIndex >= 0) {
        items[selectedIndex].classList.add("active");
    }

    if (e.key === "Enter") {
        if (selectedIndex >= 0) {
            input.value = items[selectedIndex].textContent;
            suggestionsBox.innerHTML = "";
            selectedIndex = -1;
        } else {
            analyze();
        }
    }
});