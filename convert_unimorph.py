import json

INPUT_FILE = "unimorph.txt"
OUTPUT_FILE = "unimorph_clean.json"


def parse_tags(tag_string):
    tags = tag_string.split(";")

    parsed = {
        "pos": tags[0],
        "features": {}
    }

    for tag in tags[1:]:
        if tag in ["SG", "PL"]:
            parsed["features"]["number"] = tag

        elif tag in ["DEF", "INDF"]:
            parsed["features"]["definiteness"] = tag

        elif tag in ["ABS", "ERG", "DAT", "GEN", "LOC"]:
            parsed["features"]["case"] = tag

        else:
            # unknown / language-specific tags
            parsed["features"].setdefault("other", []).append(tag)

    return parsed


def convert_unimorph():
    data = {}

    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        for line_no, line in enumerate(f, start=1):
            line = line.strip()

            if not line:
                continue

            parts = line.split("\t")

            if len(parts) != 3:
                print(f"Skipping bad line {line_no}: {line}")
                continue

            lemma, surface, tags = parts

            parsed = parse_tags(tags)

            entry = {
                "lemma": lemma,
                "pos": parsed["pos"],
                "features": parsed["features"]
            }

            if surface not in data:
                data[surface] = []

            # avoid duplicate entries
            if entry not in data[surface]:
                data[surface].append(entry)

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print("Conversion complete. File saved as:", OUTPUT_FILE)


if __name__ == "__main__":
    convert_unimorph()