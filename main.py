from analyzer import MorphAnalyzer

# simple color codes
GREEN = "\033[92m"
BLUE = "\033[94m"
YELLOW = "\033[93m"
RESET = "\033[0m"


analyzer = MorphAnalyzer("unimorph_clean.json")

while True:
    word = input("\nEnter Assamese word (or 'exit'): ")

    if word.lower() == "exit":
        break

    results = analyzer.analyze(word)

    for res in results:
        if "error" in res:
            print(YELLOW + res["error"] + RESET)
            continue

        print(GREEN + f"\nWord: {res['word']}" + RESET)
        print(BLUE + f"Source: {res['source']} | Confidence: {res['confidence']}" + RESET)

        analysis = res["analysis"]

        print("Lemma:", analysis.get("lemma"))
        print("POS:", analysis.get("pos"))
        print("Features:", analysis.get("features"))

        print("Explanation:", ", ".join(res["explanation"]))