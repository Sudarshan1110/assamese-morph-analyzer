import tkinter as tk
from analyzer import MorphAnalyzer

analyzer = MorphAnalyzer("unimorph_clean.json")

history = []

# ---------------------------
# Scrollable Frame Helper
# ---------------------------
class ScrollableFrame(tk.Frame):
    def __init__(self, parent):
        super().__init__(parent)

        canvas = tk.Canvas(self, bg="#1e1e1e", highlightthickness=0)
        scrollbar = tk.Scrollbar(self, orient="vertical", command=canvas.yview)

        self.scrollable_frame = tk.Frame(canvas, bg="#1e1e1e")

        self.scrollable_frame.bind(
            "<Configure>",
            lambda e: canvas.configure(scrollregion=canvas.bbox("all"))
        )

        canvas.create_window((0, 0), window=self.scrollable_frame, anchor="nw")

        canvas.configure(yscrollcommand=scrollbar.set)

        canvas.pack(side="left", fill="both", expand=True)
        scrollbar.pack(side="right", fill="y")


# ---------------------------
# Helper functions
# ---------------------------
def format_features(features):
    readable = []

    if "number" in features:
        readable.append("Singular" if features["number"] == "SG" else "Plural")

    if "definiteness" in features:
        readable.append("Definite" if features["definiteness"] == "DEF" else "Indefinite")

    if "case" in features:
        readable.append(features["case"])

    return ", ".join(readable)


def analyze_text():
    text = entry.get().strip()
    if not text:
        return

    clear_result()

    results = analyzer.analyze(text)

    for word_results in results:
        for res in word_results:
            if "error" in res:
                add_card(res["word"], "-", "-", "Unknown", "Not found")
                continue

            analysis = res["analysis"]
            features = format_features(analysis.get("features", {}))

            suffix = res.get("suffix") or "-"
            suffix_meaning = res.get("suffix_meaning")

            add_card(
                res["word"],
                analysis.get("lemma"),
                f"{suffix} ({suffix_meaning})",
                res["explanation"][0],
                features
            )

    history.append(text)
    update_history()


def add_card(word, lemma, suffix, pos, meaning):
    card = tk.Frame(result_container.scrollable_frame, bg="#2b2b2b")
    card.pack(fill="x", pady=6, padx=5)

    tk.Label(card, text=f"Word: {word}", fg="#00e6ac", bg="#2b2b2b",
             font=("Segoe UI", 11, "bold")).pack(anchor="w")

    tk.Label(card, text=f"Lemma: {lemma}", fg="white", bg="#2b2b2b").pack(anchor="w")
    tk.Label(card, text=f"Suffix: {suffix}", fg="#ffaa00", bg="#2b2b2b").pack(anchor="w")
    tk.Label(card, text=f"POS: {pos}", fg="#66ccff", bg="#2b2b2b").pack(anchor="w")
    tk.Label(card, text=f"Meaning: {meaning}", fg="#cccccc", bg="#2b2b2b").pack(anchor="w")


def clear_result():
    for widget in result_container.scrollable_frame.winfo_children():
        widget.destroy()


def update_history():
    history_list.delete(0, tk.END)
    for item in history[-10:]:
        history_list.insert(tk.END, item)


def use_history(event):
    selected = history_list.get(tk.ACTIVE)
    entry.delete(0, tk.END)
    entry.insert(0, selected)
    analyze_text()


def delete_history():
    history.clear()
    history_list.delete(0, tk.END)


# ---------------------------
# UI Setup
# ---------------------------
root = tk.Tk()
root.title("Assamese Morph Analyzer")
root.geometry("850x700")
root.configure(bg="#1e1e1e")

# Title
tk.Label(root, text="🔍 Assamese Morph Analyzer",
         font=("Segoe UI", 18, "bold"),
         fg="white", bg="#1e1e1e").pack(pady=10)

# Input
entry = tk.Entry(root, font=("Segoe UI", 14),
                 bg="#2b2b2b", fg="white", insertbackground="white")
entry.pack(fill="x", padx=20, pady=5)

# Buttons
btn_frame = tk.Frame(root, bg="#1e1e1e")
btn_frame.pack(pady=5)

tk.Button(btn_frame, text="Analyze", bg="#4CAF50", fg="white",
          padx=15, command=analyze_text).grid(row=0, column=0, padx=5)

tk.Button(btn_frame, text="Clear", bg="#2196F3", fg="white",
          padx=15, command=clear_result).grid(row=0, column=1, padx=5)

tk.Button(btn_frame, text="Delete History", bg="#f44336", fg="white",
          padx=15, command=delete_history).grid(row=0, column=2, padx=5)

# ---------------------------
# RESULT SECTION (SCROLLABLE)
# ---------------------------
tk.Label(root, text="Results",
         font=("Segoe UI", 12, "bold"),
         fg="#00e6ac", bg="#1e1e1e").pack(anchor="w", padx=20)

result_container = ScrollableFrame(root)
result_container.pack(fill="both", expand=True, padx=20, pady=5)

# ---------------------------
# HISTORY SECTION (SCROLLABLE)
# ---------------------------
tk.Label(root, text="History",
         font=("Segoe UI", 12, "bold"),
         fg="#ffaa00", bg="#1e1e1e").pack(anchor="w", padx=20)

history_list = tk.Listbox(root, height=6, bg="#2b2b2b", fg="white")
history_list.pack(fill="x", padx=20, pady=5)
history_list.bind("<<ListboxSelect>>", use_history)

root.mainloop()