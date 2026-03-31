import json

with open("unimorph_clean.json", "r", encoding="utf-8") as f:
    data = json.load(f)

# test some words
words = ["বতৰ", "বতৰটো"]

for w in words:
    print(f"\nWord: {w}")
    print(data.get(w, "Not found"))