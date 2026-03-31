import json
from tags import TAG_MEANINGS, SUFFIX_MEANINGS
from rules import apply_rules


class MorphAnalyzer:
    def __init__(self, data_path):
        with open(data_path, "r", encoding="utf-8") as f:
            self.data = json.load(f)

        self.vocab = list(self.data.keys())  # for suggestions

    def explain_tags(self, entry):
        explanation = []

        pos = entry.get("pos")
        explanation.append(TAG_MEANINGS.get(pos, pos))

        for key, value in entry.get("features", {}).items():
            if isinstance(value, list):
                explanation.extend(value)
            else:
                explanation.append(TAG_MEANINGS.get(value, value))

        return explanation

    def extract_suffix(self, word, lemma):
        if word.startswith(lemma):
            suffix = word[len(lemma):]
            return suffix if suffix else None
        return None

    def get_suffix_meaning(self, suffix):
        return SUFFIX_MEANINGS.get(suffix, "Unknown")

    def analyze_word(self, word):
        results = []

        if word in self.data:
            for entry in self.data[word]:
                suffix = self.extract_suffix(word, entry["lemma"])

                results.append({
                    "word": word,
                    "analysis": entry,
                    "suffix": suffix,
                    "suffix_meaning": self.get_suffix_meaning(suffix),
                    "explanation": self.explain_tags(entry)
                })

            return results

        # fallback
        rule_results = apply_rules(word)

        for entry in rule_results:
            suffix = self.extract_suffix(word, entry["lemma"])

            results.append({
                "word": word,
                "analysis": entry,
                "suffix": suffix,
                "suffix_meaning": self.get_suffix_meaning(suffix),
                "explanation": self.explain_tags(entry)
            })

        return results if results else [{"word": word, "error": "No analysis found"}]

    # 🔥 Sentence analyzer
    def analyze(self, text):
        words = text.split()

        all_results = []

        for word in words:
            result = self.analyze_word(word)
            all_results.append(result)

        return all_results

    # 🔥 Suggestions
    def suggest(self, prefix):
        return [w for w in self.vocab if w.startswith(prefix)][:5]