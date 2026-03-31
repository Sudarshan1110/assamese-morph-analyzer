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
                        <div class="card error">❌ ${res.word}</div>
                    `;
                    return;
                }

                const a = res.analysis;

                resultsDiv.innerHTML += `
                    <div class="card">
                        <div class="word">${res.word}</div>
                        <div><b>Lemma:</b> ${a.lemma}</div>
                        <div><b>Suffix:</b> ${res.suffix || "-"} (${res.suffix_meaning})</div>
                        <div><b>POS:</b> ${res.explanation[0]}</div>
                        <div><b>Meaning:</b> ${res.explanation.join(", ")}</div>
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
    if (!text) return;

    history.push(text);
    renderHistory();
}

function renderHistory() {
    historyDiv.innerHTML = "";

    history.slice(-10).forEach(item => {
        const div = document.createElement("div");
        div.textContent = item;

        div.onclick = () => {
            input.value = item;
        };

        historyDiv.appendChild(div);
    });
}

function clearHistory() {
    history = [];
    historyDiv.innerHTML = "";
}

// -------------------- SUGGESTIONS (DEBOUNCED) --------------------
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
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({ prefix })
            });

            const data = await res.json();

            suggestionsBox.innerHTML = "";
            selectedIndex = -1;

            data.forEach((word, index) => {
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
        }
    }, 300); // 🔥 debounce delay
});

// -------------------- KEYBOARD NAVIGATION --------------------
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

    items.forEach(item => item.classList.remove("active"));

    if (selectedIndex >= 0) {
        items[selectedIndex].classList.add("active");
    }

    if (e.key === "Enter") {
        if (selectedIndex >= 0) {
            e.preventDefault();
            input.value = items[selectedIndex].textContent;
            suggestionsBox.innerHTML = "";
            selectedIndex = -1;
        } else {
            analyze(); // enter triggers analyze
        }
    }
});