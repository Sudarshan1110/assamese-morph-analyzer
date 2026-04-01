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
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text })
        });

        // ✅ SAFE FETCH
        if (!res.ok) {
            const errText = await res.text();
            throw new Error(errText);
        }

        const data = await res.json();

        data.forEach(wordResults => {
            wordResults.forEach(res => {

                if (res.error) {
                    resultsDiv.innerHTML += `
                        <div class="card error">
                            ❌ <b>${res.word || "Unknown"}</b><br>
                            Not found in dictionary.<br>
                            Try another word or check spelling.
                        </div>
                    `;
                    return;
                }

                const a = res.analysis || {};

                // ✅ SAFE ROOT (fallback support)
                const root = a.root || a.lemma || "Unknown";
                const suffix = res.suffix || "";

                const rootDisplay = `<span class="root">${root}</span>`;
                const suffixDisplay = suffix
                    ? `<span class="suffix">${suffix}</span>`
                    : `<span class="suffix none">None</span>`;

                // ✅ SAFE POS
                const pos = res.explanation ? res.explanation[0] : "Unknown";

                // ---------------- GRAMMAR ----------------
                let grammar = "";
                if (a.features) {
                    if (a.features.number)
                        grammar += `<li><b>Number:</b> ${a.features.number}</li>`;
                    if (a.features.case)
                        grammar += `<li><b>Case:</b> ${a.features.case}</li>`;
                    if (a.features.definiteness)
                        grammar += `<li><b>Definiteness:</b> ${a.features.definiteness}</li>`;
                }

                if (!grammar) {
                    grammar = "<li>No grammatical info available</li>";
                }

                // ---------------- EXPLANATION ----------------
                let explanation = `This word is a ${pos.toLowerCase()}`;

                if (a.features?.number)
                    explanation += `, ${a.features.number.toLowerCase()}`;
                if (a.features?.definiteness)
                    explanation += `, ${a.features.definiteness.toLowerCase()}`;

                explanation += ` formed from root "${root}"`;

                if (suffix)
                    explanation += ` using suffix "${suffix}"`;

                explanation += ".";

                // ---------------- UI CARD ----------------
                resultsDiv.innerHTML += `
                    <div class="card">
                        <div class="word-title">🔍 ${res.word}</div>

                        <div class="section">
                        🟢 <b>Root:</b> ${rootDisplay}
                        </div>

                        <div class="section">
                        🟡 <b>Suffix:</b> ${suffixDisplay}
                        </div>

                        <div class="section">
                            🔵 <b>Part of Speech:</b> ${pos}
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
        console.error(err);
        resultsDiv.innerHTML = `
            <div class="card error">
                ⚠️ Something went wrong.<br>
                Please try again.
            </div>
        `;
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
        try {
            const res = await fetch("/suggest", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prefix })
            });

            // ✅ SAFE FETCH
            if (!res.ok) {
                suggestionsBox.innerHTML = "";
                return;
            }

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

        } catch (err) {
            console.error("Suggestion error:", err);
            suggestionsBox.innerHTML = "";
        }

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